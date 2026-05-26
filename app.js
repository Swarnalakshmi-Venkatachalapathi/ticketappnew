const express = require("express");
const sql = require("mssql");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// AZURE SQL CONFIG
// ======================
const config = {
  user: "AbisqlAdmin",
  password: "Welcome@2026",
  server: "sql-web-we.database.windows.net",
  database: "webappdb",
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

let pool;

// ======================
// CONNECT DATABASE
// ======================
async function connectDB() {
  try {
    pool = await sql.connect(config);
    console.log("✅ Connected to Azure SQL");
  } catch (err) {
    console.error("❌ DB Connection Failed:", err);
  }
}

connectDB();

// ======================
// SERVE HTML PAGE
// ======================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ======================
// CREATE TICKET
// ======================
app.post("/createTicket", async (req, res) => {
  try {

    const { name, email, password, description } = req.body;

    // generate random ticket number
    const ticketNumber =
      "TKT-" + Math.floor(100000 + Math.random() * 900000);

    await pool.request()
      .input("ticketNumber", sql.NVarChar, ticketNumber)
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("password", sql.NVarChar, password)
      .input("description", sql.NVarChar, description)
      .query(`
        INSERT INTO dbo.Tickets
        (TicketNumber, Name, Email, [Password], TicketDescription)
        VALUES
        (@ticketNumber, @name, @email, @password, @description)
      `);

    // send ticket number back
    res.json({
      success: true,
      ticketNumber: ticketNumber
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("❌ Ticket creation failed");
  }
});

// ======================
// GET ALL TICKETS
// ======================
app.get("/tickets", async (req, res) => {
  try {

    const result = await pool.request()
      .query(`
        SELECT *
        FROM dbo.Tickets
        ORDER BY Id DESC
      `);

    res.json(result.recordset);

  } catch (err) {
    console.log(err);
    res.status(500).send("Error fetching tickets");
  }
});

// ======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});