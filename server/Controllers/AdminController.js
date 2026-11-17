
const User = require("../Models/User");
const Location = require("../Models/Location");
const VehicleCategory = require("../Models/VehicleCategory");
const Vehicle = require("../Models/Vehicle");
const Booking = require("../Models/Booking");
const Payment = require("../Models/Payment");
const Feedback = require("../Models/feedback");

async function getLocations(req, res) {
  try { const locations = await Location.find().sort({ name: 1 }); res.json({ locations }); }
  catch (error) { res.status(500).json({ message: "Could not fetch locations" }); }
}

async function createLocation(req, res) {
  try {
    const { name, city, state, latitude, longitude } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "Location name is required" });
    const hasLatitude = latitude !== "" && latitude !== undefined && latitude !== null;
    const hasLongitude = longitude !== "" && longitude !== undefined && longitude !== null;
    if (hasLatitude !== hasLongitude) return res.status(400).json({ message: "Enter both latitude and longitude, or leave both empty" });
    if (hasLatitude && (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90 || !Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180)) {
      return res.status(400).json({ message: "Enter valid coordinates (latitude -90 to 90, longitude -180 to 180)" });
    }
    const location = await Location.create({
      name: name.trim(),
      city: city?.trim(),
      state: state?.trim(),
      ...(hasLatitude ? { latitude: Number(latitude), longitude: Number(longitude) } : {})
    });
    res.status(201).json({ location });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Location already exists" });
    res.status(500).json({ message: "Could not create location" });
  }
}

async function getCategories(req, res) {
  try { const categories = await VehicleCategory.find().sort({ name: 1 }); res.json({ categories }); }
  catch (error) { res.status(500).json({ message: "Could not fetch vehicle categories" }); }
}

async function createCategory(req, res) {
  try {
    const { name, description, pricePerKm } = req.body;
    if (!name?.trim() || !Number.isFinite(Number(pricePerKm)) || Number(pricePerKm) < 0) return res.status(400).json({ message: "Category name and a valid price per km are required" });
    const category = await VehicleCategory.create({ name: name.trim(), description: description?.trim(), pricePerKm: Number(pricePerKm) });
    res.status(201).json({ category });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Vehicle category already exists" });
    res.status(500).json({ message: "Could not create vehicle category" });
  }
}

async function getVehicles(req, res) {
  try {
    const [vehicles, activeVehicleIds, reservedVehicleIds] = await Promise.all([
      Vehicle.find().populate("driverId", "name phone").sort({ createdAt: -1 }),
      Booking.distinct("selectedVehicleId", {
        status: { $in: ["pending", "accepted", "ongoing"] },
        selectedVehicleId: { $ne: null }
      }),
      Vehicle.distinct("_id", { activeBookingId: { $ne: null } })
    ]);
    const bookedIds = new Set([...activeVehicleIds, ...reservedVehicleIds].map((id) => id.toString()));
    res.json({
      vehicles: vehicles.map((vehicle) => ({
        ...vehicle.toObject(),
        isBooked: bookedIds.has(vehicle._id.toString())
      }))
    });
  }
  catch (error) { res.status(500).json({ message: "Could not fetch vehicles" }); }
}

async function getPayments(req, res) {
  try { const payments = await Payment.find().populate({ path: "bookingId", select: "pickup destination customerId driverId travellingDuration", populate: [{ path: "customerId", select: "name" }, { path: "driverId", select: "name" }] }).sort({ paymentDate: -1 }); res.json({ payments }); }
  catch (error) { res.status(500).json({ message: "Could not fetch payments" }); }
}

async function getBookings(req, res) {
  try { const bookings = await require("../Models/Booking").find().populate("customerId", "name").populate("driverId", "name").sort({ createdAt: -1 }).limit(200); res.json({ bookings }); }
  catch (error) { res.status(500).json({ message: "Could not fetch bookings" }); }
}

async function getFeedback(req, res) {
  try { const feedback = await Feedback.find().populate("customerId", "name").populate("driverId", "name").populate("bookingId", "pickup destination").sort({ createdAt: -1 }); res.json({ feedback }); }
  catch (error) { res.status(500).json({ message: "Could not fetch feedback" }); }
}

async function deleteLocation(req, res) {
  try { const location = await Location.findByIdAndDelete(req.params.id); if (!location) return res.status(404).json({ message: "Location not found" }); res.json({ message: "Location removed" }); }
  catch (error) { res.status(500).json({ message: "Could not remove location" }); }
}

async function deleteCategory(req, res) {
  try { const category = await VehicleCategory.findByIdAndDelete(req.params.id); if (!category) return res.status(404).json({ message: "Category not found" }); res.json({ message: "Vehicle category removed" }); }
  catch (error) { res.status(500).json({ message: "Could not remove category" }); }
}

async function getAllDrivers(req, res) {
  try {
    const drivers = await User.find({ role: "driver" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ count: drivers.length, drivers });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch drivers" });
  }
}

async function updateDriverStatus(req, res) {
  try {
    const { status } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid driver status" });
    }

    const driver = await User.findOneAndUpdate(
      { _id: req.params.id, role: "driver" },
      { $set: { driverStatus: status } },
      { new: true, runValidators: true }
    ).select("-password");

    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({
      message: `Driver status changed to ${status}`,
      driver
    });
  } catch (error) {
    res.status(500).json({ message: "Could not update driver status" });
  }
}

module.exports = { getAllDrivers, updateDriverStatus, getLocations, createLocation, getCategories, createCategory, getVehicles, getPayments, getFeedback, getBookings, deleteLocation, deleteCategory };
