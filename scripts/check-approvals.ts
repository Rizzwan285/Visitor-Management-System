import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const passes = await prisma.visitorPass.findMany({
        where: {
            status: 'PENDING_APPROVAL',
            approvalRequest: null,
        },
        include: {
            createdBy: { select: { email: true, role: true } }
        }
    });

    const allPending = await prisma.visitorPass.findMany({
        where: { status: 'PENDING_APPROVAL' },
        include: { approvalRequest: true }
    });

    const data = {
        missingApprovalsCount: passes.length,
        missing: passes.map(p => ({
            id: p.id,
            type: p.passType,
            status: p.status,
            userEmail: p.createdBy?.email,
            userRole: p.createdBy?.role
        })),
        allPendingCount: allPending.length,
        all: allPending.map(p => ({
            id: p.id,
            type: p.passType,
            hasApprovalReq: !!p.approvalRequest,
            approverId: p.approvalRequest?.approverId
        }))
    };

    fs.writeFileSync('out.json', JSON.stringify(data, null, 2), 'utf-8');
    console.log('Saved to out.json');
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
