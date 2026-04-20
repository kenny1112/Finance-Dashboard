const express = require("express");
const cors = require("cors");
const pool = require("./db/pool");
const expensesRouter = require("./routes/expenses");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/expenses", expensesRouter);

app.get("/api/health", async (req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW() AS db_time");
    res.status(200).json({
      status: "ok",
      service: "finance-dashboard-api",
      db: "connected",
      dbTime: result.rows[0].db_time,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      service: "finance-dashboard-api",
      db: "disconnected",
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Route does not exist",
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: "Internal Server Error",
    message: "Something went wrong on the server",
  });
});

module.exports = app;
