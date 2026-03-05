import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log("Database URL:", process.env.DATABASE_URL);
    const email = 'admin@iitpkd.ac.in';
    const password = 'admin123';

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.log("User not found!");
        return;
    }

    console.log("User found:", user.email, "Hash:", user.passwordHash);

    const isValid = await bcrypt.compare(password, user.passwordHash!);
    console.log("Bcrypt compare result:", isValid);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
