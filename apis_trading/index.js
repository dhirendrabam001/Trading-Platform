const express = require("express");

const cors = require("cors");
require("dotenv").config();

// required all important
const connectDB = require("./config/connection");

const app = express();

// USE CORS
const allowedOrigins = process.env.CLIENT_URL.split(",").map((origin) =>
  origin.trim(),
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("Blocked Origin:", origin);
    return callback(new Error("CORS not allowed"));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// all routes
const userRoutes = require("./routes/user.routes");

// apis
app.use("/api/user", userRoutes);
connectDB(); // database connection add
app.get("/", (req, res) => {
  res.send("APIs Running...");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running port number ${PORT}`);
});
