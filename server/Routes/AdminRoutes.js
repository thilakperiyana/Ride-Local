
const express = require("express");
const router = express.Router();

const {
  getAllDrivers,
  updateDriverStatus,
  getLocations,
  createLocation,
  getCategories,
  createCategory,
  getVehicles,
  getPayments,
  getFeedback,
  getBookings,
  deleteLocation,
  deleteCategory
} = require("../Controllers/AdminController");

const {
  protect,
  authorize
} = require("../Middleware/AuthMiddleware");

router.use(protect, authorize("admin"));

router.get("/drivers", getAllDrivers);

router.patch("/drivers/:id/status", updateDriverStatus);
router.get("/locations", getLocations);
router.post("/locations", createLocation);
router.get("/categories", getCategories);
router.post("/categories", createCategory);
router.delete("/locations/:id", deleteLocation);
router.delete("/categories/:id", deleteCategory);
router.get("/vehicles", getVehicles);
router.get("/payments", getPayments);
router.get("/feedback", getFeedback);
router.get("/bookings", getBookings);

module.exports = router;
