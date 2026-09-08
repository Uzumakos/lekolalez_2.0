import 'dotenv/config';
import User from './models/User.js';

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@lekolalez.com' });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Role: ${existingAdmin.role}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      email: 'admin@lekolalez.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
      preferredLanguage: 'en'
    });

    console.log('✅ Admin user created successfully!');
    console.log('================================');
    console.log('  Email:    admin@lekolalez.com');
    console.log('  Password: admin123');
    console.log('  Role:     admin');
    console.log('================================');
    console.log('You can now login at /admin-portal');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
