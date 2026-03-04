import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log("Reading local data from local_db_dump.json...");
    let data;
    try {
        const fileContent = fs.readFileSync('local_db_dump.json', 'utf-8');
        data = JSON.parse(fileContent);
    } catch (e) {
        console.error("Failed to read local_db_dump.json", e);
        process.exit(1);
    }

    console.log("Connected to Supabase. Starting direct Prisma imports...");

    // 1. Users
    if (data.users && data.users.length > 0) {
        console.log(`Importing ${data.users.length} users...`);
        for (const u of data.users) {
            try {
                await prisma.user.upsert({
                    where: { email: u.email },
                    update: {},
                    create: {
                        id: u.id,
                        email: u.email,
                        name: u.name,
                        role: u.role,
                        rollNumber: u.roll_number,
                        uniqueId: u.unique_id,
                        department: u.department,
                        passwordHash: u.password_hash,
                        avatarUrl: u.avatar_url,
                        createdAt: new Date(u.created_at),
                        updatedAt: new Date(u.updated_at),
                        deletedAt: u.deleted_at ? new Date(u.deleted_at) : null
                    }
                });
            } catch (e) { console.error("Error on user", u.email, e.message); }
        }
    }

    // 2. Feature Flags
    if (data.feature_flags && data.feature_flags.length > 0) {
        console.log(`Importing ${data.feature_flags.length} feature flags...`);
        for (const f of data.feature_flags) {
            try {
                await prisma.featureFlag.upsert({
                    where: { key: f.key },
                    update: {},
                    create: {
                        id: f.id,
                        key: f.key,
                        enabled: f.enabled,
                        description: f.description,
                        updatedAt: new Date(f.updated_at)
                    }
                });
            } catch (e) { console.error("Error on flag", f.key); }
        }
    }

    // 3. Visitor Passes
    if (data.visitor_passes && data.visitor_passes.length > 0) {
        console.log(`Importing ${data.visitor_passes.length} visitor passes...`);
        for (const vp of data.visitor_passes) {
            try {
                await prisma.visitorPass.upsert({
                    where: { passNumber: vp.pass_number },
                    update: {},
                    create: {
                        id: vp.id,
                        passNumber: vp.pass_number,
                        passType: vp.pass_type,
                        status: vp.status,
                        createdById: vp.created_by_id,
                        visitorName: vp.visitor_name,
                        visitorSex: vp.visitor_sex,
                        purpose: vp.purpose,
                        visitFrom: new Date(vp.visit_from),
                        visitTo: new Date(vp.visit_to),
                        visitorRelation: vp.visitor_relation,
                        visitorAge: vp.visitor_age,
                        visitorMobile: vp.visitor_mobile,
                        visitorIdType: vp.visitor_id_type,
                        visitorIdNumber: vp.visitor_id_number,
                        visitorPhotoUrl: vp.visitor_photo_url,
                        phoneConfirmedBy: vp.phone_confirmed_by,
                        pointOfContact: vp.point_of_contact,
                        hostelName: vp.hostel_name,
                        qrCodeData: vp.qr_code_data,
                        qrCodeUrl: vp.qr_code_url,
                        approvalRequired: vp.approval_required,
                        hostProfessorId: vp.host_professor_id,
                        ccEmails: vp.cc_emails,
                        emailSentTo: vp.email_sent_to,
                        emailSent: vp.email_sent,
                        createdAt: new Date(vp.created_at),
                        updatedAt: new Date(vp.updated_at),
                        deletedAt: vp.deleted_at ? new Date(vp.deleted_at) : null
                    }
                });
            } catch (e) { console.error("Error on pass", vp.pass_number, e.message); }
        }
    }

    // 4. Approval Requests
    if (data.approval_requests && data.approval_requests.length > 0) {
        console.log(`Importing ${data.approval_requests.length} approval requests...`);
        for (const ar of data.approval_requests) {
            try {
                await prisma.approvalRequest.upsert({
                    where: { passId: ar.pass_id },
                    update: {},
                    create: {
                        id: ar.id,
                        passId: ar.pass_id,
                        requestedById: ar.requested_by_id,
                        approverId: ar.approver_id,
                        status: ar.status,
                        remarks: ar.remarks,
                        decidedAt: ar.decided_at ? new Date(ar.decided_at) : null,
                        createdAt: new Date(ar.created_at),
                        updatedAt: new Date(ar.updated_at)
                    }
                });
            } catch (e) { console.error("Error on approval req", ar.id, e.message); }
        }
    }

    // Validate
    const userCount = await prisma.user.count();
    console.log(`Import complete. Database now has ${userCount} users.`);
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
