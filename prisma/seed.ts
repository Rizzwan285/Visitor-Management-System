import { PrismaClient, Role, PassType, PassStatus, Sex, ApprovalStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
function generatePassNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
    return `VMS-${date}-${suffix}`;
}

async function main() {
    console.log('🌱 Seeding database...');

    const securityPassword = process.env.VMS_SCRIPT_PASSWORD;
    if (!securityPassword) {
        throw new Error('VMS_SCRIPT_PASSWORD environment variable is required for seeding.');
    }

    // ─── Users (one per role) ─────────────────────────

    const employeeUser = await prisma.user.upsert({
        where: { email: 'john.doe@iitpkd.ac.in' },
        update: {},
        create: {
            id: uuidv4(),
            email: 'john.doe@iitpkd.ac.in',
            name: 'Dr. John Doe',
            role: Role.EMPLOYEE,
            uniqueId: '1000000001',
            department: 'Computer Science',
        },
    });
    console.log(`  ✓ Employee: ${employeeUser.email}`);

    const studentUser = await prisma.user.upsert({
        where: { email: 'student01@smail.iitpkd.ac.in' },
        update: {},
        create: {
            id: uuidv4(),
            email: 'student01@smail.iitpkd.ac.in',
            name: 'Arjun Kumar',
            role: Role.STUDENT,
            rollNumber: '112201001',
            department: 'Computer Science',
        },
    });
    console.log(`  ✓ Student: ${studentUser.email}`);

    const officialUser = await prisma.user.upsert({
        where: { email: 'office_cs@iitpkd.ac.in' },
        update: {},
        create: {
            id: uuidv4(),
            email: 'office_cs@iitpkd.ac.in',
            name: 'CS Office',
            role: Role.OFFICIAL,
            uniqueId: '1000000003',
            department: 'Computer Science',
        },
    });
    console.log(`  ✓ Official: ${officialUser.email}`);

    const wardenUser = await prisma.user.upsert({
        where: { email: 'warden1@iitpkd.ac.in' },
        update: { passwordHash: bcrypt.hashSync('password123', 10) },
        create: {
            id: uuidv4(),
            email: 'warden1@iitpkd.ac.in',
            name: 'Assistant Warden',
            role: Role.OFFICIAL,
            uniqueId: '1000000006',
            department: 'Hostel Administration',
            passwordHash: bcrypt.hashSync('password123', 10),
        },
    });
    console.log(`  ✓ Assistant Warden: ${wardenUser.email}`);

    const securityUser = await prisma.user.upsert({
        where: { email: 'security@iitpkd.ac.in' },
        update: { passwordHash: bcrypt.hashSync(securityPassword, 10) },
        create: {
            id: uuidv4(),
            email: 'security@iitpkd.ac.in',
            name: 'Gate Security',
            role: Role.SECURITY,
            uniqueId: '1000000004',
            passwordHash: bcrypt.hashSync(securityPassword, 10),
        },
    });
    console.log(`  ✓ Security: ${securityUser.email}`);

    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@iitpkd.ac.in' },
        update: {},
        create: {
            id: uuidv4(),
            email: 'admin@iitpkd.ac.in',
            name: 'System Admin',
            role: Role.ADMIN,
            uniqueId: '1000000005',
            department: 'Administration',
        },
    });
    console.log(`  ✓ Admin: ${adminUser.email}`);

    const oicUser = await prisma.user.upsert({
        where: { email: 'oic.studentsection@iitpkd.ac.in' },
        update: { passwordHash: bcrypt.hashSync('password123', 10) },
        create: {
            id: uuidv4(),
            email: 'oic.studentsection@iitpkd.ac.in',
            name: 'Officer-in-Charge, Student Section',
            role: Role.OIC_STUDENT_SECTION,
            passwordHash: bcrypt.hashSync('password123', 10),
            department: 'Student Section',
        },
    });
    console.log(`  ✓ OIC Student Section: ${oicUser.email}`);

    // ─── Feature Flags ────────────────────────────────

    await prisma.featureFlag.upsert({
        where: { key: 'approval_required_student_guest' },
        update: {},
        create: {
            key: 'approval_required_student_guest',
            enabled: true,
            description: 'Require faculty/admin approval for student guest passes',
        },
    });

    await prisma.featureFlag.upsert({
        where: { key: 'approval_required_employee_guest' },
        update: {},
        create: {
            key: 'approval_required_employee_guest',
            enabled: false,
            description: 'Require approval for employee guest passes (disabled by default)',
        },
    });
    console.log('  ✓ Feature flags seeded');

    // ─── Sample Visitor Passes ────────────────────────

    const employeePass = await prisma.visitorPass.create({
        data: {
            passNumber: generatePassNumber(),
            passType: PassType.EMPLOYEE_GUEST,
            status: PassStatus.ACTIVE,
            createdById: employeeUser.id,
            visitorName: 'Jane Smith',
            visitorSex: Sex.FEMALE,
            purpose: 'Project meeting',
            visitFrom: new Date(),
            visitTo: new Date(Date.now() + 24 * 60 * 60 * 1000),
            qrCodeData: `VMS:placeholder-emp:00000000`,
            emailSent: false,
        },
    });
    console.log(`  ✓ Employee guest pass: ${employeePass.passNumber}`);

    const studentPass = await prisma.visitorPass.create({
        data: {
            passNumber: generatePassNumber(),
            passType: PassType.STUDENT_GUEST,
            status: PassStatus.PENDING_APPROVAL,
            createdById: studentUser.id,
            visitorName: 'Lakshmi Kumar',
            visitorSex: Sex.FEMALE,
            visitorRelation: 'Mother',
            visitorAge: 52,
            purpose: 'Campus visit',
            visitFrom: new Date(),
            visitTo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            qrCodeData: `VMS:placeholder-stu:00000000`,
            approvalRequired: true,
            hostProfessorId: employeeUser.id,
            emailSent: false,
            approvalRequest: {
                create: {
                    requestedById: studentUser.id,
                    approverId: adminUser.id,
                    status: ApprovalStatus.PENDING,
                },
            },
        },
    });
    console.log(`  ✓ Student guest pass (pending): ${studentPass.passNumber}`);

    const walkinPass = await prisma.visitorPass.create({
        data: {
            passNumber: generatePassNumber(),
            passType: PassType.WALKIN,
            status: PassStatus.ACTIVE,
            createdById: securityUser.id,
            visitorName: 'Ravi Shankar',
            visitorSex: Sex.MALE,
            visitorMobile: '9876543210',
            visitorAge: 35,
            purpose: 'Delivery',
            pointOfContact: 'Dr. John Doe',
            phoneConfirmedBy: 'Dr. John Doe',
            visitorIdType: 'Aadhar',
            visitorIdNumber: '1234-5678-9012',
            visitFrom: new Date(),
            visitTo: new Date(Date.now() + 8 * 60 * 60 * 1000),
            qrCodeData: `VMS:placeholder-walk:00000000`,
            emailSent: false,
        },
    });
    console.log(`  ✓ Walk-in pass: ${walkinPass.passNumber}`);

    console.log('\n✅ Seeding complete!');
    console.log(`   Users: 5 | Feature Flags: 2 | Passes: 3`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
