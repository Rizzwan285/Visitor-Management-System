import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching all users...");
    const users = await prisma.user.findMany();

    if (users.length === 0) {
        console.log("No users found in the database. Run the import script first.");
        return;
    }

    console.log(`Found ${users.length} users. Updating passwords...`);

    // We will set everyone's password to 'password123'
    const defaultPassword = 'password123';
    const hash = await bcrypt.hash(defaultPassword, 10);

    let updatedCount = 0;

    for (const user of users) {
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
    console.log(`🔑 All users can now log in using the password: ${defaultPassword}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
