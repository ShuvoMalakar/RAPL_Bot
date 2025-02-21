const express = require('express');
const startBot = async (client) => {
    try {
        await client.login(process.env.BOT_TOKEN);
        console.log('Discord bot logged in successfully!');
    } catch (error) {
        console.error('Error logging in to Discord:', error.message);
        process.exit(1);
    }
};

module.exports = startBot;
