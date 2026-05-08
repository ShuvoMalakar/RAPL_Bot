const moment = require('moment-timezone');
const TFC = require('../models/tfcSchema');

async function sendTfcAttendanceInfo(client) {
    const channelId = process.env.TFC_ATTENDANCE_CHANNEL;
    if (!channelId) {
        console.error('TFC_ATTENDANCE_CHANNEL is not set in .env');
        return;
    }

    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel) {
            console.error('Could not find TFC attendance channel');
            return;
        }

        // Find TFC starting within the next 1 hour
        const now = moment.utc();
        const oneHourLater = now.clone().add(1, 'hour');

        const upcomingTFC = await TFC.findOne({
            date: { $gte: now.toDate(), $lte: oneHourLater.toDate() }
        }).sort({ date: 1 });

        if (!upcomingTFC) {
            console.log('No TFC starting within 1 hour. Skipping attendance announcement.');
            return;
        }

        const tfcName = upcomingTFC.name;
        const tfcTime = moment.utc(upcomingTFC.date).tz('Asia/Dhaka').format('DD MMM YYYY, hh:mm A');

        const message = `@everyone\n\n` +
            `📢 **${tfcName}** is starting soon at **${tfcTime} (BST)**!\n\n` +
            `**Attendance System:**\n\n` +
            `▶️ **When entering the arena:**\n` +
            `\`<StudentId> <VjHandle> <RoomNo> starting\`\n` +
            `Example: \`2301234 Sayeef_Mahmud 201 starting\`\n\n` +
            `⏹️ **When leaving the arena:**\n` +
            `\`<StudentId> <VjHandle> leaving\`\n` +
            `Example: \`2301234 Sayeef_Mahmud leaving\`\n\n` +
            `🏠 If you are in the RAPL Lab, write **RAPL** instead of room number.\n` +
            `Valid rooms: **101, 102, 103, 104, 201, 202, 203, RAPL**\n\n` +
            `⚠️ **VJudge handle is case-sensitive. Student ID must be 7 digits.**\n` +
            `⚠️ **Late attendance will NOT be granted.**\n` +
            `⚠️ **If you fail to mark attendance properly, your TFC performance won't be counted.**`;

        await channel.send(message);
        console.log(`TFC attendance announcement sent for ${tfcName}.`);
    } catch (error) {
        console.error('Error sending TFC attendance info:', error.message);
    }
}

module.exports = { sendTfcAttendanceInfo };
