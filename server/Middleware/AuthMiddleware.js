
const jwt = require("jsonwebtoken");
const User = require("../Models/User");

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Please log in" });
    }

    const decoded = jwt.verify(
      header.split(" ")[1],
      process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({ message: "Account not found" });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
      driverStatus: user.driverStatus
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (
      req.user.role === "driver" &&
      req.user.driverStatus !== "approved"
    ) {
      return res.status(403).json({
        message: "Your driver account is awaiting admin approval"
      });
    }

    next();
  };
}

module.exports = { protect, authorize };
