import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@devlifeacademy.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
  const adminName = process.env.ADMIN_NAME || 'DevLife Admin';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin user already exists:', adminEmail);
    
    // Update to admin role and verify email if needed
    if (existingAdmin.role !== 'ADMIN' || !existingAdmin.isEmailVerified) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          role: 'ADMIN',
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
      });
      console.log('✅ Updated existing user to ADMIN role and verified email');
    }
  } else {
    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        isEmailVerified: true,
        bio: 'Platform administrator and content creator',
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  IMPORTANT: Change the admin password after first login!');
  }

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
