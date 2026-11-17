
const express = require("express");
const router = express.Router();

const {
  createBooking,
  getAvailableBookings,
  getMyBookings,
  getDriverBookings,
  acceptBooking,
  rejectBooking,
  updateRideStatus,
  payForBooking,
  getMyPayments,
  getDriverPayments,
  submitFeedback,
  getMyFeedback,
  updateRideLocation,
  getRideLocation
} = require("../Controllers/BookingController");

const {
  protect,
  authorize
} = require("../Middleware/AuthMiddleware");

router.post("/", protect, authorize("customer"), createBooking);

router.get(
  "/available",
  protect,
  authorize("driver"),
  getAvailableBookings
);

router.get(
  "/my-bookings",
  protect,
  authorize("customer"),
  getMyBookings
);

router.get(
  "/driver-bookings",
  protect,
  authorize("driver"),
  getDriverBookings
);

router.patch(
  "/:id/accept",
  protect,
  authorize("driver"),
  acceptBooking
);

router.post("/:id/payment", protect, authorize("customer"), payForBooking);
router.get("/my-payments", protect, authorize("customer"), getMyPayments);
router.get("/driver-payments", protect, authorize("driver"), getDriverPayments);
router.post("/:id/feedback", protect, authorize("customer"), submitFeedback);
router.get("/my-feedback", protect, authorize("driver", "customer"), getMyFeedback);

router.patch(
  "/:id/reject",
  protect,
  authorize("driver"),
  rejectBooking
);

router.patch(
  "/:id/status",
  protect,
  authorize("driver"),
  updateRideStatus
);

router.patch(
  "/:id/location",
  protect,
  authorize("driver"),
  updateRideLocation
);
router.get(
  "/:id/location",
  protect,
  authorize("customer"),
  getRideLocation
);

module.exports = router;
