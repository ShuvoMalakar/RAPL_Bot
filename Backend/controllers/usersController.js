const mongoose = require("mongoose");
const { db2 } = require("../config/db"); // Ensure this path is correct
const users = require("../models/userSchemadb2"); // Import the users model

// Function to fetch and log all user data
const fetchAndLogUsers = async () => {
    try {
        // Fetch all users from the database
        const allUsers = await users.find({});

        // Check if there are any users
        if (allUsers.length === 0) {
            console.log("No users found in the database.");
            return;
        }

        // Log all users' information
        console.log("All Users:");
        allUsers.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`- Name: ${user.name}`);
            /*console.log(`- Email: ${user.email}`);
            console.log(`- Roll: ${user.roll}`);
            console.log(`- CF Handle: ${user.cfHandle}`);*/
            console.log(`- VJ Handle: ${user.vjHandle}`);
            /*console.log(`- CC Handle: ${user.ccHandle || "N/A"}`);
            console.log(`- AtCoder Handle: ${user.atcoderHandle || "N/A"}`);
            console.log(`- Admin: ${user.admin}`);
            console.log(`- Rating: ${user.rating}`);
            console.log(`- Max Rating: ${user.maxRating}`);
            console.log(`- All Time: ${user.allTime}`);
            console.log(`- Last Year: ${user.lastYear}`);
            console.log(`- Last Month: ${user.lastMonth}`);
            console.log(`- Reset Password Token: ${user.resetPasswordToken || "N/A"}`);
            console.log(`- Reset Password Expires: ${user.resetPasswordExpires || "N/A"}`);
            console.log(`- Created At: ${user.createdAt}`);
            console.log(`- Updated At: ${user.updatedAt}`);*/
            console.log("-----------------------------");
        });
    } catch (error) {
        console.error("Error fetching users:", error.message);
    }
};

/*const fetchServerUsers = async (client, GUILD_ID) => {
    try {
        const guild = await client.guilds.fetch(GUILD_ID);
        const members = await guild.members.fetch();

        const memberData = members.map(member => ({
            id: member.id,
            username: member.user.username,
            nickname: member.nickname || 'No Nickname'
        }));

        console.log(memberData); // Logs all member details

    } catch (error) {
        console.error('Error fetching members:', error);
    }
};*/

const fetchUserInfo = async (message) => {
    try {
        // Fetch the user as a guild member
        const member = await message.guild.members.fetch(message.author.id);

        // Log all user info
        const userInfo = {
            id: member.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
            globalName: member.user.globalName || 'Not Set',
            nickname: member.nickname || 'No Nickname',
            avatar: member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
            joinedAt: member.joinedAt,
            createdAt: member.user.createdAt,
            roles: member.roles.cache.map(role => role.name).join(', '),
            isBot: member.user.bot
        };

        console.log(userInfo); // Print user info in console

    } catch (error) {
        console.error('Error fetching user details:', error);
    }
};

const fetchMentionedUsers = async (message) => {
    const mentionedUsers = message.mentions.users;

    if (mentionedUsers.size === 0) {
        return message.reply("Please mention at least one user.");
    }

    try {
        const userInfoList = [];

        for (const [userId, user] of mentionedUsers) {
            // Fetch the user as a guild member
            const member = await message.guild.members.fetch(userId);

            // Create user info object
            const userInfo = {
                id: member.id,
                username: member.user.username,
                globalName: member.user.globalName || 'Not Set',
                nickname: member.nickname || 'No Nickname',
                avatar: member.user.displayAvatarURL({ dynamic: true, size: 1024 }),
                joinedAt: member.joinedAt,
                createdAt: member.user.createdAt,
                roles: member.roles.cache.map(role => role.name).join(', '),
                isBot: member.user.bot
            };

            userInfoList.push(userInfo);
        }

        console.log(userInfoList); // Print user info in console
        message.reply(`Fetched info for ${userInfoList.length} mentioned users! (Check console)`);

    } catch (error) {
        console.error('Error fetching user details:', error);
        message.reply('Failed to fetch user info.');
    }
};

const mentionUsers = async (message) => {

    const mentionedUsers = message.mentions.users;
    if (mentionedUsers.size === 0) {
        return message.reply("Please mention at least one user.");
    }

    try {
        const mentions = [];

        for (const [userId, user] of mentionedUsers) {
            const member = await message.guild.members.fetch(userId);
            const nickname = member.nickname || member.user.username; // Use nickname if available

            mentions.push(`<@${member.id}>`); // Bold nickname + real mention
        }

        const response = `Hello ${mentions.join(', ')}! 👋`; // Combine mentions into message

        message.channel.send(response); // Send message in the same channel

    } catch (error) {
        console.error('Error mentioning users:', error);
        message.reply('Failed to mention users.');
    }
};

// Call the function to fetch and log users
module.exports = {
    fetchAndLogUsers,
    fetchUserInfo,
    fetchMentionedUsers,
    mentionUsers,
};