import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function adminSetupPlugin(supabaseUrl: string, serviceKey: string) {
  return {
    name: 'admin-setup-plugin',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url === '/api/admin/setup-super-admin' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const { email, password, firstName, lastName } = JSON.parse(body || '{}');
              if (!email || !password) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Email et mot de passe requis' }));
                return;
              }

              // 1. Check if super_admin already exists in public.users
              const checkResp = await fetch(`${supabaseUrl}/rest/v1/users?role=eq.super_admin&select=id`, {
                headers: {
                  'apikey': serviceKey,
                  'Authorization': `Bearer ${serviceKey}`
                }
              });
              const existingSuperAdmins = await checkResp.json();
              if (Array.isArray(existingSuperAdmins) && existingSuperAdmins.length > 0) {
                res.statusCode = 403;
                res.end(JSON.stringify({ error: 'Un Super Administrateur existe déjà sur la plateforme.' }));
                return;
              }

              // 2. Create or update user in Supabase auth via admin endpoint (bypasses public MX checks)
              let authUser: any = null;

              const listResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                headers: {
                  'apikey': serviceKey,
                  'Authorization': `Bearer ${serviceKey}`
                }
              });
              const listData = await listResp.json();
              const existingAuth = listData.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

              if (existingAuth) {
                const updateResp = await fetch(`${supabaseUrl}/auth/v1/admin/users/${existingAuth.id}`, {
                  method: 'PUT',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    password,
                    email_confirm: true,
                    user_metadata: {
                      first_name: firstName || 'Super',
                      last_name: lastName || 'Admin',
                      role: 'super_admin'
                    }
                  })
                });
                authUser = await updateResp.json();
              } else {
                // Ensure no orphaned row exists in public.users to prevent unique constraint conflict
                await fetch(`${supabaseUrl}/rest/v1/users?email=eq.${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`
                  }
                });

                const createResp = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
                  method: 'POST',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    email,
                    password,
                    email_confirm: true,
                    user_metadata: {
                      first_name: firstName || 'Super',
                      last_name: lastName || 'Admin',
                      role: 'super_admin'
                    }
                  })
                });
                const createData = await createResp.json();
                if (!createResp.ok || createData.error) {
                  res.statusCode = createResp.status || 400;
                  res.end(JSON.stringify({ error: createData.msg || createData.error_description || createData.error || 'Erreur lors de la création du compte auth' }));
                  return;
                }
                authUser = createData;
              }

              // 3. Upsert into public.users with role = 'super_admin'
              await fetch(`${supabaseUrl}/rest/v1/users`, {
                method: 'POST',
                headers: {
                  'apikey': serviceKey,
                  'Authorization': `Bearer ${serviceKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'resolution=merge-duplicates'
                },
                body: JSON.stringify({
                  id: authUser.id,
                  email: authUser.email,
                  first_name: firstName || 'Super',
                  last_name: lastName || 'Admin',
                  role: 'super_admin',
                  preferred_language: 'fr',
                  password: '**managed_by_supabase_auth**',
                  updated_at: new Date().toISOString()
                })
              });

              // 4. Record audit log
              try {
                await fetch(`${supabaseUrl}/rest/v1/audit_logs`, {
                  method: 'POST',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    user_id: authUser.id,
                    user_email: authUser.email,
                    user_role: 'super_admin',
                    user_name: `${firstName || 'Super'} ${lastName || 'Admin'}`.trim(),
                    action: 'super_admin_initialized',
                    action_category: 'system',
                    target_type: 'user',
                    target_id: authUser.id,
                    target_label: authUser.email,
                    details: { method: 'portal_initial_setup', email: authUser.email },
                    ip_address: req.socket?.remoteAddress || '127.0.0.1',
                    created_at: new Date().toISOString()
                  })
                });
              } catch (e) {
                console.warn('Audit log insert notice:', e);
              }

              res.statusCode = 200;
              res.end(JSON.stringify({
                success: true,
                message: 'Compte Super Admin créé avec succès !',
                user: {
                  id: authUser.id,
                  email: authUser.email,
                  firstName: firstName || 'Super',
                  lastName: lastName || 'Admin',
                  fullName: `${firstName || 'Super'} ${lastName || 'Admin'}`.trim(),
                  role: 'super_admin'
                }
              }));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message || 'Erreur serveur' }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const serverEnv = loadEnv('', path.resolve(__dirname, 'server'), '');
    const supabaseUrl = serverEnv.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://ihxfhhmhieqthcvabktm.supabase.co';
    const supabaseServiceKey = serverEnv.SUPABASE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImloeGZoaG1oaWVxdGhjdmFia3RtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjQ3MjA1OCwiZXhwIjoyMTAyMDQ4MDU4fQ.Mj0F0VWQIJnRZ8zAzKcSFFM7pGMhbF1nU7sXo8SZxbs';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        adminSetupPlugin(supabaseUrl, supabaseServiceKey)
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
