const bcrypt = require("bcryptjs");
const User = require("../Models/User");
const Vehicle = require("../Models/Vehicle");
const Location = require("../Models/Location");
const VehicleCategory = require("../Models/VehicleCategory");

const LICENSE_MAX_BYTES = 5 * 1024 * 1024;
const allowedLicenseTypes = new Map([
  ["application/pdf", { extension: "pdf", signature: (buffer) => buffer.subarray(0, 5).toString() === "%PDF-" }],
  ["image/jpeg", { extension: "jpg", signature: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff }],
  ["image/png", { extension: "png", signature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) }]
]);

function isDriver(req, res) {
  if (req.user?.role === "driver") return true;
  res.status(403).json({ message: "Driver account required" });
  return false;
}

async function registerDriver(req, res) {
  let createdUser;
  try {
    const {
      name, email, phone, password, address, licenseNumber,
      vehicleModel, vehicleNumber, category, serviceLocation, colour, seats
    } = req.body;

    const required = { name, email, phone, password, address, licenseNumber, vehicleModel, vehicleNumber, category, serviceLocation, colour };
    if (Object.values(required).some((value) => typeof value !== "string" || !value.trim())) {
      return res.status(400).json({ message: "Complete all personal, licence and vehicle fields" });
    }
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });
    if (password.length > 128) return res.status(400).json({ message: "Password must be no more than 128 characters" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return res.status(400).json({ message: "Enter a valid email address" });
    if (name.trim().length > 100 || email.trim().length > 254 || phone.trim().length > 24
      || address.trim().length > 300 || licenseNumber.trim().length > 40
      || vehicleModel.trim().length > 80 || vehicleNumber.trim().length > 20 || colour.trim().length > 40) {
      return res.status(400).json({ message: "One or more fields exceed the allowed length" });
    }
    if (!Number.isInteger(Number(seats)) || Number(seats) < 1 || Number(seats) > 20) {
      return res.status(400).json({ message: "Seats must be between 1 and 20" });
    }
    if (!req.file || req.file.size > LICENSE_MAX_BYTES) {
      return res.status(400).json({ message: "Upload a licence document up to 5 MB" });
    }
    const documentType = allowedLicenseTypes.get(req.file.mimetype);
    if (!documentType || !documentType.signature(req.file.buffer)) {
      return res.status(400).json({ message: "Licence document must be a valid PDF, JPG or PNG file" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedLicense = licenseNumber.trim().toUpperCase();
    const normalizedVehicleNumber = vehicleNumber.trim().toUpperCase();
    const [existingUser, duplicateVehicle, validCategory, validLocation] = await Promise.all([
      User.findOne({ email: normalizedEmail }).select("_id"),
      Vehicle.findOne({ vehicleNumber: normalizedVehicleNumber }).select("_id"),
      VehicleCategory.exists({ name: category.trim() }),
      Location.exists({ name: serviceLocation.trim() })
    ]);
    if (existingUser) return res.status(409).json({ message: "Email already registered" });
    if (duplicateVehicle) return res.status(409).json({ message: "That vehicle number is already registered" });
    if (!validCategory) return res.status(400).json({ message: "Choose an existing vehicle category" });
    if (!validLocation) return res.status(400).json({ message: "Choose an existing service location" });

    if (await User.exists({ role: "driver", licenseNumber: normalizedLicense })) {
      return res.status(409).json({ message: "That driving licence number is already registered" });
    }

    createdUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: await bcrypt.hash(password, 12),
      role: "driver",
      driverStatus: "pending",
      licenseNumber: normalizedLicense,
      address: address.trim(),
      hasLicenseDocument: true,
      licenseDocument: req.file.buffer,
      licenseDocumentContentType: req.file.mimetype,
      licenseDocumentName: `driver-license.${documentType.extension}`
    });

    const vehicle = await Vehicle.create({
      driverId: createdUser._id,
      vehicleNumber: normalizedVehicleNumber,
      vehicleName: vehicleModel.trim(),
      vehicleModel: vehicleModel.trim(),
      category: category.trim(),
      serviceLocation: serviceLocation.trim(),
      colour: colour.trim(),
      seats: Number(seats),
      isAvailable: true
    });

    res.status(201).json({
      message: "Driver application submitted. Await admin approval.",
      driver: {
        id: createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        driverStatus: createdUser.driverStatus
      },
      vehicle
    });
  } catch (error) {
    if (createdUser) {
      try {
        await Vehicle.deleteOne({ driverId: createdUser._id });
        await User.deleteOne({ _id: createdUser._id });
      } catch (cleanupError) {
        console.error("Driver registration rollback failed:", cleanupError.message);
      }
    }
    if (error.code === 11000) return res.status(409).json({ message: "Email, licence number or vehicle number is already registered" });
    console.error("Driver registration failed:", error.message);
    res.status(500).json({ message: "Could not submit driver application" });
  }
}

async function getDriverProfile(req, res) {
  try {
    if (!isDriver(req, res)) return;
    const driver = await User.findOne({ _id: req.user.id, role: "driver" })
      .select("name email phone address licenseNumber driverStatus createdAt hasLicenseDocument");
    if (!driver) return res.status(404).json({ message: "Driver account not found" });
    res.json({ driver });
  } catch (error) {
    console.error("Driver profile lookup failed:", error.message);
    res.status(500).json({ message: "Could not fetch driver profile" });
  }
}

async function getDriverDirectory(req, res) {
  try {
    const drivers = await User.find({ role: "driver" })
      .select("name driverStatus createdAt")
      .sort({ name: 1 });
    const vehicles = await Vehicle.find({ driverId: { $in: drivers.map((driver) => driver._id) } })
      .select("driverId vehicleNumber vehicleModel vehicleName category serviceLocation colour isAvailable");
    const vehiclesByDriver = new Map();
    for (const vehicle of vehicles) {
      const key = vehicle.driverId.toString();
      vehiclesByDriver.set(key, [...(vehiclesByDriver.get(key) || []), vehicle]);
    }
    res.json({
      drivers: drivers.map((driver) => {
        const driverVehicles = vehiclesByDriver.get(driver._id.toString()) || [];
        return {
          _id: driver._id,
          name: driver.name,
          driverStatus: driver.driverStatus,
          createdAt: driver.createdAt,
          availability: driver.driverStatus !== "approved"
            ? "not approved"
            : driverVehicles.some((vehicle) => vehicle.isAvailable !== false) ? "available" : "unavailable",
          vehicles: driverVehicles
        };
      })
    });
  } catch (error) {
    console.error("Driver directory lookup failed:", error.message);
    res.status(500).json({ message: "Could not fetch approved drivers" });
  }
}

async function getDriverLicenseDocument(req, res) {
  try {
    const driver = await User.findOne({ _id: req.params.id, role: "driver" })
      .select("+licenseDocument +licenseDocumentContentType +licenseDocumentName");
    if (!driver?.licenseDocument) return res.status(404).json({ message: "Licence document not found" });
    res.set({
      "Content-Type": driver.licenseDocumentContentType,
      "Content-Disposition": `inline; filename="${driver.licenseDocumentName}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff"
    });
    res.send(driver.licenseDocument);
  } catch (error) {
    console.error("Driver licence document lookup failed:", error.message);
    res.status(500).json({ message: "Could not fetch licence document" });
  }
}

module.exports = { registerDriver, getDriverProfile, getDriverDirectory, getDriverLicenseDocument, LICENSE_MAX_BYTES };
