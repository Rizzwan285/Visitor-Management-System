import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching all users...");
    const users = await prisma.user.findMany();

    if (users.length === 0) {
        console.log("No users found in the database.");
        return;
    }

    const excludedEmail = '142301026@smail.iitpkd.ac.in';
    const newPassword = 'admin123';
    const hash = await bcrypt.hash(newPassword, 10);

    let updatedCount = 0;

    for (const user of users) {
        if (user.email === excludedEmail) {
            console.log(`⏩ Skipping excluded account: ${user.email} (${user.role})`);
            continue;
        }

        try {
            await prisma.user.update({
                where: { id: user.id },
                data: { passwordHash: hash }
            });
            console.log(`✅ Updated password for ${user.email} (${user.role})`);
            updatedCount++;
        } catch (error) {
            console.error(`❌ Failed to update password for ${user.email}:`, error);
        }
    }

    console.log(`\n🎉 Successfully updated ${updatedCount} users!`);
    console.log(`🔑 All updated users can now log in using the password: ${newPassword}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
