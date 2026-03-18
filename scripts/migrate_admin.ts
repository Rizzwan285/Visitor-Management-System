import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const newAdminEmail = 'student.iitpkd01@gmail.com';
    const oldAdminEmail = 'muhamed.rizwan2005@gmail.com';
    const password = process.env.VMS_SCRIPT_PASSWORD;
    if (!password) {
        throw new Error('VMS_SCRIPT_PASSWORD environment variable is required.');
    }
    const hash = await bcrypt.hash(password, 10);

    console.log(`🚀 Starting admin migration to ${newAdminEmail}...`);

    // 1. Setup new Admin
    const newAdmin = await prisma.user.upsert({
        where: { email: newAdminEmail },
        update: {
            role: Role.ADMIN,
            passwordHash: hash,
            name: 'VMS Admin',
            deletedAt: null
        },
        create: {
            email: newAdminEmail,
            role: Role.ADMIN,
            passwordHash: hash,
            name: 'VMS Admin',
        }
    });
    console.log(`✅ Set ${newAdmin.email} as ADMIN.`);

    // 2. Demote old Admin (if exists)
    try {
        const oldUser = await prisma.user.findUnique({ where: { email: oldAdminEmail } });
        if (oldUser) {
            await prisma.user.update({
                where: { email: oldAdminEmail },
                data: { role: Role.EMPLOYEE } // Demoting to EMPLOYEE
            });
            console.log(`✅ Demoted ${oldAdminEmail} to EMPLOYEE.`);
        }
    } catch (e) {
        console.log(`ℹ️ Old admin ${oldAdminEmail} not found or already demoted.`);
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`New Admin Email: ${newAdminEmail}`);
    console.log(`Password: ${password}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
