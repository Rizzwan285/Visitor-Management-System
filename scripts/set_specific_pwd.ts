import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const userEmail = '142301026@smail.iitpkd.ac.in';
    const password = 'Rizwan2458!';
    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.findUnique({
        where: { email: userEmail }
    });

    if (!user) {
        console.error(`❌ User with email ${userEmail} not found!`);
        return;
    }

    await prisma.user.update({
        where: { email: userEmail },
        data: { passwordHash: hash }
    });

    console.log(`✅ Password updated successfully for ${userEmail}!`);
    console.log(`🔑 New Password: ${password}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
