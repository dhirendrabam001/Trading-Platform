const express = require("express");

const cors = require("cors");
require("dotenv").config();

// required all important
const connectDB = require("./config/connection");

const app = express();

// USE CORS
const allowedOrigins = process.env.CLIENT_URL.split(",");

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Postman support

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  }),
);

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
