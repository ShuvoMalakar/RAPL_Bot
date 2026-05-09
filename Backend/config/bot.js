const express = require('express');
const startBot = async (client) => {
    try {
        console.log('Attempting Discord bot login...');
        const loginPromise = client.login(process.env.BOT_TOKEN);
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Discord login timed out after 30s')), 30000)
        );
        await Promise.race([loginPromise, timeoutPromise]);
        console.log('Discord bot logged in successfully!');
    } catch (error) {
        console.error('Error logging in to Discord:', error.message);
        // Don't exit — let the server keep running, retry login after delay
        setTimeout(() => {
            console.log('Retrying Discord bot login...');
            startBot(client);
        }, 10000);
    }
};

module.exports = startBot;
