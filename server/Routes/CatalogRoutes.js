const express = require("express");
const multer = require("multer");
const router = express.Router();
const Location = require("../Models/Location");
const VehicleCategory = require("../Models/VehicleCategory");
const Vehicle = require("../Models/Vehicle");
const Booking = require("../Models/Booking");
const User = require("../Models/User");
const { protect, authorize } = require("../Middleware/AuthMiddleware");

const VEHICLE_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
const allowedVehicleImageTypes = new Map([
  ["image/jpeg", (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff],
  ["image/png", (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))],
  ["image/webp", (buffer) => buffer.subarray(0, 4).toString() === "RIFF" && buffer.subarray(8, 12).toString() === "WEBP"]
]);
const vehicleImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: VEHICLE_IMAGE_MAX_BYTES, files: 1, fields: 20, fieldSize: 16 * 1024, parts: 21 }
}).single("vehicleImage");

function handleVehicleImageUpload(req, res, next) {
  vehicleImageUpload(req, res, (error) => {
    if (!error) return next();
    if (error.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "Vehicle image must be 5 MB or smaller" });
    if (error.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ message: "Upload one vehicle image" });
    if (["LIMIT_FIELD_COUNT", "LIMIT_FIELD_VALUE", "LIMIT_PART_COUNT"].includes(error.code)) {
      return res.status(400).json({ message: "Vehicle details contain too many or oversized fields" });
    }
    next(error);
  });
}

function validateVehicleImage(req, res, next) {
  if (!req.file) return next();
  const isValidImage = allowedVehicleImageTypes.get(req.file.mimetype);
  if (!isValidImage || !isValidImage(req.file.buffer)) {
    return res.status(400).json({ message: "Vehicle image must be a valid JPG, PNG or WebP file" });
  }
  next();
}

function validAvailability(value) {
  return value === true || value === false || value === "true" || value === "false";
}

