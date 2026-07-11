import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const passes = await prisma.visitorPass.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, visitorName: true, passType: true, visitorPhotoUrl: true }
    });
    console.log(passes);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
