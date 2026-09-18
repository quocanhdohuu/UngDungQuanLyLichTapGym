const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();

// Xử lý Private Network Access (PNA) cho các trình duyệt Chromium (Chrome, Edge)
app.use((req, res, next) => {
  if (req.headers["access-control-request-private-network"] === "true") {
    res.setHeader("Access-Control-Allow-Private-Network", "true");
  }
  next();
});

// Cấu hình CORS cho phép các request từ web local và mobile trong mạng LAN
app.use(
  cors({
    origin: true, // Tự động chấp nhận origin của request trong môi trường phát triển
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Access-Control-Request-Private-Network",
    ],
  }),
);

app.use(express.json());

const accountsRouter = require("./routes/accounts.route");
const authRouter = require("./routes/auth.route");
const adminsRoutePath = path.join(__dirname, "routes", "admins.route.js");
const adminsRouter = fs.existsSync(adminsRoutePath)
  ? require("./routes/admins.route")
  : null;
const bodymetricsRouter = require("./routes/bodymetrics.route");
const equipmentRouter = require("./routes/equipment.route");
const exerciseconfigsRouter = require("./routes/exerciseconfigs.route");
const exerciseequipmentRouter = require("./routes/exerciseequipment.route");
const exercisemediaRouter = require("./routes/exercisemedia.route");
const exercisemusclegroupsRouter = require("./routes/exercisemusclegroups.route");
const exercisesRouter = require("./routes/exercises.route");
const exercisesetsRouter = require("./routes/exercisesets.route");
const gymusersRouter = require("./routes/gymusers.route");
const gymuserworkoutplansRouter = require("./routes/gymuserworkoutplans.route");
const loginsessionsRouter = require("./routes/loginsessions.route");
const musclegroupsRouter = require("./routes/musclegroups.route");
const performedexercisesRouter = require("./routes/performedexercises.route");
const workoutdaysRouter = require("./routes/workoutdays.route");
const workoutplansRouter = require("./routes/workoutplans.route");
const workoutsessionsRouter = require("./routes/workoutsessions.route");
const exerciseMediaRoutes = require("./routes/exerciseMediaRoutes");

app.use("/accounts", accountsRouter);
app.use("/auth", authRouter);
if (adminsRouter) {
  app.use("/admins", adminsRouter);
}
app.use("/bodymetrics", bodymetricsRouter);
app.use("/equipment", equipmentRouter);
app.use("/exerciseconfigs", exerciseconfigsRouter);
app.use("/exerciseequipment", exerciseequipmentRouter);
app.use("/exercisemedia", exercisemediaRouter);
app.use("/exercisemusclegroups", exercisemusclegroupsRouter);
app.use("/exercises", exercisesRouter);
app.use("/api/exercises", exercisesRouter);
app.use("/exercisesets", exercisesetsRouter);
app.use("/gymusers", gymusersRouter);
app.use("/api/users", gymusersRouter);
app.use("/gymuserworkoutplans", gymuserworkoutplansRouter);
app.use("/loginsessions", loginsessionsRouter);
app.use("/musclegroups", musclegroupsRouter);
app.use("/performedexercises", performedexercisesRouter);
app.use("/workoutdays", workoutdaysRouter);
app.use("/workoutplans", workoutplansRouter);
app.use("/workoutsessions", workoutsessionsRouter);
app.use("/api", exerciseMediaRoutes);

module.exports = app;
