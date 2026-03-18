import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'muhamed.rizwan2005@gmail.com';
    const rawPassword = process.env.VMS_SCRIPT_PASSWORD;
    if (!rawPassword) {
        throw new Error('VMS_SCRIPT_PASSWORD environment variable is required.');
    }

    console.log(`Setting up ADMIN account for ${email}...`);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(rawPassword, salt);

    // Upsert user
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'ADMIN',
            passwordHash,
            name: 'Admin Rizwan',
            deletedAt: null // ensure it's not marked as deleted
        },
        create: {
            email,
            role: 'ADMIN',
            passwordHash,
            name: 'Admin Rizwan',
        }
    });

    console.log(`Success! Account ${user.email} is now an ADMIN.`);
    console.log(`Use the password provided to login.`);
}

main()
    .catch(e => {
        console.error("Error setting admin:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
