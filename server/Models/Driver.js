const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    password: String,
    status: {
        type: String,
        default: "pending"
    }
});

module.exports = mongoose.model("Driver", driverSchema);