///const mongoose = require("mongoose");

/*const connectDB1 =  () => {
    try {
       const db1 = mongoose.createConnection(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        ///console.log(db1);
        console.log("✅ Database 1 connected!");
        return db1;
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};

const connectDB2 = async () => {
    try {
        db2 = await mongoose.createConnection(process.env.MONGO_URI_USER, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("User Database connected successfully.");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
        process.exit(1);
    }
};*/


//module.exports = { connectDB1, connectDB2 };
const mongoose = require("mongoose");

// Create the first database connection
const db1 = mongoose.createConnection(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

db1.on("connected", () => {
    console.log("✅ Database 1 connected!");
});

db1.on("error", (err) => {
    console.error("Error connecting to Database 1:", err.message);
    process.exit(1);
});

// Create the second database connection
const db2 = mongoose.createConnection(process.env.MONGO_URI_USER, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

db2.on("connected", () => {
    console.log("✅ User Database connected!");
});

db2.on("error", (err) => {
    console.error("Error connecting to User Database:", err.message);
    process.exit(1);
});

// Export the connection objects
module.exports = { db1, db2 };
