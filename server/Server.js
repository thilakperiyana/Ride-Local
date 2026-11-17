
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./Config/Db");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "RIDE LOCAL API is running" });
});

app.use("/api/users", require("./Routes/UserRoutes"));
app.use("/api/drivers", require("./Routes/DriverRoutes"));
app.use("/api/admin", require("./Routes/AdminRoutes"));
app.use("/api/bookings", require("./Routes/BookingRoutes"));
app.use("/api/catalog", require("./Routes/CatalogRoutes"));

app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`RIDE LOCAL running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Startup failed:", error.message);
    process.exit(1);
  });
