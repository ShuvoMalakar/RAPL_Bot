
// 🔹 Send contests to Discord
async function bot_running(desiredChannelId, client, message, EmbedBuilder) {
    try {
        const channel = await client.channels.fetch(desiredChannelId);
        if (!channel) {
            console.error("❌ Could not find the Discord channel.");
            return; // Stop execution if the channel is not found
        }

        await channel.send("Bot is still running!");
        console.log("✅ Sent to Discord successfully!");
    } catch (error) {
        console.error("❌ Error sending message to Discord:", error.message);
    }
}

module.exports = {bot_running};
