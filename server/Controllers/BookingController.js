const mongoose = require("mongoose");
const Booking = require("../Models/Booking");
const VehicleCategory = require("../Models/VehicleCategory");
const Payment = require("../Models/Payment");
const Feedback = require("../Models/feedback");
const Location = require("../Models/Location");
const Vehicle = require("../Models/Vehicle");

function calculateDistanceKm(origin, destination) {
  const coordinates = [origin.latitude, origin.longitude, destination.latitude, destination.longitude];
  if (!coordinates.every(Number.isFinite)) return 5;

  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const value = Math.min(1, Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(origin.latitude))
    * Math.cos(radians(destination.latitude))
    * Math.sin(longitudeDelta / 2) ** 2);
  const straightLineKm = 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  return Math.max(1, Number((straightLineKm * 1.25).toFixed(1)));
}

function isValidCoordinatePoint(point) {
  return point && Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    && point.latitude >= -90 && point.latitude <= 90
    && point.longitude >= -180 && point.longitude <= 180;
}

function straightLineDistanceKm(origin, destination) {
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(destination.latitude - origin.latitude);
  const longitudeDelta = radians(destination.longitude - origin.longitude);
  const value = Math.min(1, Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(origin.latitude))
    * Math.cos(radians(destination.latitude))
    * Math.sin(longitudeDelta / 2) ** 2);
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

async function createBooking(req, res) {
  let reservedVehicleId;
  let reservationId;
  try {
    const { pickup, destination, pickupCoordinates, destinationCoordinates, vehicleCategory, vehicleId, pickupTime } = req.body;

    if (![pickup, destination, vehicleCategory].every((value) => typeof value === "string" && value.trim())
      || pickup.length > 300 || destination.length > 300) {
      return res.status(400).json({
        message: "Pickup, destination and vehicle category are required"
      });
    }

    const hasMapCoordinates = pickupCoordinates !== undefined || destinationCoordinates !== undefined;
    if (hasMapCoordinates && (!isValidCoordinatePoint(pickupCoordinates) || !isValidCoordinatePoint(destinationCoordinates))) {
      return res.status(400).json({ message: "Choose valid pickup and drop-off points on the map" });
    }
    if (hasMapCoordinates && (!vehicleId || !mongoose.Types.ObjectId.isValid(vehicleId))) {
      return res.status(400).json({ message: "Choose an available vehicle for this ride" });
    }

    if (pickup.trim().toLowerCase() === destination.trim().toLowerCase()
      && !hasMapCoordinates) {
      return res.status(400).json({
        message: "Pickup and destination must be different"
      });
    }
    if (hasMapCoordinates && straightLineDistanceKm(pickupCoordinates, destinationCoordinates) < 0.1) {
      return res.status(400).json({ message: "Pickup and destination must be different map points" });
    }

    if (pickupTime && (!Number.isFinite(new Date(pickupTime).getTime()) || new Date(pickupTime) < new Date())) {
      return res.status(400).json({ message: "Pickup time must be a valid future date and time" });
    }

    const category = await VehicleCategory.findOne({ name: vehicleCategory.trim() });
    if (!category) return res.status(400).json({ message: "Choose an available vehicle category" });

    let pickupPlace;
    let destinationPlace;
    let pickupArea;
    if (hasMapCoordinates) {
      const activeVehicleIds = await Booking.distinct("selectedVehicleId", {
        status: { $in: ["pending", "accepted", "ongoing"] },
        selectedVehicleId: { $ne: null }
      });
      const availableVehicles = await Vehicle.find({
        category: vehicleCategory.trim(),
        ...(vehicleId ? { _id: vehicleId } : {}),
        $and: [
          { _id: { $nin: activeVehicleIds } },
          { $or: [{ isAvailable: true }, { isAvailable: { $exists: false } }] },
          { activeBookingId: null }
        ]
      })
        .select("driverId serviceLocation")
        .populate({ path: "driverId", select: "role driverStatus", match: { role: "driver", driverStatus: "approved" } });
      if (vehicleId && !availableVehicles.length) {
        return res.status(409).json({ message: "That vehicle is booked or no longer available. Please choose another one." });
      }
      const serviceLocations = [...new Set(availableVehicles
        .filter((vehicle) => vehicle.driverId && vehicle.serviceLocation)
        .map((vehicle) => vehicle.serviceLocation))];
      const locations = await Location.find({
        name: { $in: serviceLocations },
        latitude: { $exists: true },
        longitude: { $exists: true }
      }).select("name latitude longitude");
      const maxPickupDistanceKm = Number(process.env.MAX_PICKUP_DISTANCE_KM || 25);
      const nearestLocation = locations
        .map((location) => ({ location, distance: straightLineDistanceKm(pickupCoordinates, location) }))
        .filter((candidate) => candidate.distance <= maxPickupDistanceKm)
        .sort((left, right) => left.distance - right.distance)[0];
      if (!nearestLocation) {
        return res.status(400).json({
          message: `No approved drivers serve this pickup area within ${maxPickupDistanceKm} km`
        });
      }
      pickupArea = nearestLocation.location.name;
      pickupPlace = pickupCoordinates;
      destinationPlace = destinationCoordinates;
    } else {
      [pickupPlace, destinationPlace] = await Promise.all([
        Location.findOne({ name: pickup.trim() }),
        Location.findOne({ name: destination.trim() })
      ]);
      if (!pickupPlace || !destinationPlace) return res.status(400).json({ message: "Choose valid pickup and destination locations" });
    }

    const distanceKm = calculateDistanceKm(pickupPlace, destinationPlace);
    const travellingDuration = Math.max(5, Math.ceil((distanceKm / 25) * 60) + 5);
    const minimumFare = Math.max(0, Number(process.env.MINIMUM_FARE_INR || 50));
    const estimatedFare = Number(Math.max(minimumFare, Number(category.pricePerKm || 0) * distanceKm).toFixed(2));
    reservationId = new mongoose.Types.ObjectId();
    if (hasMapCoordinates && vehicleId) {
      const reservedVehicle = await Vehicle.findOneAndUpdate(
        {
          _id: vehicleId,
          category: vehicleCategory.trim(),
          $and: [
            { $or: [{ isAvailable: true }, { isAvailable: { $exists: false } }] },
            { activeBookingId: null }
          ]
        },
        { $set: { activeBookingId: reservationId } },
        { new: true }
      ).select("_id");
      if (!reservedVehicle) {
        return res.status(409).json({ message: "That vehicle was just booked or is no longer available. Please choose another one." });
      }
      reservedVehicleId = reservedVehicle._id;
    }

    const booking = await Booking.create({
      _id: reservationId,
      customerId: req.user.id,
      pickup: pickup.trim(),
      destination: destination.trim(),
      ...(hasMapCoordinates ? { pickupCoordinates, destinationCoordinates, pickupArea } : {}),
      vehicleCategory: vehicleCategory.trim(),
      ...(hasMapCoordinates && vehicleId ? { selectedVehicleId: vehicleId } : {}),
      pickupTime: pickupTime ? new Date(pickupTime) : undefined,
      distanceKm,
      travellingDuration,
      estimatedFare
    });

    res.status(201).json({
      message: "Ride requested successfully",
      booking
    });
  } catch (error) {
    if (reservedVehicleId && reservationId) {
      try {
        await Vehicle.updateOne(
          { _id: reservedVehicleId, activeBookingId: reservationId },
          { $unset: { activeBookingId: "" } }
        );
      } catch (cleanupError) {
        console.error("Vehicle booking reservation rollback failed:", cleanupError.message);
      }
    }
    res.status(500).json({ message: "Could not create booking" });
  }
}

