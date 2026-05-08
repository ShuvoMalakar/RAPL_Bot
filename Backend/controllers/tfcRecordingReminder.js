const TFC = require('../models/tfcSchema');
const moment = require('moment-timezone');
const { Client, GatewayIntentBits, EmbedBuilder} = require('discord.js');
const vjContests = require('../models/vjcontestdb2');

function parseDurationHours(durationStr) {
    if (!durationStr) return 4; // default 4 hours
    const match = durationStr.match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 4;
}

const HandlesWithoutRecordingLinks = async (hour, reminderFlag) => {
    try {
        const now = moment().utc();
        const maxDuration = 8; // max contest duration in hours (safety margin for query)

        // Query a broad window since we can't compute end time (date + duration) in MongoDB.
        // We filter by actual end time in code below.
        let queryStart, queryEnd;
        if (hour == 48) {
            queryStart = now.clone().subtract(500, 'hours');
            queryEnd = now.clone().subtract(48, 'hours');
        } else {
            // Want TFCs whose end time is in [now-48h, now-48h+hour]
            // end = date + duration, so date = end - duration
            // Broaden query to account for varying durations
            queryStart = now.clone().subtract(48 + maxDuration, 'hours');
            queryEnd = now.clone().subtract(48 - hour, 'hours');
        }

        const tfcList = await TFC.find({
            date: {
                $gte: queryStart.toDate(),
                $lte: queryEnd.toDate(),
            },
            contestId: { $ne: null },
            [reminderFlag]: false,
        });

        const allHandlesWithoutLinks = [];

        for (const tfc of tfcList) {
            const durationHours = parseDurationHours(tfc.duration);
            const endTime = moment(tfc.date).add(durationHours, 'hours');
            const hoursSinceEnd = now.diff(endTime, 'hours', true);

            // Filter by actual end time
            let shouldInclude = false;
            if (hour == 48) {
                shouldInclude = hoursSinceEnd >= 48; // deadline passed
            } else {
                // TFC ended between (48-hour) and 48 hours ago → hour to 0 hours remaining
                shouldInclude = hoursSinceEnd >= (48 - hour) && hoursSinceEnd < 48;
            }

            if (!shouldInclude) continue;

            const vjContest = await vjContests.findOne(
                { contestId: tfc.contestId },
                { "data.handle": 1 }
            );

            if (vjContest?.data) {
                const handlesWithoutLinks = vjContest.data
                    .map(entry => entry.handle);

                if (handlesWithoutLinks.length > 0) {
                    const submitDeadline = endTime.clone().add(48, 'hours').toDate();
                    allHandlesWithoutLinks.push({
                        tfcId: tfc._id,
                        tfcName: tfc.name,
                        contestId: tfc.contestId,
                        submitDeadline: submitDeadline,
                        handles: handlesWithoutLinks,
                    });
                }
            }
        }

        return allHandlesWithoutLinks;
    } catch (error) {
        console.error('❌ Error finding handles without recording links:', error.message);
        return []; // Return an empty array in case of error
    }
};

// Function to send 5-day reminders
async function mergeUsers(tfc) {
    try {
        // Get the current time in UTC
        const now = moment().utc();
        const deadline = moment(tfc.submitDeadline).tz('Asia/Dhaka');
        const remainingTime = moment.duration(deadline .diff(now)); // Calculate remaining time

        // Format the remaining time
        const remainingDays = remainingTime.days();
        const remainingHours = remainingTime.hours();
        const remainingMinutes = remainingTime.minutes();
        let remainingTimeString = ``;
        if(remainingDays){
            remainingTimeString += `${remainingDays} days `;
        }
        if(remainingHours){
            remainingTimeString += `${remainingHours} hours `;
        }
        if(remainingMinutes){
            remainingTimeString += `${remainingMinutes} minutes `;
        }

        const headline = `Reminder for ${tfc.tfcName} recording:\n`;
        const recipients = `**${tfc.handles.join(", ")}** you haven't submitted your **${tfc.tfcName}** recording link`;
        const updatetime = `Please submit your ${tfc.tfcName} recording ink (***accessible by anyone***) within **${remainingTimeString}**otherwise your TFC performance will be suspended.\nDeadline: ***${deadline.format('DD MMM YYYY, hh:mm A')}***\nLink: https://rapl.site/dashboard`;

        return {headline, recipients, updatetime};
        
    } catch (error) {
        console.error('Error sending reminders:', error.message);
        return {error: error.message};
    }
}

const RecordingLinksRem = async (desiredChannelId, client, EmbedBuilder) => {
    try {

        const channel = await client.channels.fetch(desiredChannelId);
        if (!channel) {
            console.error("❌ Could not find the Discord channel.");
            return;
        }

        const _60mRem = "_1h";
        const _3hRem = "_2h";
        const _1dRem = "_24h";
        const _42hRem = "_42h";
        const _48hRem = "_48h";

        let allHandles = await HandlesWithoutRecordingLinks(1, _60mRem);
        for(const tfc of allHandles){
            const result = await mergeUsers(tfc);
            await TFC.updateOne(
                { _id: tfc.tfcId },
                { $set: { _1h: true, _3h: true, _24h: true, _42h: true } }
            );
            await channel.send(`${result.headline}**Hey Lazy people! Attention please! Have you commited any suspicious activity on ${tfc.tfcName}🤔?**\n\n${result.recipients}.\n\n${result.updatetime}\n@everyone`);
            console.log(`Sent ${tfc.tfcName} recording reminder (1h).`);
        }
        allHandles = await HandlesWithoutRecordingLinks(4, _3hRem);
        for(const tfc of allHandles){
            const result = await mergeUsers(tfc);
            await TFC.updateOne(
                { _id: tfc.tfcId },
                { $set: {_3h: true, _24h: true, _42h: true } }
            );
            await channel.send(`${result.headline}${result.recipients}.\n\n${result.updatetime}\n@everyone`);
            console.log(`Sent ${tfc.tfcName} recording reminder (3h).`);
        }
        allHandles = await HandlesWithoutRecordingLinks(24, _1dRem);
        for(const tfc of allHandles){
            const result = await mergeUsers(tfc);
            await TFC.updateOne(
                { _id: tfc.tfcId },
                { $set: {_24h: true, _42h: true } }
            );
            await channel.send(`${result.headline}${result.recipients}.\n\n${result.updatetime}\n@everyone`);
            console.log(`Sent ${tfc.tfcName} recording reminder (24h).`);
        }
        allHandles = await HandlesWithoutRecordingLinks(42, _42hRem);
        for(const tfc of allHandles){
            const result = await mergeUsers(tfc);
            await TFC.updateOne(
                { _id: tfc.tfcId },
                { $set: {_42h: true } }
            );
            await channel.send(`${result.headline}${result.updatetime}\n@everyone`);
            console.log(`Sent ${tfc.tfcName} recording reminder (42h).`);
        }
        allHandles = await HandlesWithoutRecordingLinks(48, _48hRem);
        for(const tfc of allHandles){
            const result = await mergeUsers(tfc);
            await TFC.updateOne(
                { _id: tfc.tfcId },
                { $set: {_1h: true, _3h: true, _24h: true, _42h: true, _48h: true } }
            );
            await channel.send(`TFC performance suspension:\n${result.recipients} within the deadline. Your  ${tfc.tfcName} performance has been suspended.\n@everyone`);
            console.log(`Sent ${tfc.tfcName} suspension notice (48h).`);
        }
        
    } catch (error) {
        console.error('❌ Error in RecordingLinksRem:', error.message);
    }
};

module.exports = {RecordingLinksRem};