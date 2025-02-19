const TFC = require('../models/tfcSchema');
const moment = require('moment-timezone');
const { Client, GatewayIntentBits, EmbedBuilder} = require('discord.js');
const vjContests = require('../models/vjcontestdb2');

const HandlesWithoutRecordingLinks = async (hour, reminderFlag) => {
    try {
        //reminderFlag = {[fieldName]: false};
        // Get the current time in UTC
        const now = moment().utc();
        let startTime = now.clone().subtract(48, 'hours');
        let endTime = startTime.clone().add(hour, 'hours');
        const twoDaysLater = now.clone().add(2, 'days');
        if(hour==48){
            startTime = now.clone().subtract(500, 'hours');
            endTime = now.clone().subtract(hour, 'hours');
        }

        console.log('TIME UTC',startTime);

        // Find contests starting after startTime time till now
        const tfcList = await TFC.find({
            date: {
                $gte: startTime.toDate(), 
                $lte: endTime.toDate(), 
            },
            contestId: { $ne: null },
            [reminderFlag]: false,
        });

        // Array to store all handles without recording links
        const allHandlesWithoutLinks = [];

        for (const tfc of tfcList) {
            // Fetch only the `handle` and `recordingLink` fields from vjContests
            const vjContest = await vjContests.findOne(
                { number: tfc.contestId },
                { "data.handle": 1, "data.recordingLink": 1 } // Select only needed fields
            );

            if (vjContest?.data) {
                // Filter to find handles that **do NOT** have a recording link
                const handlesWithoutLinks = vjContest.data
                    .filter(entry => !entry.recordingLink) // Only keep those WITHOUT a link
                    .map(entry => entry.handle); // Extract only the handle names

                if (handlesWithoutLinks.length > 0) {
                    // Calculate submitDeadline by adding 2 days to the tfc date
                    const submitDeadline = moment(tfc.date).add(2, 'days').toDate();
                    // Add handles without links to the main array
                    allHandlesWithoutLinks.push({
                        tfcName: tfc.name,
                        contestId: tfc.contestId,
                        submitDeadline: submitDeadline,
                        handles: handlesWithoutLinks,
                    });
                }
            }
        }

        // Return the array of handles without recording links
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
        const recipients = `\`${tfc.handles.join(", ")}\`\nyou didn't submitted your ${tfc.tfcName} recording link`;
        const updatetime = `Please submit your ${tfc.tfcName} recording ink (accessible by anyone) within \`${remainingTimeString}\`otherwise your TFC performance will be suspended.\nDeadline: \`${deadline.format('DD MMM YY, hh:mm A')}\`\nLink: https://rapl.netlify.app/profile`;

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
                { name: tfc.tfcName }, // Filter by contes
                { $set: { _1h: true, _3h: true, _24h: true, _42h: true } }
            );
            await channel.send(`${result.headline}**Hey Lazy people! Attention please! Did you commited any suspicious activity on ${tfc.tfcName}🤔?**\n\n${result.recipients}.\n\n${result.updatetime}@everyone`);
            console.log(`Sent ${tfc.tfcName} recording reminders.`);
            console.log('Handles without recording links:', tfc.handles);
        }
        allHandles = await HandlesWithoutRecordingLinks(4, _3hRem);
        for(const tfc of allHandles){
            const result = await mergeUsers(tfc);
            await TFC.updateOne(
                { name: tfc.tfcName }, // Filter by contes
                { $set: {_3h: true, _24h: true, _42h: true } }
            );
            await channel.send(`${result.headline}${result.recipients}.\n\n${result.updatetime}\n@everyone`);
            console.log(`Sent ${tfc.tfcName} recording reminders.`);
            console.log('Handles without recording links:', tfc.handles);
        }
        allHandles = await HandlesWithoutRecordingLinks(24, _1dRem);
        for(const tfc of allHandles){
            const result = await mergeUsers(tfc);
            await TFC.updateOne(
                { name: tfc.tfcName }, // Filter by contes
                { $set: {_24h: true, _42h: true } }
            );
            await channel.send(`${result.headline}${result.recipients}.\n\n${result.updatetime}\n@everyone`);
            console.log(`Sent ${tfc.tfcName} recording reminders.`);
            console.log('Handles without recording links:', tfc.handles);
        }
        allHandles = await HandlesWithoutRecordingLinks(42, _42hRem);
        for(const tfc of allHandles){
            const result = await mergeUsers(tfc);
            await TFC.updateOne(
                { name: tfc.tfcName }, // Filter by contes
                { $set: {_42h: true } }
            );
            await channel.send(`${result.headline}${result.updatetime}\n@everyone`);
            console.log(`Sent ${tfc.tfcName} recording reminders.`);
            console.log('Handles without recording links:', tfc.handles);
        }
        allHandles = await HandlesWithoutRecordingLinks(48, _48hRem);
        for(const tfc of allHandles){
            const result = await mergeUsers(tfc);
            await TFC.updateOne(
                { name: tfc.tfcName }, // Filter by contes
                { $set: {_1h: true, _3h: true, _24h: true, _42h: true, _48h: true } }
            );
            await channel.send(`TFC performance suspension:\n${result.recipients} within the deadline. Your  ${tfc.tfcName} performance has been suspended.\n@everyone`);
            console.log(`Sent ${tfc.tfcName} recording reminders.`);
            console.log('Handles without recording links:', tfc.handles);
        }
        
    } catch (error) {
        console.error('❌ Error in RecordingLinksRem:', error.message);
    }
};

module.exports = {RecordingLinksRem};