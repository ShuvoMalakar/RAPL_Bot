const TFC = require('../models/tfcSchema');
const moment = require('moment-timezone');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const vjContests = require('../models/vjcontestdb2');


/*const HandlesWithoutRecordingLinks = async (hour) => {
    try {
        // Get the current time in UTC
        const now = moment().utc();
        const startTime =now.clone().subtract(hour, 'hours');
        const twoDaysLater = now.clone().add(2, 'days');

        // Find contests starting after startTime time till now
        const tfcList = await TFC.find({
            date: {
                $gte: startTime.toDate(), // Contests starting after now
                $lte: now.toDate(), // Contests starting within 5 days
            },
            contestId: { $ne: null },
        });

        for (const tfc of tfcList) {
            // Fetch only the `handle` and `recordingLink` fields from vjContests
            const vjContest = await vjContests.findOne(
                { number: tfc.contestId },
                { "data.handle": 1, "data.recordingLink": 1, } // Select only needed fields
            );

            if (vjContest?.data) {
                // Filter to find handles that **do NOT** have a recording link
                const handlesWithoutLinks = vjContest.data
                    .filter(entry => !entry.recordingLink) // Only keep those WITHOUT a link
                    .map(entry => entry.handle); // Extract only the handle names

                if (handlesWithoutLinks.length > 0) {
                    console.log(`✅ TFC: ${tfc.name} (Contest ID: ${tfc.contestId})`);
                    console.log(`Handles without recording links:`, handlesWithoutLinks);
                } else {
                    console.log(`🎉 All handles have recording links for TFC: ${tfc.name} (Contest ID: ${tfc.contestId})`);
                }
            } else {
                console.log(`⚠️ No matching vjContest found for TFC: ${tfc.name} (Contest ID: ${tfc.contestId})`);
            }
        }
    } catch (error) {
        console.error('❌ Error finding handles without recording links:', error.message);
    }
};*/

const HandlesWithoutRecordingLinks = async (hour) => {
    try {
        // Get the current time in UTC
        const now = moment().utc();
        const startTime = now.clone().subtract(hour, 'hours');
        const twoDaysLater = now.clone().add(2, 'days');

        // Find contests starting after startTime time till now
        const tfcList = await TFC.find({
            date: {
                $gte: startTime.toDate(), // Contests starting after now
                $lte: now.toDate(), // Contests starting within 5 days
            },
            contestId: { $ne: null },
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

const RecordingLinksRem = async () => {
    try {
        // Call the HandlesWithoutRecordingLinks function with an appropriate hour value
        const allHandles = await HandlesWithoutRecordingLinks(50); // You can change 5 to any value for the hour
        console.log('Handles without recording links:', allHandles);
    } catch (error) {
        console.error('❌ Error in RecordingLinksRem:', error.message);
    }
};

module.exports = {RecordingLinksRem};
