import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@iitpkd.ac.in';
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!user) {
        console.error(`❌ Admin user with email ${adminEmail} not found! Please run "npm run db:seed" first.`);
        return;
    }

    await prisma.user.update({
        where: { email: adminEmail },
        data: { passwordHash: hash }
    });

    console.log(`✅ Admin password updated successfully for ${adminEmail}!`);
    console.log(`🔑 New Password: ${password}`);
    console.log(`🌐 You can now login at /login using "Email & Password" option.`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
