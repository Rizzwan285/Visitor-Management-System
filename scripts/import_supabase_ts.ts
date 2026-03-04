import { PrismaClient } from '@prisma/client';
import fs from 'fs';

// This script expects 'local_db_dump.json' to exist in the current directory
// Make sure .env.local contains the Supabase connection string before running!
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

    const tables = [
        'users',
        'feature_flags',
        'visitor_passes',
        'approval_requests',
        'scan_logs',
        'email_logs',
        'audit_logs'
    ];

    console.log("Connecting to Supabase (via Prisma)...");

    for (const table of tables) {
        const rows = data[table] || [];
        if (rows.length === 0) {
            console.log(`Skipping ${table} (no data)`);
            continue;
        }

        console.log(`Importing ${rows.length} rows into ${table}...`);

        // Use Prisma's createMany / create depending on table format
        // Prisma expects camelCase for model names in the client
        const modelName = getPrismaModelName(table);
        if (!modelName) {
            console.warn(`Could not map table ${table} to a Prisma model.`);
            continue;
        }

        let successCount = 0;
        for (const row of rows) {
            try {
                // Remove deletedAt if null, Prisma handles it sometimes strictly
                // Convert string dates back to Date objects
                const cleanRow = { ...row };

                // For 'visitor_passes', fix camelCase properties since JSON dump uses snake_case column names
                // Wait, the JSON dump used snake_case columns. Prisma model `create` expects camelCase fields!
                // Using raw query allows us to bypass mapping:

                const columns = Object.keys(row).map(c => `"${c}"`).join(', ');
                const placeholders = Object.keys(row).map((_, i) => `$${i + 1}`).join(', ');
                const values = Object.values(row).map(v => {
                    // Prisma raw query needs proper Date objects or strings
                    return v;
                });

                await prisma.$executeRawUnsafe(
                    `INSERT INTO "${table}" (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                    ...values
                );
                successCount++;
            } catch (err) {
                console.error(`Error inserting row into ${table}:`, err);
            }
        }
        console.log(`Successfully imported ${successCount} rows into ${table}.`);
    }

    console.log("Migration complete!");
}

function getPrismaModelName(tableName: string) {
    const map: Record<string, string> = {
        'users': 'user',
        'feature_flags': 'featureFlag',
        'visitor_passes': 'visitorPass',
        'approval_requests': 'approvalRequest',
        'scan_logs': 'scanLog',
        'email_logs': 'emailLog',
        'audit_logs': 'auditLog'
    };
    return map[tableName];
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
