console.log("HELLO SERVER");
require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

(async () => {
  console.log("🚀 Starting server...");

  await connectDB();

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running at http://${HOST}:${PORT}`);
  });
})();
