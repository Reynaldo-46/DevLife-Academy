# Admin Account Setup Guide

This guide explains how to create and access your admin account for DevLife Academy.

## 🔑 Creating the Admin Account

The platform uses a database seed script to create the initial admin account. Follow these steps:

### Step 1: Set Admin Credentials (Optional)

You can customize the admin account credentials by setting environment variables in your `.env` file:

```bash
# backend/.env
ADMIN_EMAIL="your-email@example.com"
ADMIN_PASSWORD="YourSecurePassword123!"
ADMIN_NAME="Your Name"
```

**Default credentials (if not set):**
- Email: `admin@devlifeacademy.com`
- Password: `AdminPassword123!`
- Name: `DevLife Admin`

### Step 2: Run Database Migrations

Make sure your database is set up and migrations are run:

```bash
cd backend
npx prisma migrate dev
```

### Step 3: Seed the Database

Run the seed script to create the admin account:

```bash
npm run prisma:seed
```

Or use the Prisma command directly:

```bash
npx prisma db seed
```

You should see output like this:

```
🌱 Starting database seed...
✅ Admin user created successfully!
📧 Email: admin@devlifeacademy.com
🔑 Password: AdminPassword123!
⚠️  IMPORTANT: Change the admin password after first login!
🎉 Database seed completed!
```

### Step 4: Login as Admin

1. Go to your frontend: `http://localhost:5173`
2. Click "Login" in the navigation bar
3. Enter your admin credentials:
   - Email: The email you set (or default `admin@devlifeacademy.com`)
   - Password: The password you set (or default `AdminPassword123!`)
4. You're now logged in as an admin! 🎉

## 🔒 Admin Privileges

As an admin, you have access to:

- ✅ **Upload Videos**: Create and publish new video content
- ✅ **Edit Videos**: Update video metadata, visibility, pricing
- ✅ **Delete Videos**: Remove videos from the platform
- ✅ **Create Playlists**: Organize videos into courses/playlists
- ✅ **Manage Playlists**: Add/remove videos, reorder content
- ✅ **Analytics Dashboard**: View platform statistics and metrics
- ✅ **Publish/Unpublish**: Control video visibility
- ✅ **All Viewer Features**: Comment, like, save videos

Regular viewers (non-admin users) can only:
- View published content (after email verification)
- Comment, like, and save videos
- Subscribe for premium content

## 🔧 Manual Admin Creation (Alternative Method)

If you need to manually create an admin account or promote an existing user to admin, you can use Prisma Studio:

### Option 1: Using Prisma Studio (GUI)

```bash
cd backend
npx prisma studio
```

This opens a web interface at `http://localhost:5555` where you can:
1. Navigate to the `User` model
2. Find or create a user
3. Set `role` to `ADMIN`
4. Set `isEmailVerified` to `true`

### Option 2: Using Database Query

Connect to your PostgreSQL database and run:

```sql
-- Promote existing user to admin
UPDATE "User" 
SET role = 'ADMIN', is_email_verified = true 
WHERE email = 'your-email@example.com';
```

### Option 3: Using Node.js Script

Create a file `backend/scripts/create-admin.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'your-email@example.com';
  const password = 'YourPassword123!';
  const name = 'Your Name';

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      isEmailVerified: true,
    },
    create: {
      email,
      name,
      passwordHash: hashedPassword,
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  console.log('Admin created:', admin.email);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with: `npx ts-node scripts/create-admin.ts`

## 🔐 Security Best Practices

1. **Change Default Password**: Always change the default admin password immediately after first login
2. **Strong Password**: Use a strong, unique password for the admin account
3. **Secure Environment Variables**: Never commit `.env` files to version control
4. **Production Setup**: In production, use secure password generation and storage
5. **Backup Admin Access**: Consider creating a backup admin account for recovery

## 📝 Updating Admin Profile

After logging in as admin, you can update your profile:

1. Go to your profile page
2. Update your name, bio, profile image
3. Change your password in account settings

## ❓ Troubleshooting

### "Invalid credentials" error
- Verify you're using the correct email and password
- Check your `.env` file for the configured credentials
- Try running the seed script again

### "Please verify your email" error
- The seed script automatically verifies the admin email
- If you created the account manually, make sure `isEmailVerified` is `true`

### Seed script says "Admin user already exists"
- This is normal if you've run the seed before
- The script will update the existing user to admin role if needed
- To reset, delete the user from database and run seed again

### Dashboard not showing
- Make sure you're logged in with an admin account
- Check that `role` is set to `ADMIN` in the database
- The Dashboard link only appears for admin users in the navbar

## 🚀 Next Steps

Once you're logged in as admin:

1. **Update Your Profile**: Add a bio and profile picture
2. **Upload Your First Video**: Go to Dashboard → Upload Video
3. **Create Playlists**: Organize your content into courses
4. **Test Viewer Access**: Create a test viewer account to see the user experience
5. **Configure Stripe**: Set up payment integration for premium content

---

For more information, see the main [README.md](README.md) or [QUICKSTART.md](QUICKSTART.md).