router.get("/locations", async (req, res) => {
  try { res.json({ locations: await Location.find().sort({ name: 1 }) }); }
  catch (error) { res.status(500).json({ message: "Could not fetch locations" }); }
});
router.get("/categories", async (req, res) => {
  try { res.json({ categories: await VehicleCategory.find().sort({ name: 1 }) }); }
  catch (error) { res.status(500).json({ message: "Could not fetch vehicle categories" }); }
});
router.get("/vehicles", async (req, res) => {
  try {
    const [approvedDrivers, categories, locations, bookedVehicleIds, reservedVehicleIds] = await Promise.all([
      User.find({ role: "driver", driverStatus: "approved" }).select("_id"),
      VehicleCategory.find().select("name"),
      Location.find().select("name"),
      Booking.distinct("selectedVehicleId", {
        status: { $in: ["pending", "accepted", "ongoing"] },
        selectedVehicleId: { $ne: null }
      }),
      Vehicle.distinct("_id", { activeBookingId: { $ne: null } })
    ]);
    const query = {
      driverId: { $in: approvedDrivers.map((driver) => driver._id) },
      category: { $in: categories.map((category) => category.name) },
      serviceLocation: { $in: locations.map((location) => location.name) }
    };
    if (typeof req.query.location === "string" && req.query.location.trim()) query.serviceLocation = req.query.location.trim();
    const unavailableIds = new Set([...bookedVehicleIds, ...reservedVehicleIds].map((id) => id.toString()));
    const vehicles = await Vehicle.find(query)
      .select("-activeBookingId")
      .populate("driverId", "name")
      .sort({ createdAt: -1 });
    res.json({
      vehicles: vehicles.map((vehicle) => ({
        ...vehicle.toObject(),
        isAvailable: vehicle.isAvailable !== false && !unavailableIds.has(vehicle._id.toString())
      }))
    });
  }
  catch (error) { res.status(500).json({ message: "Could not fetch vehicles" }); }
});
router.get("/drivers", async (req, res) => {
  try {
    const drivers = await User.find({ role: "driver", driverStatus: "approved" }).select("name createdAt").sort({ name: 1 });
    res.json({ drivers });
  } catch (error) { res.status(500).json({ message: "Could not fetch local drivers" }); }
});
router.post("/vehicles", protect, authorize("driver"), handleVehicleImageUpload, validateVehicleImage, async (req, res) => {
  try {
    const { vehicleNumber, vehicleName, vehicleModel, category, serviceLocation, colour = "", seats, isAvailable } = req.body;
    const model = vehicleModel || vehicleName;
    if (![vehicleNumber, model, category, serviceLocation].every((value) => typeof value === "string" && value.trim()) || typeof colour !== "string") return res.status(400).json({ message: "Vehicle number, model, category and service location are required" });
    if (!Number.isInteger(Number(seats)) || Number(seats) < 1 || Number(seats) > 20) return res.status(400).json({ message: "Seats must be between 1 and 20" });
    if (isAvailable !== undefined && !validAvailability(isAvailable)) return res.status(400).json({ message: "Vehicle availability must be true or false" });
    const [categoryExists, locationExists] = await Promise.all([
      require("../Models/VehicleCategory").exists({ name: category.trim() }),
      Location.exists({ name: serviceLocation.trim() })
    ]);
    if (!categoryExists) return res.status(400).json({ message: "Choose an existing vehicle category" });
    if (!locationExists) return res.status(400).json({ message: "Choose an existing service location" });
    const vehicle = await Vehicle.create({
      driverId: req.user.id,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleName: model.trim(),
      vehicleModel: model.trim(),
      category: category.trim(),
      serviceLocation: serviceLocation.trim(),
      colour: colour.trim(),
      seats: Number(seats),
      isAvailable: isAvailable !== false && isAvailable !== "false",
      ...(req.file ? { hasImage: true, imageData: req.file.buffer, imageContentType: req.file.mimetype } : {})
    });
    res.status(201).json({ vehicle });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That vehicle number is already registered" });
    res.status(500).json({ message: "Could not register vehicle" });
  }
});
router.get("/my-vehicles", protect, authorize("driver"), async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ driverId: req.user.id }).sort({ createdAt: -1 });
    const vehicleIds = vehicles.map((vehicle) => vehicle._id);
    const activeBookingIds = await Booking.distinct("selectedVehicleId", {
      status: { $in: ["pending", "accepted", "ongoing"] },
      selectedVehicleId: { $in: vehicleIds }
    });
    const reservedVehicleIds = await Vehicle.distinct("_id", {
      _id: { $in: vehicleIds },
      activeBookingId: { $ne: null }
    });
    const bookedIds = new Set([...activeBookingIds, ...reservedVehicleIds].map((id) => id.toString()));
    res.json({
      vehicles: vehicles.map((vehicle) => ({
        ...vehicle.toObject(),
        isBooked: bookedIds.has(vehicle._id.toString())
      }))
    });
  }
  catch (error) { res.status(500).json({ message: "Could not fetch your vehicles" }); }
});
router.get("/vehicles/:id/image", async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).select("+imageData +imageContentType");
    if (!vehicle?.imageData || !vehicle.imageContentType) return res.status(404).json({ message: "Vehicle image not found" });
    res.set({
      "Content-Type": vehicle.imageContentType,
      "Content-Length": vehicle.imageData.length,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff"
    });
    res.send(vehicle.imageData);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch vehicle image" });
  }
});
router.delete("/vehicles/:id", protect, authorize("driver"), async (req, res) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({ _id: req.params.id, driverId: req.user.id });
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ message: "Vehicle removed" });
  } catch (error) { res.status(500).json({ message: "Could not remove vehicle" }); }
});
router.patch("/vehicles/:id", protect, authorize("driver"), handleVehicleImageUpload, validateVehicleImage, async (req, res) => {
  try {
    const { vehicleNumber, vehicleName, vehicleModel, category, serviceLocation, colour = "", seats, isAvailable } = req.body;
    const model = vehicleModel || vehicleName;
    if (![vehicleNumber, model, category, serviceLocation].every((value) => typeof value === "string" && value.trim()) || typeof colour !== "string") {
      return res.status(400).json({ message: "Vehicle number, model, category and service location are required" });
    }
    if (!Number.isInteger(Number(seats)) || Number(seats) < 1 || Number(seats) > 20) {
      return res.status(400).json({ message: "Seats must be between 1 and 20" });
    }
    if (!validAvailability(isAvailable)) return res.status(400).json({ message: "Vehicle availability must be true or false" });
    const [categoryExists, locationExists] = await Promise.all([
      VehicleCategory.exists({ name: category.trim() }),
      Location.exists({ name: serviceLocation.trim() })
    ]);
    if (!categoryExists) return res.status(400).json({ message: "Choose an existing vehicle category" });
    if (!locationExists) return res.status(400).json({ message: "Choose an existing service location" });
    const vehicle = await Vehicle.findOneAndUpdate(
      { _id: req.params.id, driverId: req.user.id },
      { $set: {
        vehicleNumber: vehicleNumber.trim().toUpperCase(),
        vehicleName: model.trim(),
        vehicleModel: model.trim(),
        category: category.trim(),
        serviceLocation: serviceLocation.trim(),
        colour: colour.trim(),
        seats: Number(seats),
        isAvailable: isAvailable === true || isAvailable === "true",
        ...(req.file ? { hasImage: true, imageData: req.file.buffer, imageContentType: req.file.mimetype } : {})
      } },
      { new: true, runValidators: true }
    );
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json({ vehicle });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "That vehicle number is already registered" });
    res.status(500).json({ message: "Could not update vehicle" });
  }
});
module.exports = router;