async function getAvailableBookings(req, res) {
  try {
    const vehicles = await Vehicle.find({
      driverId: req.user.id,
      $or: [{ isAvailable: true }, { isAvailable: { $exists: false } }]
    }).select("category serviceLocation");
    const matches = [...new Map(vehicles
      .filter((vehicle) => vehicle.category && vehicle.serviceLocation)
      .flatMap((vehicle) => [
        [`legacy:${vehicle.category}\u0000${vehicle.serviceLocation}`, {
          vehicleCategory: vehicle.category,
          pickup: vehicle.serviceLocation
        }],
        [`map:${vehicle.category}\u0000${vehicle.serviceLocation}`, {
          vehicleCategory: vehicle.category,
          pickupArea: vehicle.serviceLocation
        }]
      ])).values()];
    if (!matches.length) return res.json({ bookings: [] });
    const bookings = await Booking.find({
      status: "pending",
      driverId: null,
      rejectedBy: { $ne: req.user.id },
      $and: [
        { $or: matches },
        { $or: [
          { selectedVehicleId: { $exists: false } },
          { selectedVehicleId: null },
          { selectedVehicleId: { $in: vehicles.map((vehicle) => vehicle._id) } }
        ] }
      ]
    })
      .populate("customerId", "name phone")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch bookings" });
  }
}

async function getMyBookings(req, res) {
  try {
    const bookings = await Booking.find({ customerId: req.user.id })
      .select("-driverLocation")
      .populate("driverId", "name phone")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch your bookings" });
  }
}

async function getDriverBookings(req, res) {
  try {
    const bookings = await Booking.find({ driverId: req.user.id })
      .populate("customerId", "name phone")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch driver bookings" });
  }
}

