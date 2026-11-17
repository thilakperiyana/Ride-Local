
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ["admin", "driver", "customer"],
    default: "customer"
  },
  driverStatus: {
    type: String,
    enum: ["not_applicable", "pending", "approved", "rejected"],
    default: "not_applicable"
  },
  licenseNumber: { type: String, default: "", trim: true, uppercase: true },
  address: { type: String, default: "", trim: true, maxlength: 300 },
  hasLicenseDocument: { type: Boolean, default: false },
  licenseDocument: { type: Buffer, select: false },
  licenseDocumentContentType: { type: String, select: false },
  licenseDocumentName: { type: String, select: false }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
