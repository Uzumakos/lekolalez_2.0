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

        if (req.url === '/api/admin/db-action' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', async () => {
            res.setHeader('Content-Type', 'application/json');
            try {
              const authHeader = req.headers['authorization'] || '';
              const token = authHeader.replace(/^Bearer\s+/i, '').trim();
              if (!token) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'Non authentifié' }));
                return;
              }

              // 1. Verify caller session via Supabase Auth
              const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                  'apikey': serviceKey,
                  'Authorization': `Bearer ${token}`
                }
              });
              if (!userResp.ok) {
                res.statusCode = 401;
                res.end(JSON.stringify({ error: 'Session expirée ou invalide' }));
                return;
              }
              const authUser = await userResp.json();

              // 2. Check role in public.users (and auto-sync if missing)
              const profResp = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${authUser.id}&select=id,email,role,first_name,last_name`, {
                headers: {
                  'apikey': serviceKey,
                  'Authorization': `Bearer ${serviceKey}`
                }
              });
              const profRows = await profResp.json();
              const callerRole = Array.isArray(profRows) && profRows[0]?.role ? profRows[0].role : authUser.user_metadata?.role;

              if ((!Array.isArray(profRows) || profRows.length === 0) && callerRole) {
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
                    first_name: authUser.user_metadata?.first_name || 'Admin',
                    last_name: authUser.user_metadata?.last_name || 'User',
                    role: callerRole,
                    preferred_language: 'fr',
                    password: '**managed_by_supabase_auth**',
                    updated_at: new Date().toISOString()
                  })
                });
              }

              if (!['admin', 'super_admin', 'instructor'].includes(callerRole)) {
                res.statusCode = 403;
                res.end(JSON.stringify({ error: 'Privilèges insuffisants pour cette opération.' }));
                return;
              }

              const { operation, id, payload, instructorUpdate } = JSON.parse(body || '{}');
              const selectQuery = 'select=*,instructor:users!instructor_id(id,first_name,last_name,avatar,title,bio,location)';

              if (operation === 'course_create') {
                if (instructorUpdate && authUser.id) {
                  await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${authUser.id}`, {
                    method: 'PATCH',
                    headers: {
                      'apikey': serviceKey,
                      'Authorization': `Bearer ${serviceKey}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(instructorUpdate)
                  });
                }

                let createRes = await fetch(`${supabaseUrl}/rest/v1/courses?${selectQuery}`, {
                  method: 'POST',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  body: JSON.stringify(payload)
                });

                if (!createRes.ok) {
                  const errText = await createRes.text();
                  if (errText.includes('show_level')) {
                    const { show_level: _, ...safePayload } = payload;
                    createRes = await fetch(`${supabaseUrl}/rest/v1/courses?${selectQuery}`, {
                      method: 'POST',
                      headers: {
                        'apikey': serviceKey,
                        'Authorization': `Bearer ${serviceKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                      },
                      body: JSON.stringify(safePayload)
                    });
                  } else {
                    res.statusCode = createRes.status;
                    res.end(errText);
                    return;
                  }
                }

                const rows = await createRes.json();
                res.statusCode = 200;
                res.end(JSON.stringify({ data: Array.isArray(rows) ? rows[0] : rows }));
                return;
              }

              if (operation === 'course_update') {
                if (instructorUpdate && id) {
                  const cResp = await fetch(`${supabaseUrl}/rest/v1/courses?id=eq.${id}&select=instructor_id`, {
                    headers: {
                      'apikey': serviceKey,
                      'Authorization': `Bearer ${serviceKey}`
                    }
                  });
                  const cRows = await cResp.json();
                  const instId = Array.isArray(cRows) && cRows[0]?.instructor_id ? cRows[0].instructor_id : authUser.id;
                  if (instId) {
                    await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${instId}`, {
                      method: 'PATCH',
                      headers: {
                        'apikey': serviceKey,
                        'Authorization': `Bearer ${serviceKey}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify(instructorUpdate)
                    });
                  }
                }

                let updateRes = await fetch(`${supabaseUrl}/rest/v1/courses?id=eq.${id}&${selectQuery}`, {
                  method: 'PATCH',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                  },
                  body: JSON.stringify(payload)
                });

                if (!updateRes.ok) {
                  const errText = await updateRes.text();
                  if (errText.includes('show_level')) {
                    const { show_level: _, ...safePayload } = payload;
                    updateRes = await fetch(`${supabaseUrl}/rest/v1/courses?id=eq.${id}&${selectQuery}`, {
                      method: 'PATCH',
                      headers: {
                        'apikey': serviceKey,
                        'Authorization': `Bearer ${serviceKey}`,
                        'Content-Type': 'application/json',
                        'Prefer': 'return=representation'
                      },
                      body: JSON.stringify(safePayload)
                    });
                  } else {
                    res.statusCode = updateRes.status;
                    res.end(errText);
                    return;
                  }
                }

                const rows = await updateRes.json();
                res.statusCode = 200;
                res.end(JSON.stringify({ data: Array.isArray(rows) ? rows[0] : rows }));
                return;
              }

              if (operation === 'course_delete') {
                const delRes = await fetch(`${supabaseUrl}/rest/v1/courses?id=eq.${id}`, {
                  method: 'DELETE',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`
                  }
                });
                res.statusCode = delRes.ok ? 200 : delRes.status;
                res.end(JSON.stringify({ success: delRes.ok }));
                return;
              }

              if (operation === 'site_content_upsert') {
                const upsertRes = await fetch(`${supabaseUrl}/rest/v1/site_content?on_conflict=key`, {
                  method: 'POST',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates,return=representation'
                  },
                  body: JSON.stringify(payload)
                });
                const rows = await upsertRes.json();
                res.statusCode = upsertRes.ok ? 200 : upsertRes.status;
                res.end(JSON.stringify({ data: Array.isArray(rows) ? rows[0] : rows }));
                return;
              }

              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Opération non reconnue' }));
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