async function acceptBooking(req, res) {
  try {
    const requestedBooking = await Booking.findOne({
      _id: req.params.id,
      status: "pending",
      driverId: null,
      rejectedBy: { $ne: req.user.id }
    }).select("pickup pickupArea vehicleCategory selectedVehicleId");
    if (!requestedBooking) {
      return res.status(409).json({ message: "Booking unavailable or already assigned" });
    }
    const hasMatchingVehicle = await Vehicle.exists({
      driverId: req.user.id,
      ...(requestedBooking.selectedVehicleId ? { _id: requestedBooking.selectedVehicleId } : {}),
      category: requestedBooking.vehicleCategory,
      serviceLocation: requestedBooking.pickupArea || requestedBooking.pickup,
      $and: [
        { $or: [{ isAvailable: true }, { isAvailable: { $exists: false } }] },
        { $or: [{ activeBookingId: requestedBooking._id }, { activeBookingId: null }] }
      ]
    });
    if (!hasMatchingVehicle) {
      return res.status(403).json({ message: "Add a vehicle for this category and pickup location before accepting" });
    }

    // Atomic update prevents two drivers accepting the same request.
    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "pending",
        driverId: null,
        rejectedBy: { $ne: req.user.id }
      },
      {
        $set: {
          driverId: req.user.id,
          status: "accepted"
        }
      },
      { new: true, runValidators: true }
    );

    if (!booking) {
      return res.status(409).json({
        message: "Booking unavailable or already assigned"
      });
    }

    res.json({ message: "Booking accepted", booking });
  } catch (error) {
    res.status(500).json({ message: "Could not accept booking" });
  }
}

async function rejectBooking(req, res) {
  try {
    const assignedVehicleBooking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        status: "pending",
        driverId: null,
        rejectedBy: { $ne: req.user.id },
        selectedVehicleId: { $ne: null }
      },
      { $set: { status: "cancelled" } },
      { new: true }
    ).select("selectedVehicleId");
    if (assignedVehicleBooking) {
      await Vehicle.updateOne(
        { _id: assignedVehicleBooking.selectedVehicleId, activeBookingId: assignedVehicleBooking._id },
        { $unset: { activeBookingId: "" } }
      );
      return res.json({ message: "Request dismissed and cancelled because this ride was for your selected vehicle" });
    }

    const result = await Booking.updateOne(
      {
        _id: req.params.id,
        status: "pending",
        driverId: null,
        rejectedBy: { $ne: req.user.id }
      },
      { $addToSet: { rejectedBy: req.user.id } }
    );

    if (!result.modifiedCount) {
      return res.status(409).json({ message: "Booking unavailable or already dismissed" });
    }

    res.json({ message: "Booking dismissed from your requests" });
  } catch (error) {
    res.status(500).json({ message: "Could not reject booking" });
  }
}

async function updateRideStatus(req, res) {
  try {
    const { status } = req.body;

    const previousStatus = {
      ongoing: "accepted",
      completed: "ongoing"
    };

    if (!previousStatus[status]) {
      return res.status(400).json({ message: "Invalid ride status" });
    }

    const now = new Date();
    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        driverId: req.user.id,
        status: previousStatus[status],
        ...(status === "ongoing" ? { $or: [{ pickupTime: { $exists: false } }, { pickupTime: null }, { pickupTime: { $lte: now } }] } : {})
      },
      { $set: { status, ...(status === "completed" ? { "driverLocation.isSharing": false } : {}) } },
      { new: true }
    );

    if (!booking) {
      if (status === "ongoing") {
        const scheduledRide = await Booking.findOne({
          _id: req.params.id,
          driverId: req.user.id,
          status: "accepted",
          pickupTime: { $gt: now }
        }).select("pickupTime");
        if (scheduledRide) {
          return res.status(409).json({
            message: `This ride is scheduled for ${scheduledRide.pickupTime.toISOString()}. You can start it at the pickup time.`
          });
        }
      }
      return res.status(409).json({
        message: "Ride not found or status transition is invalid"
      });
    }

    if (status === "completed" && booking.selectedVehicleId) {
      await Vehicle.updateOne(
        { _id: booking.selectedVehicleId, activeBookingId: booking._id },
        { $unset: { activeBookingId: "" } }
      );
    }

    res.json({ message: `Ride ${status}`, booking });
  } catch (error) {
    res.status(500).json({ message: "Could not update ride" });
  }
}

