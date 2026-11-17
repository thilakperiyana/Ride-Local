const mongoose = require("mongoose");

const vehicleCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: String,
    pricePerKm: Number
});

module.exports = mongoose.model(
    "VehicleCategory",
    vehicleCategorySchema
);
