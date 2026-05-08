const moment = require('moment-timezone');
const TFC = require('../models/tfcSchema');
const TFCAttendance = require('../models/tfcAttendanceSchema');
const vjContests = require('../models/vjcontestdb2');

const DISCORD_MAX_LENGTH = 2000;

const parseDurationHours = (duration) => {
    const match = duration?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 4;
};

// Split an array of mention strings into chunks that fit within Discord's limit
const buildChunkedMessages = (header, mentions, footer) => {
    const messages = [];
    let current = header + '\n';

    for (let i = 0; i < mentions.length; i++) {
        const entry = (i === 0 ? '' : ', ') + mentions[i];
        // If adding this entry would exceed limit (leaving room for footer)
        if (current.length + entry.length + footer.length + 5 > DISCORD_MAX_LENGTH) {
            messages.push(current.trim());
            current = '';
        }
        current += entry;
    }

    // Last chunk gets the footer
    if (current.trim()) {
        current += '\n\n' + footer;
        messages.push(current.trim());
    }

    return messages;
};

async function sendAttendanceReminder(client) {
    const channelId = process.env.TFC_ATTENDANCE_CHANNEL;
    if (!channelId) {
        console.error('TFC_ATTENDANCE_CHANNEL is not set');
        return { sent: false, reason: 'No channel configured' };
    }

    const now = moment.utc();

    // Find TFC that ended between 0 and 3.5 hours ago
    const tfcList = await TFC.find({ date: { $ne: null }, contestId: { $ne: null } });

    let targetTFC = null;
    for (const tfc of tfcList) {
        const start = moment.utc(tfc.date);
        const durationHours = parseDurationHours(tfc.duration);
        const end = start.clone().add(durationHours, 'hours');

        const hoursSinceEnd = now.diff(end, 'minutes') / 60;
        if (hoursSinceEnd >= 0 && hoursSinceEnd <= 3.5) {
            targetTFC = tfc;
            break;
        }
    }

    if (!targetTFC) {
        return { sent: false, reason: 'No TFC ended within 0-3.5 hours' };
    }

    // Get contest participants from vjContest
    const vjContest = await vjContests.findOne(
        { contestId: String(targetTFC.contestId) },
        { "data.handle": 1 }
    );

    if (!vjContest || !vjContest.data || vjContest.data.length === 0) {
        return { sent: false, reason: `No VJudge contest data for TFC ${targetTFC.name}` };
    }

    const contestHandles = vjContest.data.map(entry => entry.handle);

    // Get all attendance records for this TFC
    const attendanceRecords = await TFCAttendance.find({ tfcId: targetTFC._id });

    const handlesWithStarting = new Set(
        attendanceRecords.filter(r => r.startingTime).map(r => r.vjHandle)
    );
    const handlesWithLeaving = new Set(
        attendanceRecords.filter(r => r.leavingTime).map(r => r.vjHandle)
    );

    // Handles that participated but didn't give starting attendance
    const noStartingHandles = contestHandles.filter(h => !handlesWithStarting.has(h));

    // Handles that gave starting but not leaving
    const noLeavingHandles = contestHandles.filter(h => handlesWithStarting.has(h) && !handlesWithLeaving.has(h));

    const channel = await client.channels.fetch(channelId);
    if (!channel) {
        return { sent: false, reason: 'Could not fetch attendance channel' };
    }

    let messagesSent = 0;

    // Message 1: Users who didn't provide starting attendance
    if (noStartingHandles.length > 0) {
        // Try to find discord IDs from previous attendance records
        const previousRecords = await TFCAttendance.find({
            vjHandle: { $in: noStartingHandles },
            tfcId: { $ne: targetTFC._id },
        });

        const handleToDiscordId = {};
        for (const rec of previousRecords) {
            if (rec.discordId && !handleToDiscordId[rec.vjHandle]) {
                handleToDiscordId[rec.vjHandle] = rec.discordId;
            }
        }

        const mentions = noStartingHandles.map(handle => {
            const discordId = handleToDiscordId[handle];
            if (discordId) {
                return `<@${discordId}> (\`${handle}\`)`;
            }
            return `\`${handle}\``;
        });

        const header = `⚠️ **${targetTFC.name}** - No starting attendance:`;
        const footer = `Submit: \`<Id> <VjHandle> <Room> started <time>\` & \`<Id> <VjHandle> left <time>\`\nTime: \`3:00PM\` or \`15:00\``;
        const chunks = buildChunkedMessages(header, mentions, footer);

        for (const msg of chunks) {
            await channel.send(msg);
            messagesSent++;
        }
    }

    // Message 2: Users who started but didn't mark leaving
    if (noLeavingHandles.length > 0) {
        const leavingRecords = attendanceRecords.filter(
            r => r.startingTime && !r.leavingTime && noLeavingHandles.includes(r.vjHandle)
        );

        const mentions = leavingRecords.map(rec => {
            return `<@${rec.discordId}> (\`${rec.vjHandle}\`)`;
        });

        const header = `⚠️ **${targetTFC.name}** - No leaving marked:`;
        const footer = `Submit: \`<Id> <VjHandle> leaving\` or \`<Id> <VjHandle> left <time>\`\nTime: \`3:00PM\` or \`15:00\``;
        const chunks = buildChunkedMessages(header, mentions, footer);

        for (const msg of chunks) {
            await channel.send(msg);
            messagesSent++;
        }
    }

    if (messagesSent === 0) {
        return { sent: false, reason: 'All participants have complete attendance' };
    }

    return { sent: true, tfc: targetTFC.name, noStarting: noStartingHandles.length, noLeaving: noLeavingHandles.length };
}

module.exports = { sendAttendanceReminder };
