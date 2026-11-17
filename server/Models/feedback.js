const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        unique: true
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    comment: { type: String, trim: true, maxlength: 1000 },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
