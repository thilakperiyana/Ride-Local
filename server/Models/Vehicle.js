const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    vehicleNumber: { type: String, required: true, unique: true, trim: true, uppercase: true },
    vehicleName: String,
    vehicleModel: { type: String, trim: true, maxlength: 80 },
    category: String,
    serviceLocation: { type: String, required: true, trim: true },
    colour: { type: String, trim: true, maxlength: 40, default: "" },
    hasImage: { type: Boolean, default: false },
    imageData: { type: Buffer, select: false },
    imageContentType: { type: String, select: false },
    activeBookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null, select: false },
    isAvailable: { type: Boolean, default: true },
    seats: { type: Number, min: 1, max: 20, default: 4 }
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
