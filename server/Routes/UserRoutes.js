
const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getCurrentUser
} = require("../Controllers/UserController");
const { protect } = require("../Middleware/AuthMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getCurrentUser);

module.exports = router;
