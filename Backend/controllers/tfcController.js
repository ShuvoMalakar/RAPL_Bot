const TFC = require('../models/tfcSchema');
const moment = require('moment-timezone');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const vjContests = require('../models/vjcontestdb2');

const findHandlesWithoutRecordingLinks = async () => {
    try {
        // Find all TFCs that have a contestId
        const tfcList = await TFC.find({ contestId: { $ne: null } });

        for (const tfc of tfcList) {
            // Fetch only the `handle` fields from vjContests
            const vjContest = await vjContests.findOne(
                { contestId: tfc.contestId },
                { "data.handle": 1 } // Select only needed fields
            );

            if (vjContest?.data) {
                // Get all handles from the contest data
                const handlesWithoutLinks = vjContest.data
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
};

// Call the function


const updateTFCDateFromVJContest = async () => {
    try {
        // Find all TFCs that have a contestId
        const tfcList = await TFC.find({ contestId: { $ne: null } });

        for (const tfc of tfcList) {
            // Fetch only the `startTime` field from vjContests
            const vjContest = await vjContests.findOne(
                { contestId: tfc.contestId },
                { startTime: 1} // Select only startTime
            );
            

            if (vjContest?.startTime) {
                await TFC.updateOne(
                    { name: tfc.name}, 
                    { $set:{ 
                            date: vjContest.startTime,
                        }
                    }
                );
            
                //console.log(`✅ Updated TFC: ${tfc.name}, New Date: ${vjContest.startTime}`);
            } else {
                //console.log(`⚠️ No matching vjContest found for TFC: ${tfc.name} (Contest ID: ${tfc.contestId})`);
            }
        }
    } catch (error) {
        console.error('❌ Error updating TFC dates:', error.message);
    }
};


// Function to fetch the last 10 TFC events
const fetchLast10TFC = async () => {
    try {
        const last10TFC = await TFC.find()
            .sort({ date: -1 }) // Sort by date in descending order (newest first)
            .limit(10); // Limit to 10 entries

        return last10TFC;
    } catch (error) {
        console.error("Error fetching last 10 TFC events:", error.message);
        return [];
    }
};

// Validate season format: e.g. 2026S1
const validateSeason = (season) => {
    const match = season.match(/^(\d{4})S(\d)$/);
    if (!match) throw new Error("Invalid season format. Expected: `<year>S<1-4>` (e.g., 2026S1)");
    const year = parseInt(match[1], 10);
    const s = parseInt(match[2], 10);
    if (year <= 2023 || year >= 2050) throw new Error("Season year must be between 2024 and 2049.");
    if (s < 1 || s > 4) throw new Error("Season number must be between 1 and 4.");
    return season;
};

// Validate TFC name format: TFC-1, TFC-12, etc.
const validateTFCName = (tfcName) => {
    if (!/^TFC-\d+$/.test(tfcName)) {
        throw new Error("Invalid TFC name format. Expected format: `TFC-1` or `TFC-12`");
    }
    return tfcName;
};

// Function to validate and parse date-time
const parseTFCDateTime = (tfcName, season, dateStr, timeStr) => {
    validateTFCName(tfcName);
    validateSeason(season);

    const dateTimeString = `${dateStr} ${timeStr}`;
    const parsedDateTime = moment.tz(dateTimeString, "DD/MM/YYYY h:mmA", "Asia/Dhaka");

    if (!parsedDateTime.isValid()) {
        throw new Error("Invalid date or time format. Expected: `DD/MM/YYYY h:mmAM/PM` (e.g., 12/02/2025 3:05PM)");
    }

    return parsedDateTime.utc().toDate();
};

// Function to update or insert TFC event with date
const upsertTFCEvent = async (tfcName, season, dateStr, timeStr) => {
    try {
        const eventDateTime = parseTFCDateTime(tfcName, season, dateStr, timeStr);

        await TFC.findOneAndUpdate(
            { name: tfcName, season: season },
            { name: tfcName, season: season, date: eventDateTime },
            { upsert: true, new: true }
        );
        return { tfcName, season, eventDateTime };
    } catch (error) {
        console.error("❌ Error:", error.message);
        return { error: error.message };
    }
};

async function updateTFC(message) {
    const args = message.content.split(' ');
    if (args.length < 5) {
        message.channel.send('Usage: `!uptfc <TFC-1> <2026S1> <dd/mm/yyyy> <hh:mmAM/PM>`');
        return;
    }

    const [, tfcname, season, tfcdate, tfctime] = args;
    const result = await upsertTFCEvent(tfcname, season, tfcdate, tfctime);

    if (result.error) {
        message.channel.send(result.error);
    } else {
        const last10TFC = await fetchLast10TFC();
        const response = `📊 TFC Updated successfully!\n**Name:** ${result.tfcName}\n**Season:** ${result.season}\n**Date (UTC):** ${result.eventDateTime.toISOString()}`;

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle(`Last 10 TFC Events`)
            .setDescription("Here are the most recent 10 TFC events:")
            .addFields(
                last10TFC.map((tfc) => ({
                    name: `${tfc.name} [${tfc.season}] : ${tfc.contestId || 'N/A'}`,
                    value: `Date: ${moment.utc(tfc.date).tz("Asia/Dhaka").format("DD MMM YYYY, hh:mm A")}`,
                    inline: false
                }))
            );

        message.channel.send({ content: response, embeds: [embed] });
        console.log('Message sent to the desired channel.');
    }
}

// Function to validate contest ID
const parseTFCid = (tfcName, season, tfcId) => {
    validateTFCName(tfcName);
    validateSeason(season);

    if (/^\d{6}$/.test(tfcId)) {
        return parseInt(tfcId, 10);
    } else {
        throw new Error("Invalid input: Contest ID must be a 6-digit number");
    }
};

// Function to update or insert TFC event with contest ID
const upsertTFCid = async (tfcName, season, tfcId) => {
    try {
        const tfcID = parseTFCid(tfcName, season, tfcId);

        const vjContest = await vjContests.findOne(
            { contestId: String(tfcID) },
            { startTime: 1 }
        );

        if (!vjContest) {
            return { error: `❌ Contest ID ${tfcID} not found in VJudge contests.` };
        }

        const updateData = { name: tfcName, season: season, contestId: tfcID };
        if (vjContest.startTime) {
            updateData.date = vjContest.startTime;
        }

        await TFC.findOneAndUpdate(
            { name: tfcName, season: season },
            updateData,
            { upsert: true, new: true }
        );
        console.log("✅ Event updated or inserted successfully!", tfcID);
        return { tfcName, season, tfcID };

    } catch (error) {
        console.error("❌ Error:", error.message);
        return { error: error.message };
    }
};

async function updateTFCid(message) {
    const args = message.content.split(' ');
    if (args.length < 4) {
        message.channel.send('Usage: `!idtfc <TFC-1> <2026S1> <contestid>`');
        return;
    }

    const [, tfcname, season, tfcid] = args;
    const result = await upsertTFCid(tfcname, season, tfcid);

    if (result.error) {
        message.channel.send(result.error);
    } else {
        const last10TFC = await fetchLast10TFC();
        const response = `📊 TFC Updated successfully!\n**Name:** ${result.tfcName}\n**Season:** ${result.season}\n**ContestID:** ${result.tfcID}`;

        const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle(`Last 10 TFC Events`)
            .setDescription("Here are the most recent 10 TFC events:")
            .addFields(
                last10TFC.map((tfc) => ({
                    name: `${tfc.name} [${tfc.season}] : ${tfc.contestId || 'N/A'}`,
                    value: `Date: ${moment.utc(tfc.date).tz("Asia/Dhaka").format("DD MMM YYYY, hh:mm A")}`,
                    inline: false
                }))
            );

        message.channel.send({ content: response, embeds: [embed] });
        console.log('Message sent to the desired channel.');
    }
}

async function listTFC(message) {
    try {
        const last10TFC = await fetchLast10TFC();
        if (last10TFC.length === 0) {
            message.channel.send('No TFC events found.');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(0x0099ff)
            .setTitle(`Last 10 TFC Events`)
            .setDescription("Here are the most recent 10 TFC events:")
            .addFields(
                last10TFC.map((tfc) => ({
                    name: `${tfc.name} [${tfc.season || 'N/A'}] : ${tfc.contestId || 'N/A'}`,
                    value: `Date: ${moment.utc(tfc.date).tz("Asia/Dhaka").format("DD MMM YYYY, hh:mm A")}`,
                    inline: false
                }))
            );

        message.channel.send({ embeds: [embed] });
    } catch (error) {
        console.error("Error listing TFC events:", error.message);
        message.channel.send('Error fetching TFC events.');
    }
}

const USAGE_MSG = 'Wrong Command\nUsage:\n `!uptfc <TFC-1> <2026S1> <dd/mm/yyyy> <hh:mmAM/PM>`\n `!idtfc <TFC-1> <2026S1> <contestid>`\n `!listtfc`';

async function handletfcCommand(message) {

    if (message.content.startsWith('!uptfc')) {
        const args = message.content.split(' ');
        if (args.length === 5) {
            await updateTFC(message);
        } else if (args.length === 4) {
            await updateTFCid(message);
        } else {
            message.channel.send('Usage: `!uptfc <TFC-1> <2026S1> <dd/mm/yyyy> <hh:mmAM/PM>` or `!uptfc <TFC-1> <2026S1> <contestid>`');
        }
    }
    else if (message.content.startsWith('!idtfc')) {
        await updateTFCid(message);
    }
    else if (message.content.startsWith('!listtfc')) {
        await listTFC(message);
    }
    else {
        message.channel.send(USAGE_MSG);
        console.log('Wrong Command.');
    }
}

module.exports ={
    handletfcCommand, updateTFCDateFromVJContest,findHandlesWithoutRecordingLinks
};

