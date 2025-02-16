const express = require('express');
const Discord = require('discord.js');
// Discord Bot Setup
const client = new Discord.Client({ 
    intents: [
        Discord.GatewayIntentBits.Guilds, 
        Discord.GatewayIntentBits.GuildMessages, 
        Discord.GatewayIntentBits.MessageContent
    ] 
});

const loginBot = () => {
    return new Promise((resolve, reject) => {
        client.login(process.env.BOT_TOKEN)
            .then(() => {
                console.log('Discord bot logged in successfully!');
                resolve();
            })
            .catch((error) => {
                console.error('Error logging in to Discord:', error.message);
                reject(error);
            });
            client.once('ready', () => {
                console.log('Discord bot is online!');
            });
    });
};

module.exports = loginBot;
