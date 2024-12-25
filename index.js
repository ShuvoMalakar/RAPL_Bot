const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
require('dotenv').config(); // To load the BOT_TOKEN from a .env file

// Discord Bot Setup
const TOKEN = process.env.BOT_TOKEN; // Ensure your .env file contains BOT_TOKEN=<your_discord_bot_token>

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Codeforces Rating Function
async function getCodeforcesRating(handle) {
  const url = `https://codeforces.com/api/user.info?handles=${handle}`;
  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === 'OK') {
      const userInfo = data.result[0];
      return {
        handle: userInfo.handle || 'Unknown',
        rating: userInfo.rating || 'Unrated',
        rank: userInfo.rank || 'Unknown',
        maxRating: userInfo.maxRating || 'Unknown',
        maxRank: userInfo.maxRank || 'Unknown',
      };
    } else {
      return { error: data.comment || 'Unknown error' };
    }
  } catch (error) {
    return { error: error.message || 'An unknown error occurred' };
  }
}

// Discord Bot Events
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.channel.name === 'rapl-bot') {
    const content = message.content;

    message.reply(`Hi ${message.author}! You said: ${content}`);

    if (content.startsWith('cfhandle')) {
      try {
        const args = content.split(' ');
        if (args.length < 2) {
          return message.reply('Usage: `cfhandle <user_handle>`');
        }
        const handle = args[1];
        const result = await getCodeforcesRating(handle);

        if (result.error) {
          message.reply(`Error: ${result.error}`);
        } else {
          const response = `**Codeforces User Info:**\n` +
                           `Handle: \`${result.handle}\`\n` +
                           `Current Rating: \`${result.rating}\`\n` +
                           `Current Rank: \`${result.rank}\`\n` +
                           `Max Rating: \`${result.maxRating}\`\n` +
                           `Max Rank: \`${result.maxRank}\``;
          message.reply(response);
        }
      } catch (error) {
        message.reply(`An error occurred: ${error.message}`);
      }
    }
  }
});

// Start the Bot
client.login(TOKEN);
