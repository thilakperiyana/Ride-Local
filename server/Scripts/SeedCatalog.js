require("dotenv").config();

const mongoose = require("mongoose");
const Location = require("../Models/Location");
const VehicleCategory = require("../Models/VehicleCategory");
const User = require("../Models/User");
const Vehicle = require("../Models/Vehicle");

const locations = [
  { name: "Kankanady", latitude: 12.8692, longitude: 74.8556 },
  { name: "Statebank", latitude: 12.8628, longitude: 74.8420 },
  { name: "Hampankatta", latitude: 12.8687, longitude: 74.8424 },
  { name: "Kadri", latitude: 12.8833, longitude: 74.8560 },
  { name: "Bejai", latitude: 12.8837, longitude: 74.8479 },
  { name: "Bendoor", latitude: 12.8712, longitude: 74.8546 },
  { name: "Mangaluru Central", latitude: 12.8703, longitude: 74.8419 }
];

const categories = [
  { name: "2 wheeler", description: "Quick and affordable rides for one or two people.", pricePerKm: 12 },
  { name: "Auto Rickshaw", description: "Convenient rides for short city trips.", pricePerKm: 18 },
  { name: "Sedan", description: "Comfortable rides for up to four passengers.", pricePerKm: 22 },
  { name: "SUV", description: "Spacious rides for families and small groups.", pricePerKm: 28 }
];

function exactCaseInsensitive(value) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
}

async function seedLocations() {
  for (const location of locations) {
    await Location.findOneAndUpdate(
      { name: exactCaseInsensitive(location.name) },
      {
        $set: {
          name: location.name,
          city: "Mangaluru",
          state: "Karnataka",
          latitude: location.latitude,
          longitude: location.longitude
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }
}

async function seedCategories() {
  for (const category of categories) {
    await VehicleCategory.findOneAndUpdate(
      { name: exactCaseInsensitive(category.name) },
      { $set: category },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
  }
}

async function seedVehicles(driverId) {
  const vehicles = [
    {
      vehicleNumber: "DEMO-KA19-2W01",
      vehicleName: "Honda Activa 6G",
      category: "2 wheeler",
      serviceLocation: "Kankanady",
      colour: "Grey",
      seats: 2
    },
    {
      vehicleNumber: "DEMO-KA19-AU01",
      vehicleName: "TVS Auto Rickshaw",
      category: "Auto Rickshaw",
      serviceLocation: "Statebank",
      colour: "Yellow",
      seats: 3
    },
    {
      vehicleNumber: "DEMO-KA19-SE01",
      vehicleName: "Maruti Swift Dzire",
      category: "Sedan",
      serviceLocation: "Hampankatta",
      colour: "White",
      seats: 4
    },
    {
      vehicleNumber: "DEMO-KA19-SU01",
      vehicleName: "Hyundai Creta",
      category: "SUV",
      serviceLocation: "Kadri",
      colour: "Silver",
      seats: 5
    }
  ];

  let inserted = 0;
  for (const vehicle of vehicles) {
    const result = await Vehicle.updateOne(
      { vehicleNumber: vehicle.vehicleNumber },
      {
        $setOnInsert: {
          ...vehicle,
          vehicleModel: vehicle.vehicleName,
          driverId,
          isAvailable: true
        }
      },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    if (result.upsertedCount) inserted += 1;
  }
  return inserted;
}

async function seedCatalog() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be set in server/.env");
  await mongoose.connect(process.env.MONGO_URI);

  const driver = await User.findOne({ role: "driver", driverStatus: "approved" })
    .sort({ createdAt: 1 })
    .select("_id name");
  if (!driver) {
    throw new Error("Approve a driver in the Admin app before seeding demo vehicles.");
  }

  await seedLocations();
  await seedCategories();
  const insertedVehicles = await seedVehicles(driver._id);

  const [locationCount, categoryCount, vehicleCount] = await Promise.all([
    Location.countDocuments(),
    VehicleCategory.countDocuments(),
    Vehicle.countDocuments({ driverId: driver._id, vehicleNumber: /^DEMO-KA19-/ })
  ]);

  console.log(`Catalog seed complete for approved driver ${driver.name}.`);
  console.log(`${locations.length} Mangaluru locations and ${categories.length} ride categories are ready.`);
  console.log(`${insertedVehicles} demo vehicles added; ${vehicleCount} demo vehicles are linked to this driver.`);
  console.log(`Database totals: ${locationCount} locations, ${categoryCount} categories.`);
}

seedCatalog()
  .catch((error) => {
    console.error("Catalog seed failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  });
