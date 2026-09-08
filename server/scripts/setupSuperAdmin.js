import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from server/.env and root .env
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('\n❌ Configuration Supabase introuvable !');
  console.error('Assurez-vous que SUPABASE_URL et SUPABASE_KEY (service role) sont définis dans server/.env ou .env\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log('\n==============================================');
    console.log('    Lekòl Alèz - Configuration Super Admin    ');
    console.log('==============================================\n');

    // 1. Check if a super_admin already exists
    const { data: existingSuper, error: checkErr } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'super_admin');

    if (!checkErr && existingSuper && existingSuper.length > 0) {
      console.log(`⚠️ Un Super Administrateur existe déjà : ${existingSuper[0].email}`);
      const proceed = (await rl.question('Voulez-vous modifier son mot de passe ou réinitialiser ? (o/N): ')).trim().toLowerCase();
      if (proceed !== 'o' && proceed !== 'oui' && proceed !== 'y') {
        console.log('Opération annulée.');
        rl.close();
        return;
      }
    }

    let email = '';
    while (!email || !email.includes('@')) {
      email = (await rl.question('Email du Super Admin [ex: erns@lekolalez.com]: ')).trim();
      if (!email || !email.includes('@')) {
        console.log('⚠️ Veuillez entrer une adresse email valide.');
      }
    }

    let password = '';
    while (!password || password.length < 6) {
      password = (await rl.question('Mot de passe du Super Admin (minimum 6 caractères): ')).trim();
      if (!password || password.length < 6) {
        console.log('⚠️ Le mot de passe doit comporter au moins 6 caractères.');
      }
    }

    const firstNameInput = (await rl.question('Prénom [défaut: Super]: ')).trim();
    const firstName = firstNameInput || 'Super';

    const lastNameInput = (await rl.question('Nom [défaut: Admin]: ')).trim();
    const lastName = lastNameInput || 'Admin';

    console.log('\n⏳ Configuration du Super Administrateur dans Supabase...');

    // 2. Check if user already exists in auth.users
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error(`Erreur Auth list: ${listError.message}`);

    let user = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (user) {
      console.log(`Utilisateur existant trouvé (${user.id}). Mise à jour du rôle en super_admin et mot de passe...`);
      const { data: updatedData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: 'super_admin',
          },
        }
      );
      if (updateError) throw new Error(`Erreur Auth update: ${updateError.message}`);
      user = updatedData.user;
    } else {
      console.log('Création d\'un nouvel utilisateur auth...');
      const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: 'super_admin',
        },
      });
      if (createError) throw new Error(`Erreur Auth create: ${createError.message}`);
      user = createdData.user;
    }

    // 3. Ensure row in public.users has role = 'super_admin'
    console.log('Mise à jour de la table public.users...');
    const { error: profileError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      role: 'super_admin',
      preferred_language: 'fr',
      password: '**managed_by_supabase_auth**',
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      throw new Error(`Erreur upsert profil: ${profileError.message}`);
    }

    // 4. Log audit event
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        user_email: user.email,
        user_role: 'super_admin',
        user_name: `${firstName} ${lastName}`,
        action: 'super_admin_initialized',
        action_category: 'system',
        target_type: 'user',
        target_id: user.id,
        target_label: user.email,
        details: { method: 'cli_setup_super_admin', email: user.email },
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Notice audit log insert:', e);
    }

    console.log('\n✅ Compte Super Admin configuré avec succès !');
    console.log('==============================================');
    console.log(`  Email:    ${user.email}`);
    console.log(`  Rôle:     super_admin`);
    console.log(`  User ID:  ${user.id}`);
    console.log('==============================================\n');
    console.log('Vous pouvez maintenant vous connecter sur /admin avec ces identifiants.\n');

  } catch (err) {
    console.error('\n❌ Erreur:', err.message);
  } finally {
    rl.close();
  }
}

main();
