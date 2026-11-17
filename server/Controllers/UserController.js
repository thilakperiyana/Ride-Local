
const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function registerUser(req, res) {
  try {
    const { name, email, phone, password, role, licenseNumber } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: "Name, email, phone and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters"
      });
    }

    // Public registration cannot create admin accounts.
    const selectedRole = role || "customer";

    if (!["customer", "driver"].includes(selectedRole)) {
      return res.status(400).json({
        message: "Invalid registration role"
      });
    }

    if (selectedRole === "driver" && !licenseNumber) {
      return res.status(400).json({
        message: "Driver license number is required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    const user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      password: await bcrypt.hash(password, 12),
      role: selectedRole,
      driverStatus: selectedRole === "driver"
        ? "pending"
        : "not_applicable",
      licenseNumber: selectedRole === "driver"
        ? licenseNumber.trim()
        : ""
    });

    res.status(201).json({
      message: selectedRole === "driver"
        ? "Registration successful. Await admin approval."
        : "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        driverStatus: user.driverStatus
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already registered"
      });
    }

    res.status(500).json({ message: "Registration failed" });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase()
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { id: user._id.toString() },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        driverStatus: user.driverStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "Account not found" });
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driverStatus: user.driverStatus
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch account details" });
  }
}

module.exports = { registerUser, loginUser, getCurrentUser };
