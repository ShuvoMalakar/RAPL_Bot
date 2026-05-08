const moment = require('moment-timezone');
const TFC = require('../models/tfcSchema');
const TFCAttendance = require('../models/tfcAttendanceSchema');
const users = require('../models/userSchemadb2');

// Configurable valid room numbers
const VALID_ROOMS = ['101', '102', '103', '104', '201', '202', '203', 'RAPL'];

// Parse duration string like "4 hrs" to hours
const parseDurationHours = (duration) => {
    const match = duration?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 4;
};

// Find current or upcoming TFC (within 1 hour before start, or during contest)
const findActiveTFC = async () => {
    const now = moment.utc();

    const tfcList = await TFC.find({ date: { $ne: null } }).sort({ date: -1 });

    for (const tfc of tfcList) {
        const start = moment.utc(tfc.date);
        const durationHours = parseDurationHours(tfc.duration);
        const end = start.clone().add(durationHours, 'hours');
        const earlyWindow = start.clone().subtract(1, 'hour');

        // Active if within 1hr before start to end of contest
        if (now.isBetween(earlyWindow, end)) {
            return tfc;
        }
    }
    return null;
};

// Find active TFC for leaving (contest started, up to 4 hrs after contest ends)
const findActiveTFCForLeaving = async () => {
    const now = moment.utc();

    const tfcList = await TFC.find({ date: { $ne: null } }).sort({ date: -1 });

    for (const tfc of tfcList) {
        const start = moment.utc(tfc.date);
        const durationHours = parseDurationHours(tfc.duration);
        const end = start.clone().add(durationHours, 'hours');
        const leavingDeadline = end.clone().add(4, 'hours');

        // Valid for leaving: contest has started and within 4hrs after end
        if (now.isAfter(start) && now.isBefore(leavingDeadline)) {
            return tfc;
        }
    }
    return null;
};

async function handleTfcAttendance(message) {
    const content = message.content.trim();
    const args = content.split(/\s+/);

    if (args.length < 3 || args.length > 4) {
        return message.reply(`❌ Invalid format.\nStarting: \`<StudentId> <VjHandle> <RoomNo> starting\`\nLeaving: \`<StudentId> <VjHandle> leaving\` or \`<StudentId> <VjHandle> <RoomNo> leaving\``);
    }

    // Determine action (always last word)
    const actionLower = args[args.length - 1].toLowerCase();

    if (actionLower !== 'starting' && actionLower !== 'leaving') {
        return message.reply(`❌ Last word must be \`starting\` or \`leaving\`.`);
    }

    let studentId, vjHandle, roomNo;

    if (actionLower === 'starting') {
        if (args.length !== 4) {
            return message.reply(`❌ Starting format: \`<StudentId> <VjHandle> <RoomNo> starting\``);
        }
        [studentId, vjHandle, roomNo] = args;
    } else {
        // Leaving: room is optional
        if (args.length === 4) {
            [studentId, vjHandle, roomNo] = args;
        } else {
            [studentId, vjHandle] = args;
            roomNo = null;
        }
    }

    // Validate action
    if (actionLower !== 'starting' && actionLower !== 'leaving') {
        return message.reply(`❌ Last word must be \`starting\` or \`leaving\`.`);
    }

    // Validate student ID (7 digits)
    if (!/^\d{7}$/.test(studentId)) {
        return message.reply(`❌ Student ID must be exactly 7 digits.`);
    }

    // Validate room number (required for starting, optional for leaving)
    if (roomNo && !VALID_ROOMS.includes(roomNo)) {
        return message.reply(`❌ Invalid room. Valid: ${VALID_ROOMS.join(', ')}`);
    }

    // Verify user exists in DB with matching roll + vjHandle
    const user = await users.findOne({ roll: studentId });
    if (!user) {
        return message.reply(`❌ Roll \`${studentId}\` is not registered on rapl.site.`);
    }

    if (user.ojInfo?.vjHandle !== vjHandle) {
        const registeredHandle = user.ojInfo?.vjHandle || 'N/A';
        return message.reply(`❌ VJudge handle mismatch. Roll \`${studentId}\` is registered with handle \`${registeredHandle}\`, not \`${vjHandle}\`.`);
    }

    const now = moment.utc().toDate();

    if (actionLower === 'starting') {
        await handleStarting(message, studentId, vjHandle, roomNo, now);
    } else {
        await handleLeaving(message, studentId, vjHandle, roomNo, now);
    }
}

async function handleStarting(message, studentId, vjHandle, roomNo, now) {
    const tfc = await findActiveTFC();
    if (!tfc) {
        return message.reply(`❌ No TFC is currently active or starting within 1 hour.`);
    }

    // Check if already recorded starting for this TFC
    const existing = await TFCAttendance.findOne({
        studentId: studentId,
        tfcId: tfc._id,
        startingTime: { $ne: null },
    });

    if (existing) {
        return message.reply(`❌ Starting attendance already recorded for **${tfc.name}**.`);
    }

    // Upsert attendance record
    await TFCAttendance.findOneAndUpdate(
        { studentId: studentId, tfcId: tfc._id },
        {
            discordId: message.author.id,
            studentId: studentId,
            vjHandle: vjHandle,
            roomNo: roomNo,
            tfcId: tfc._id,
            startingMessageTime: now,
            startingTime: now,
        },
        { upsert: true, new: true }
    );

    const timeStr = moment(now).tz('Asia/Dhaka').format('hh:mm A');
    return message.reply(
        `✅ **Starting** recorded for **${tfc.name}**.\n` +
        `Roll: \`${studentId}\` | Handle: \`${vjHandle}\` | Time: ${timeStr}\n` +
        `At leaving, send: \`${studentId} ${vjHandle} ${roomNo} leaving\``
    );
}

async function handleLeaving(message, studentId, vjHandle, roomNo, now) {
    const tfc = await findActiveTFCForLeaving();
    if (!tfc) {
        return message.reply(`❌ No active TFC found or leaving window has passed.`);
    }

    const start = moment.utc(tfc.date);
    if (moment.utc(now).isBefore(start)) {
        return message.reply(`❌ Contest hasn't started yet. Can't record leaving.`);
    }

    // Check if user has starting attendance
    const existing = await TFCAttendance.findOne({
        studentId: studentId,
        tfcId: tfc._id,
        startingTime: { $ne: null },
    });

    if (!existing) {
        return message.reply(`❌ No starting attendance found for **${tfc.name}**. You must mark starting first.`);
    }

    if (existing.leavingTime) {
        return message.reply(`❌ Leaving attendance already recorded for **${tfc.name}**.`);
    }

    // Verify credentials match
    if (existing.vjHandle !== vjHandle) {
        return message.reply(`❌ VJudge handle doesn't match your starting record.`);
    }

    existing.leavingMessageTime = now;
    existing.leavingTime = now;
    if (roomNo) {
        existing.roomNo = roomNo;
    }
    await existing.save();

    const timeStr = moment(now).tz('Asia/Dhaka').format('hh:mm A');
    return message.reply(
        `✅ **Leaving** recorded for **${tfc.name}**.\n` +
        `Roll: \`${studentId}\` | Handle: \`${vjHandle}\` | Time: ${timeStr}`
    );
}

module.exports = { handleTfcAttendance };
