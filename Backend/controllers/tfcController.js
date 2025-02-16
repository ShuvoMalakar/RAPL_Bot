const TFC = require('../models/tfcSchema');
const moment = require('moment-timezone');

// Function to validate and parse date-time
const parseTFCDateTime = (tfcName, dateStr, timeStr) => {
    if (!/^TFC-\d+$/.test(tfcName)) {
        throw new Error("Invalid TFC name format. Expected format: TFC-01 or TFC-1");
    }

    /*const dateFormats = ["D/MM/YYYY", "DD/MM/YYYY","D/M/YYYY","DD/M/YYYY"];
    const parsedDate = moment.tz(dateStr, dateFormats, true, "Asia/Dhaka");
    if (!parsedDate.isValid()) {
        throw new Error("Invalid date format. Expected format: MM/DD/YYYY or M/D/YYYY");
    }

    const timeFormats = ["hA", "hhA", "hh:mmA",  "hh:mmA", "h:mmA", "h:mmA"];
    const parsedTime = moment.tz(timeStr, timeFormats, true, "Asia/Dhaka");
    if (!parsedTime.isValid()) {
        throw new Error("Invalid time format. Expected format: hA or h:mm A (e.g., 3PM or 3:05 PM)");
    }

    // Combine date and time and parse in Asia/Dhaka timezone
    const dateTimeString = `${dateStr} ${timeStr}`;
    const parsedDateTime = moment.tz(dateTimeString, [...dateFormats, ...timeFormats], "Asia/Dhaka");

    if (!parsedDateTime.isValid()) {
        throw new Error("Invalid date or time format. Expected format: MM/DD/YYYY h:mm A (e.g., 12/02/2025 3:05 PM)");
    }

    ///const originalTime = moment.tz("2025-10-02 06:00:00", "Asia/Dhaka");

// Subtract 6 hours
    const subtractedTime = parsedDateTime.clone().subtract(6, 'hours');

    // Log the parsed time in Asia/Dhaka
    console.log("Parsed Date (Asia/Dhaka):", parsedDateTime.format("YYYY-MM-DD HH:mm:ss"));

    // Convert to UTC
    const utcDateTime = parsedDateTime.utc();

    // Log the converted UTC time
    console.log("Converted to UTC:", utcDateTime.format("YYYY-MM-DD HH:mm:ss"));

    return subtractedTime.toDate();*/
    // Combine date and time
    const dateTimeString = `${dateStr} ${timeStr}`;

    // Parse in Asia/Dhaka timezone
    const parsedDateTime = moment.tz(dateTimeString, "DD/MM/YYYY h:mmA", "Asia/Dhaka");

    if (!parsedDateTime.isValid()) {
        throw new Error("Invalid date or time format. Expected format: DD/MM/YYYY h:mmA (e.g., 12/02/2025 3:05 PM)");
    }

    // Log the parsed time in Asia/Dhaka
    console.log("Parsed Date (Asia/Dhaka):", parsedDateTime.format("YYYY-MM-DD HH:mm:ss"));

    // Convert to UTC
    const utcDateTime = parsedDateTime.utc();

    // Log the converted UTC time
    console.log("Converted to UTC:", utcDateTime.format("YYYY-MM-DD HH:mm:ss"));

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

async function handletfcCommand(message) {

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
        ///const response = `📊 TFC Updated successfully!`;
        const response = `📊 TFC Updated successfully!\n**Name:** ${result.tfcName}\n**Date (UTC):** ${result.eventDateTime.toISOString()}`;
        message.channel.send(response);

        console.log('Message sent to the desired channel.');
    }
}

module.exports ={
    handletfcCommand
};

