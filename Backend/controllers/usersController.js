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

// Call the function to fetch and log users
module.exports = {
    fetchAndLogUsers,

};