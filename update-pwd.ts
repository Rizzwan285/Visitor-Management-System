import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('student123', 10);
    await prisma.user.update({
        where: { email: 'student01@smail.iitpkd.ac.in' },
        data: { passwordHash: hash }
    });
    console.log('Password updated successfully');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
