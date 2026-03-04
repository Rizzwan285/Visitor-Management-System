import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Environment DATABASE_URL:", process.env.DATABASE_URL);

    console.log("Querying users...");
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users in the database.`);

    if (users.length > 0) {
        console.table(users.map(u => ({ email: u.email, role: u.role })));
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