async function payForBooking(req, res) {
  try {
    const { paymentMethod = "Cash" } = req.body;
    if (!["Cash", "Card", "UPI"].includes(paymentMethod)) return res.status(400).json({ message: "Choose Cash, Card or UPI" });
    const booking = await Booking.findOne({ _id: req.params.id, customerId: req.user.id, status: "completed" });
    if (!booking) return res.status(404).json({ message: "Only your completed rides can be paid" });
    const existingPayment = await Payment.findOne({ bookingId: booking._id });
    if (existingPayment?.status === "paid") return res.status(409).json({ message: "This ride has already been paid" });
    const driverSharePercent = Math.min(100, Math.max(0, Number(process.env.DRIVER_SHARE_PERCENT || 80)));
    const driverShare = Number((booking.estimatedFare * driverSharePercent / 100).toFixed(2));
    const platformShare = Number((booking.estimatedFare - driverShare).toFixed(2));
    const status = paymentMethod === "Cash" ? "paid" : "pending";
    const payment = await Payment.findOneAndUpdate(
      { bookingId: booking._id },
      { $set: { amount: booking.estimatedFare, driverShare, platformShare, paymentMethod, status, paymentDate: new Date() } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    res.json({
      message: status === "paid"
        ? "Cash payment recorded"
        : `${paymentMethod} is demo-only and was not charged. Payment remains pending.`,
      payment
    });
  } catch (error) { res.status(500).json({ message: "Could not record payment" }); }
}

async function getDriverPayments(req, res) {
  try {
    const bookings = await Booking.find({ driverId: req.user.id }).select("_id");
    const payments = await Payment.find({ bookingId: { $in: bookings.map((booking) => booking._id) } }).populate("bookingId", "pickup destination status").sort({ paymentDate: -1 });
    const paid = payments.filter((payment) => payment.status === "paid");
    const totalShare = paid.reduce((sum, payment) => sum + payment.driverShare, 0);
    res.json({ payments, totalShare: Number(totalShare.toFixed(2)) });
  } catch (error) { res.status(500).json({ message: "Could not fetch driver payment shares" }); }
}

async function getMyPayments(req, res) {
  try {
    const bookings = await Booking.find({ customerId: req.user.id }).select("_id");
    const payments = await Payment.find({ bookingId: { $in: bookings.map((booking) => booking._id) } }).populate("bookingId", "pickup destination status").sort({ paymentDate: -1 });
    res.json({ payments });
  } catch (error) { res.status(500).json({ message: "Could not fetch payments" }); }
}

async function submitFeedback(req, res) {
  try {
    const rating = Number(req.body.rating);
    const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be between 1 and 5" });
    if (comment.length > 1000) return res.status(400).json({ message: "Feedback must be under 1000 characters" });
    const booking = await Booking.findOne({ _id: req.params.id, customerId: req.user.id, status: "completed" });
    if (!booking) return res.status(404).json({ message: "Feedback is available after your ride is completed" });
    const feedback = await Feedback.create({ customerId: req.user.id, driverId: booking.driverId, bookingId: booking._id, rating, comment });
    res.status(201).json({ message: "Thanks for your feedback", feedback });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ message: "Feedback already submitted for this ride" });
    res.status(500).json({ message: "Could not submit feedback" });
  }
}

async function getMyFeedback(req, res) {
  try {
    const ownerField = req.user.role === "driver" ? "driverId" : "customerId";
    const feedback = await Feedback.find({ [ownerField]: req.user.id })
      .populate("customerId", "name")
      .populate("driverId", "name")
      .populate("bookingId", "pickup destination")
      .sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (error) { res.status(500).json({ message: "Could not fetch feedback" }); }
}

async function updateRideLocation(req, res) {
  try {
    const { latitude, longitude, isSharing } = req.body;
    const booking = await Booking.findOne({
      _id: req.params.id,
      driverId: req.user.id,
      status: { $in: ["accepted", "ongoing"] }
    });
    if (!booking) return res.status(404).json({ message: "Active ride not found" });

    if (isSharing === false) {
      booking.driverLocation.isSharing = false;
      await booking.save();
      return res.json({ message: "Location sharing stopped" });
    }

    if (!Number.isFinite(Number(latitude)) || Number(latitude) < -90 || Number(latitude) > 90
      || !Number.isFinite(Number(longitude)) || Number(longitude) < -180 || Number(longitude) > 180) {
      return res.status(400).json({ message: "A valid GPS latitude and longitude are required" });
    }

    booking.driverLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      updatedAt: new Date(),
      isSharing: true
    };
    await booking.save();
    res.json({ message: "Ride location updated", location: booking.driverLocation });
  } catch (error) {
    res.status(500).json({ message: "Could not update ride location" });
  }
}

async function getRideLocation(req, res) {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, customerId: req.user.id }).select("driverLocation");
    if (!booking) return res.status(404).json({ message: "Ride not found" });
    const updatedAt = booking.driverLocation?.updatedAt?.getTime();
    const isFresh = updatedAt && Date.now() - updatedAt <= 60000;
    const location = booking.driverLocation?.isSharing && isFresh ? booking.driverLocation : null;
    res.json({ location });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch ride location" });
  }
}

module.exports = {
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
};
