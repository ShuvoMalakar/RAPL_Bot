
// 🔹 Send contests to Discord
async function bot_running(message) {
    try {
        message.channel.send("I'm still alive!");;
        console.log("✅ Bot running successfully!");
    } catch (error) {
        console.error("❌ Error sending message to Discord:", error.message);
    }
}

module.exports = {bot_running};
