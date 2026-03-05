import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching recent email logs (last 5)...");
    const logs = await prisma.emailLog.findMany({
        orderBy: { sentAt: 'desc' },
        take: 5
    });

    if (logs.length === 0) {
        console.log("No email logs found.");
    } else {
        logs.forEach(l => {
            console.log(`\n--- Log ID: ${l.id} ---`);
            console.log(`Time   : ${l.sentAt.toISOString()}`);
            console.log(`To     : ${l.toAddress}`);
            console.log(`Subject: ${l.subject}`);
            console.log(`Status : ${l.status}`);
            console.log(`Error  : ${l.errorMessage || 'None'}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
