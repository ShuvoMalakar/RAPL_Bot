const TFC = require('../models/tfcSchema');
const moment = require('moment-timezone');
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const vjContests = require('../models/vjcontestdb2');

const findHandlesWithoutRecordingLinks = async () => {
    try {
        // Find all TFCs that have a contestId
        const tfcList = await TFC.find({ contestId: { $ne: null } });

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
};

// Call the function


const updateTFCDateFromVJContest = async () => {
    try {
        // Find all TFCs that have a contestId
        const tfcList = await TFC.find({ contestId: { $ne: null } });

        for (const tfc of tfcList) {
            // Fetch only the `startTime` field from vjContests
            const vjContest = await vjContests.findOne(
                { number: tfc.contestId },
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

// Function to validate and parse date-time
const parseTFCDateTime = (tfcName, dateStr, timeStr) => {
    if (!/^TFC-\d+$/.test(tfcName)) {
        throw new Error("Invalid TFC name format. Expected format: TFC-01 or TFC-1");
    }

    // Combine date and time
    const dateTimeString = `${dateStr} ${timeStr}`;

    // Parse in Asia/Dhaka timezone
    const parsedDateTime = moment.tz(dateTimeString, "DD/MM/YYYY h:mmA", "Asia/Dhaka");

    if (!parsedDateTime.isValid()) {
        throw new Error("Invalid date or time format. Expected format: DD/MM/YYYY h:mmA (e.g., 12/02/2025 3:05 PM)");
    }

    // Log the parsed time in Asia/Dhaka
    //console.log("Parsed Date (Asia/Dhaka):", parsedDateTime.format("YYYY-MM-DD HH:mm:ss"));

    // Convert to UTC
    const utcDateTime = parsedDateTime.utc();

    // Log the converted UTC time
    //console.log("Converted to UTC:", utcDateTime.format("YYYY-MM-DD HH:mm:ss"));

    return utcDateTime.toDate();

};

// Function to update or insert TFC event
const upsertTFCEvent = async (tfcName, dateStr, timeStr) => {
    try {
        const eventDateTime = parseTFCDateTime(tfcName, dateStr, timeStr);

        const updatedEvent = await TFC.findOneAndUpdate(
            { name: tfcName },  // Find by TFC name
            { 
                name: tfcName,
                date: eventDateTime 
            },  // Update the date
            { upsert: true, new: true } // Create if not exists, return updated doc
        );
        return {tfcName, eventDateTime};

        console.log("✅ Event updated or inserted successfully!", updatedEvent);
    } catch (error) {
        console.error("❌ Error:", error.message);
        return {error: error.message};
    }
};


async function updateTFC(message){
    const args = await message.content.split(' ');
    if (args.length < 4) {
        message.channel.send('Usage: `!uptfc <TFC-1> <dd/mm/yyyy> <hh:mmAM/PM>`');
        console.log('Message sent to the desired channel with command error.');
        return;
    }

    const tfcname = args[1];
    const tfcdate = args[2];
    const tfctime = args[3];
    const result = await upsertTFCEvent(tfcname,tfcdate,tfctime);

    if (result.error) {
        message.channel.send(result.error);
    } else {
        const last10TFC = await fetchLast10TFC();

        // Create the success message
        const response = `📊 TFC Updated successfully!\n**Name:** ${result.tfcName}\n**Date (UTC):** ${result.eventDateTime.toISOString()}`;

        // Create an embed for the last 10 TFC events
        const embed = new EmbedBuilder()
            .setColor(0x00ff00) // Green color
            .setTitle(`Last10 TFC Events`)
            .setDescription("Here are the most recent 10 TFC events:")
            .addFields(
                last10TFC.map((tfc, index) => ({
                    name: `${tfc.name} : ${tfc.contestId}`,
                    value: `Date: ${moment.utc(tfc.date).tz("Asia/Dhaka").format("DD MMM YYYY, hh:mm A")}`,
                    inline: false
                }))
            );

        // Send the response and embed
        
        message.channel.send({ content: response, embeds: [embed] });

        console.log('Message sent to the desired channel.');
    }

}
// Function to validate and parse date-time
const parseTFCid = (tfcName, tfcId) => {
    if (!/^TFC-\d+$/.test(tfcName)) {
        throw new Error("Invalid TFC name format. Expected format: TFC-01 or TFC-1");
    }

    if (/^\d{6}$/.test(tfcId)) {
        return parseInt(tfcId, 10); // Convert to number
    } else {
        throw new Error("Invalid input: Must be a 6-digit number");
    }
};

// Function to update or insert TFC event
const upsertTFCid = async (tfcName, tfcId) => {
    try {
        const tfcID = parseTFCid(tfcName, tfcId);

        const updatedEvent = await TFC.findOneAndUpdate(
            { name: tfcName },  // Find by TFC name
            { 
                name: tfcName,
                contestId: tfcID
            },  // Update the date
            { upsert: true, new: true } // Create if not exists, return updated doc
        );
        console.log("✅ Event updated or inserted successfully!", tfcID);
        return {tfcName, tfcID};
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        return {error: error.message};
    }
};

async function updateTFCid(message){
    const args = await message.content.split(' ');
    if (args.length < 3) {
        message.channel.send('Usage: `!uptfc <TFC-1> <contestid>`');
        console.log('Message sent to the desired channel with command error.');
        return;
    }

    const tfcname = args[1];
    const tfcid = args[2];
    const result = await upsertTFCid(tfcname,tfcid);

    if (result.error) {
        message.channel.send(result.error);
    } else {
        const last10TFC = await fetchLast10TFC();

        // Create the success message
        const response = `📊 TFC Updated successfully!\n**Name:** ${result.tfcName}\n**ContestID:** ${result.tfcID}`;

        // Create an embed for the last 10 TFC events
        const embed = new EmbedBuilder()
            .setColor(0x00ff00) // Green color
            .setTitle(`Last 10 TFC Events`)
            .setDescription("Here are the most recent 10 TFC events:")
            .addFields(
                last10TFC.map((tfc, index) => ({
                    name: `${tfc.name} : ${tfc.contestId}`,
                    value: `Date: ${moment.utc(tfc.date).tz("Asia/Dhaka").format("DD MMM YYYY, hh:mm A")}`,
                    inline: false
                }))
            );

        // Send the response and embed
        
        message.channel.send({ content: response, embeds: [embed] });

        console.log('Message sent to the desired channel.');
    }

}


async function handletfcCommand(message) {

    if (message.content.startsWith('!uptfc')){
        await updateTFC(message);
    }
    else if(message.content.startsWith('!idtfc')){
        await updateTFCid(message);
    }
    else{
        message.channel.send('Wrong Command\nUsage:\n `!uptfc <TFC-1> <dd/mm/yyyy> <hh:mmAM/PM>` `!uptfc <TFC-1> <contestid>`');
        console.log('Wrong Command.');
    };

    
}

module.exports ={
    handletfcCommand, updateTFCDateFromVJContest,findHandlesWithoutRecordingLinks
};

