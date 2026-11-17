const express = require("express");
const multer = require("multer");
const {
  registerDriver,
  getDriverProfile,
  getDriverDirectory,
  getDriverLicenseDocument,
  LICENSE_MAX_BYTES
} = require("../Controllers/DriverController");
const { protect, authorize } = require("../Middleware/AuthMiddleware");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: LICENSE_MAX_BYTES, files: 1, fields: 20, fieldSize: 16 * 1024, parts: 21 }
});

router.post("/register", (req, res, next) => {
  upload.single("licenseDocument")(req, res, (error) => {
    if (error) {
      if (error.code === "LIMIT_FILE_SIZE") return res.status(400).json({ message: "Licence document must be 5 MB or smaller" });
      if (error.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ message: "Upload one licence document" });
      if (["LIMIT_FIELD_COUNT", "LIMIT_FIELD_VALUE", "LIMIT_PART_COUNT"].includes(error.code)) {
        return res.status(400).json({ message: "Driver application contains too many or oversized fields" });
      }
      return next(error);
    }
    next();
  });
}, registerDriver);
router.get("/me", protect, getDriverProfile);
router.get("/directory", protect, authorize("driver"), getDriverDirectory);
router.get("/:id/license", protect, authorize("admin"), getDriverLicenseDocument);

module.exports = router;
