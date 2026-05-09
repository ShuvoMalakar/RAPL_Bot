/**
 * Temporary migration script to populate UserMapping from existing TFCAttendance records.
 * Run once: node scripts/migrateUserMappings.js
 */
require('dotenv').config();
const { db1, db2 } = require('../config/db');
const TFCAttendance = require('../models/tfcAttendanceSchema');
const UserMapping = require('../models/userMapping');

async function migrate() {
    await Promise.all([db1.asPromise(), db2.asPromise()]);
    console.log('Databases connected.');

    const attendanceRecords = await TFCAttendance.find({
        discordId: { $ne: null },
        studentId: { $ne: null },
    }).sort({ startingMessageTime: -1 }); // latest first

    const seen = new Set();
    let created = 0;
    let skipped = 0;

    for (const rec of attendanceRecords) {
        if (seen.has(rec.studentId)) {
            skipped++;
            continue;
        }
        seen.add(rec.studentId);

        try {
            await UserMapping.findOneAndUpdate(
                { studentId: rec.studentId },
                {
                    studentId: rec.studentId,
                    discordId: rec.discordId,
                    vjHandle: rec.vjHandle,
                },
                { upsert: true }
            );
            created++;
            console.log(`Mapped: ${rec.studentId} -> ${rec.discordId} (${rec.vjHandle})`);
        } catch (err) {
            console.error(`Error mapping ${rec.studentId}:`, err.message);
        }
    }

    console.log(`\nDone. Created/updated: ${created}, Skipped duplicates: ${skipped}`);
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
