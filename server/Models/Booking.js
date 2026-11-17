
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  pickup: { type: String, required: true, trim: true },
  destination: { type: String, required: true, trim: true },
  pickupCoordinates: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  },
  destinationCoordinates: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  },
  pickupArea: { type: String, trim: true },
  vehicleCategory: { type: String, required: true },
  selectedVehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", default: null },
  distanceKm: { type: Number, default: 0, min: 0 },
  pickupTime: { type: Date },
  estimatedFare: { type: Number, default: 0, min: 0 },
  travellingDuration: { type: Number, default: 0, min: 0 },
  rejectedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  driverLocation: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    updatedAt: Date,
    isSharing: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: [
      "pending",
      "accepted",
      "rejected",
      "ongoing",
      "completed",
      "cancelled"
    ],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
