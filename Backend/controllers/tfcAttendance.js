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

        const message = `While entering the TFC arena, put your Student Id, Vjudge Handle & Room No. in this format:
\`Student_Id Vjudge_Handle Room_No starting\`
Example: \`230XXXX Sayeef_Mahmud 201 starting\`

While leaving the arena:
\`Student_Id Vjudge_Handle Room_No leaving\`
Example: \`230XXXX Sayeef_Mahmud 201 leaving\`

If you are sitting in the RAPL Lab, write **'RAPL'** instead of the room number.

Those who forgot to mark their attendance while entering or leaving the arena, make sure to submit in this format:
\`Student_Id Vjudge_Handle Room_No started HH:MM PM\`
Example: \`230XXXX Sayeef_Mahmud 201 started 03:05 PM\`
For leaving, write:
\`Student_Id Vjudge_Handle Room_No left HH:MM PM\`
Example: \`230XXXX Sayeef_Mahmud 201 left 06:00 PM\`

**It's being considered as it's the very first TFC, so we are being lenient. But from the next TFC, if you fail to mark your attendance properly, your performance won't be counted.**

***Please make sure to follow the format strictly. If you don't provide attendance information correctly, your TFC performance won't be counted.***`;

        await channel.send(message);
        console.log('TFC attendance info sent successfully.');
    } catch (error) {
        console.error('Error sending TFC attendance info:', error.message);
    }
}

module.exports = { sendTfcAttendanceInfo };
