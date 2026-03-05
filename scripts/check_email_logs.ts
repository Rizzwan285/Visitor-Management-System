import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching recent email logs...");
    const logs = await prisma.emailLog.findMany({
        orderBy: { sentAt: 'desc' },
        take: 5
    });

    if (logs.length === 0) {
        console.log("No email logs found.");
    } else {
        console.log("Recent email logs:");
        console.table(logs.map(l => ({
            to: l.toAddress,
            subject: l.subject,
            status: l.status,
            error: l.errorMessage,
            time: l.sentAt
        })));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
