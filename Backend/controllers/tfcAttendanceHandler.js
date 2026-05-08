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

// Parse user-provided time (e.g. "4:00PM", "6:00pm", "15:30") in BD timezone to UTC Date
const parseUserTime = (timeStr, referenceDate) => {
    const refBD = moment.utc(referenceDate).tz('Asia/Dhaka');
    const dateStr = refBD.format('DD/MM/YYYY');
    const dateTimeString = `${dateStr} ${timeStr}`;

    // Try 12-hour format first (e.g. 4:00PM)
    let parsed = moment.tz(dateTimeString, "DD/MM/YYYY h:mmA", "Asia/Dhaka");
    if (parsed.isValid()) return parsed.utc().toDate();

    // Try 24-hour format (e.g. 15:30)
    parsed = moment.tz(dateTimeString, "DD/MM/YYYY H:mm", "Asia/Dhaka");
    if (parsed.isValid()) return parsed.utc().toDate();

    return null;
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

// Find TFC eligible for late attendance (within 6 hours after contest ends)
const findTFCForLateAttendance = async () => {
    const now = moment.utc();

    const tfcList = await TFC.find({ date: { $ne: null } }).sort({ date: -1 });

    for (const tfc of tfcList) {
        const start = moment.utc(tfc.date);
        const durationHours = parseDurationHours(tfc.duration);
        const end = start.clone().add(durationHours, 'hours');
        const lateDeadline = end.clone().add(6, 'hours');

        if (now.isAfter(start) && now.isBefore(lateDeadline)) {
            return tfc;
        }
    }
    return null;
};

// Common validation for studentId, room, and user lookup
const validateCommon = async (message, studentId, vjHandle, roomNo, roomRequired) => {
    if (!/^\d{7}$/.test(studentId)) {
        await message.reply(`❌ Student ID must be exactly 7 digits.`);
        return null;
    }

    if (roomRequired && !roomNo) {
        await message.reply(`❌ Room number is required.`);
        return null;
    }

    if (roomNo && !VALID_ROOMS.includes(roomNo.toUpperCase())) {
        await message.reply(`❌ Invalid room. Valid: ${VALID_ROOMS.join(', ')}`);
        return null;
    }

    const user = await users.findOne({ roll: studentId });
    if (!user) {
        await message.reply(`❌ Roll \`${studentId}\` is not registered on rapl.site.`);
        return null;
    }

    if (user.ojInfo?.vjHandle !== vjHandle) {
        const registeredHandle = user.ojInfo?.vjHandle || 'N/A';
        await message.reply(`❌ VJudge handle mismatch. Roll \`${studentId}\` is registered with handle \`${registeredHandle}\`, not \`${vjHandle}\`.`);
        return null;
    }

    return user;
};

async function handleTfcAttendance(message) {
    const content = message.content.trim();
    let args = content.split(/\s+/);

    // Join trailing AM/PM to the previous time arg (e.g. "3:00 PM" -> "3:00PM")
    if (args.length >= 2) {
        const last = args[args.length - 1].toLowerCase();
        if (last === 'am' || last === 'pm') {
            args[args.length - 2] = args[args.length - 2] + args[args.length - 1];
            args.pop();
        }
    }

    // Detect action keyword and its position
    // Formats:
    //   <id> <handle> <room> starting          (4 args)
    //   <id> <handle> leaving                  (3 args)
    //   <id> <handle> <room> leaving           (4 args)
    //   <id> <handle> <room> started <time>    (5 args)
    //   <id> <handle> <room> left <time>       (5 args)
    //   <id> <handle> left <time>              (4 args)

    if (args.length < 3 || args.length > 5) {
        return message.reply(
            `❌ Invalid format.\n` +
            `Starting: \`<Id> <VjHandle> <Room> starting\`\n` +
            `Leaving: \`<Id> <VjHandle> leaving\`\n` +
            `Late start: \`<Id> <VjHandle> <Room> started <time>\`\n` +
            `Late leave: \`<Id> <VjHandle> left <time>\`\n` +
            `Time format: \`3:00PM\` or \`15:00\``
        );
    }

    // 5 args: late started/left with time
    if (args.length === 5) {
        const actionLower = args[3].toLowerCase();
        if (actionLower === 'started') {
            return await handleLateStarting(message, args[0], args[1], args[2], args[4]);
        } else if (actionLower === 'left') {
            return await handleLateLeaving(message, args[0], args[1], args[2], args[4]);
        } else {
            return message.reply(
                `❌ 4th word must be \`started\` or \`left\`.\n` +
                `Late start: \`<Id> <VjHandle> <Room> started <time>\`\n` +
                `Late leave: \`<Id> <VjHandle> <Room> left <time>\`\n` +
                `Time format: \`3:00PM\` or \`15:00\``
            );
        }
    }

    // 4 args: could be starting, leaving (with room), left <time> (no room), started <time> (no room)
    if (args.length === 4) {
        const actionLower = args[3].toLowerCase();
        if (actionLower === 'starting') {
            const valid = await validateCommon(message, args[0], args[1], args[2], true);
            if (!valid) return;
            return await handleStarting(message, args[0], args[1], args[2], message.createdAt);
        } else if (actionLower === 'leaving') {
            const valid = await validateCommon(message, args[0], args[1], args[2], false);
            if (!valid) return;
            return await handleLeaving(message, args[0], args[1], args[2], message.createdAt);
        } else if (args[2].toLowerCase() === 'left') {
            // <id> <handle> left <time>
            return await handleLateLeaving(message, args[0], args[1], null, args[3]);
        } else if (args[2].toLowerCase() === 'started') {
            // <id> <handle> started <time> (no room) - room is required
            return message.reply(`❌ Room number is required for starting.\nUsage: \`<Id> <VjHandle> <Room> started <time>\`\nTime format: \`3:00PM\` or \`15:00\``);
        } else {
            return message.reply(
                `❌ Unrecognized command.\n` +
                `Starting: \`<Id> <VjHandle> <Room> starting\`\n` +
                `Leaving: \`<Id> <VjHandle> leaving\`\n` +
                `Late start: \`<Id> <VjHandle> <Room> started <time>\`\n` +
                `Late leave: \`<Id> <VjHandle> left <time>\`\n` +
                `Time format: \`3:00PM\` or \`15:00\``
            );
        }
    }

    // 3 args: leaving without room
    if (args.length === 3) {
        const actionLower = args[2].toLowerCase();
        if (actionLower === 'leaving') {
            const valid = await validateCommon(message, args[0], args[1], null, false);
            if (!valid) return;
            return await handleLeaving(message, args[0], args[1], null, message.createdAt);
        } else {
            return message.reply(`❌ Expected \`leaving\` as 3rd word.`);
        }
    }
}

async function handleStarting(message, studentId, vjHandle, roomNo, now) {
    const tfc = await findActiveTFC();
    if (!tfc) {
        return message.reply(`❌ No TFC is currently active or starting within 1 hour.`);
    }

    const existing = await TFCAttendance.findOne({
        studentId: studentId,
        tfcId: tfc._id,
        startingTime: { $ne: null },
    });

    if (existing) {
        return message.reply(`❌ Starting attendance already recorded for **${tfc.name}**.`);
    }

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
        `At leaving, send: \`${studentId} ${vjHandle} leaving\``
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

async function handleLateStarting(message, studentId, vjHandle, roomNo, timeStr) {
    const valid = await validateCommon(message, studentId, vjHandle, roomNo, true);
    if (!valid) return;

    const tfc = await findTFCForLateAttendance();
    if (!tfc) {
        return message.reply(`❌ No TFC found eligible for late attendance.`);
    }

    const tfcStart = moment.utc(tfc.date);
    const durationHours = parseDurationHours(tfc.duration);
    const tfcEnd = tfcStart.clone().add(durationHours, 'hours');

    const parsedTime = parseUserTime(timeStr, tfc.date);
    if (!parsedTime) {
        return message.reply(`❌ Invalid time format. Use \`h:mmAM/PM\` (e.g., 4:00PM) or \`HH:mm\` (e.g., 16:00).`);
    }

    const parsedMoment = moment.utc(parsedTime);

    if (parsedMoment.isBefore(tfcStart)) {
        return message.reply(`❌ Starting time can't be before contest start (${tfcStart.tz('Asia/Dhaka').format('hh:mm A')}).`);
    }

    if (parsedMoment.isAfter(tfcEnd)) {
        return message.reply(`❌ Starting time can't be after contest end (${tfcEnd.tz('Asia/Dhaka').format('hh:mm A')}).`);
    }

    const existing = await TFCAttendance.findOne({
        studentId: studentId,
        tfcId: tfc._id,
        startingTime: { $ne: null },
    });

    if (existing) {
        return message.reply(`❌ Starting attendance already recorded for **${tfc.name}**.`);
    }

    await TFCAttendance.findOneAndUpdate(
        { studentId: studentId, tfcId: tfc._id },
        {
            discordId: message.author.id,
            studentId: studentId,
            vjHandle: vjHandle,
            roomNo: roomNo,
            tfcId: tfc._id,
            startingMessageTime: message.createdAt,
            startingTime: parsedTime,
        },
        { upsert: true, new: true }
    );

    const recordedTime = moment(parsedTime).tz('Asia/Dhaka').format('hh:mm A');
    return message.reply(
        `✅ **Late starting** recorded for **${tfc.name}**.\n` +
        `Roll: \`${studentId}\` | Handle: \`${vjHandle}\` | Time: ${recordedTime}\n` +
        `To mark leaving, send: \`${studentId} ${vjHandle} left <time>\``
    );
}

async function handleLateLeaving(message, studentId, vjHandle, roomNo, timeStr) {
    const valid = await validateCommon(message, studentId, vjHandle, roomNo, false);
    if (!valid) return;

    const tfc = await findTFCForLateAttendance();
    if (!tfc) {
        return message.reply(`❌ No TFC found eligible for late attendance.`);
    }

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

    if (existing.vjHandle !== vjHandle) {
        return message.reply(`❌ VJudge handle doesn't match your starting record.`);
    }

    const parsedTime = parseUserTime(timeStr, tfc.date);
    if (!parsedTime) {
        return message.reply(`❌ Invalid time format. Use \`h:mmAM/PM\` (e.g., 6:00PM) or \`HH:mm\` (e.g., 18:00).`);
    }

    const parsedMoment = moment.utc(parsedTime);
    const startingMoment = moment.utc(existing.startingTime);
    const maxLeaving = startingMoment.clone().add(6, 'hours');

    if (parsedMoment.isBefore(startingMoment)) {
        return message.reply(`❌ Leaving time can't be before your starting time (${startingMoment.tz('Asia/Dhaka').format('hh:mm A')}).`);
    }

    if (parsedMoment.isAfter(maxLeaving)) {
        return message.reply(`❌ Leaving time can't be more than 6 hours after starting time.`);
    }

    existing.leavingMessageTime = message.createdAt;
    existing.leavingTime = parsedTime;
    if (roomNo) {
        existing.roomNo = roomNo;
    }
    await existing.save();

    const recordedTime = moment(parsedTime).tz('Asia/Dhaka').format('hh:mm A');
    return message.reply(
        `✅ **Late leaving** recorded for **${tfc.name}**.\n` +
        `Roll: \`${studentId}\` | Handle: \`${vjHandle}\` | Time: ${recordedTime}`
    );
}

async function handleOverrideAttendance(message) {
    // Only server owner can use this
    const guild = message.guild;
    if (message.author.id !== guild.ownerId) {
        return message.reply(`❌ Only the server owner can use this command.`);
    }

    // Format: !override <messageId> <discordUserId>
    const args = message.content.trim().split(/\s+/);
    if (args.length < 3) {
        return message.reply(`❌ Usage: \`!override <messageId> <discordUserId>\``);
    }

    const [, messageId, discordUserId] = args;

    const attendanceChannelId = process.env.TFC_ATTENDANCE_CHANNEL;
    try {
        // Fetch the attendance channel
        const attendanceChannel = await message.client.channels.fetch(attendanceChannelId);
        if (!attendanceChannel) {
            return message.reply(`❌ Could not find the attendance channel.`);
        }

        // Fetch the target message
        const targetMessage = await attendanceChannel.messages.fetch(messageId);
        if (!targetMessage) {
            return message.reply(`❌ Message not found in attendance channel.`);
        }

        // Verify author matches provided discordUserId
        if (targetMessage.author.id !== discordUserId) {
            return message.reply(`❌ Message author doesn't match the provided Discord user ID.`);
        }

        // Process the target message as attendance
        await handleTfcAttendance(targetMessage);

        return message.reply(`✅ Override processed. Replied to <@${discordUserId}>'s message in attendance channel.`);
    } catch (error) {
        console.error('Override error:', error.message);
        return message.reply(`❌ Error: ${error.message}`);
    }
}

module.exports = { handleTfcAttendance, handleOverrideAttendance };
