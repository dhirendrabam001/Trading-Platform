const mongoose = require("mongoose");
const dns = require("dns");

// The local router's DNS resolver can't serve the SRV/TXT records that
// mongodb+srv:// depends on (Node's DNS client gets ECONNREFUSED), so
// point lookups at a public resolver that handles them correctly.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection failed");
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
