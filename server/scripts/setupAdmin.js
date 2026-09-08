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
  console.error('\n❌ Missing Supabase configuration!');
  console.error('Ensure SUPABASE_URL and SUPABASE_KEY (service role) are defined in server/.env or .env\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const rl = readline.createInterface({ input, output });

  try {
    console.log('\n==============================================');
    console.log('       Lekol Alèz - Admin Account Setup        ');
    console.log('==============================================\n');

    let email = '';
    while (!email || !email.includes('@')) {
      email = (await rl.question('Enter Admin Email: ')).trim();
      if (!email || !email.includes('@')) {
        console.log('⚠️ Please enter a valid email address.');
      }
    }

    let password = '';
    while (!password || password.length < 6) {
      password = (await rl.question('Enter Admin Password (min 6 characters): ')).trim();
      if (!password || password.length < 6) {
        console.log('⚠️ Password must be at least 6 characters.');
      }
    }

    const firstNameInput = (await rl.question('Enter First Name [default: Admin]: ')).trim();
    const firstName = firstNameInput || 'Admin';

    const lastNameInput = (await rl.question('Enter Last Name [default: User]: ')).trim();
    const lastName = lastNameInput || 'User';

    console.log('\n⏳ Setting up administrator in Supabase...');

    // 1. Check if user already exists in auth.users
    const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error(`Auth list error: ${listError.message}`);

    let user = listData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (user) {
      console.log(`Found existing auth user (${user.id}). Updating password and metadata...`);
      const { data: updatedData, error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          password,
          email_confirm: true,
          user_metadata: {
            first_name: firstName,
            last_name: lastName,
            role: 'admin',
          },
        }
      );
      if (updateError) throw new Error(`Auth update error: ${updateError.message}`);
      user = updatedData.user;
    } else {
      console.log('Creating new auth user...');
      const { data: createdData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
        },
      });
      if (createError) throw new Error(`Auth create error: ${createError.message}`);
      user = createdData.user;
    }

    // 2. Ensure row in public.users has role = 'admin'
    console.log('Updating public.users table...');
    const { error: profileError } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      first_name: firstName,
      last_name: lastName,
      role: 'admin',
      preferred_language: 'en',
      password: '**managed_by_supabase_auth**',
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      throw new Error(`Profile upsert error: ${profileError.message}`);
    }

    console.log('\n✅ Admin account configured successfully!');
    console.log('==============================================');
    console.log(`  Email:    ${user.email}`);
    console.log(`  Role:     admin`);
    console.log(`  User ID:  ${user.id}`);
    console.log('==============================================');
    console.log('\nYou can now log in at /admin-portal in your browser.\n');
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
  } finally {
    rl.close();
  }
}

main();
