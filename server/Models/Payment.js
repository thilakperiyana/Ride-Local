const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true,
        unique: true
    },

    amount: {
        type: Number,
        required: true
    },

    driverShare: { type: Number, min: 0, default: 0 },
    platformShare: { type: Number, min: 0, default: 0 },

    paymentMethod: {
        type: String,
        default: "Cash"
    },

    status: {
        type: String,
        enum: ["pending", "paid"],
        default: "pending"
    },

    paymentDate: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Payment", paymentSchema);
