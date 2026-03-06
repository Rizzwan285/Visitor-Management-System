import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const password = 'password123';
    const hash = await bcrypt.hash(password, 10);

    // 1. Update security@vms.local to security@iitpkd.ac.in
    try {
        await prisma.user.update({
            where: { email: 'security@vms.local' },
            data: { email: 'security@iitpkd.ac.in' }
        });
        console.log('✅ Updated security email to security@iitpkd.ac.in');
    } catch (e) {
        console.log('⚠️ Could not update security@vms.local (might not exist or already updated)');
    }

    // 2. Set password for all except specified
    const excludedEmails = ['muhamed.rizwan2005@gmail.com', '142301026@smail.iitpkd.ac.in'];

    const result = await prisma.user.updateMany({
        where: {
            email: { notIn: excludedEmails }
        },
        data: {
            passwordHash: hash
        }
    });

    console.log(`✅ Updated passwords to "${password}" for ${result.count} users (skipped excluded emails).`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
