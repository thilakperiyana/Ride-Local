const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const connectDB = require("../Config/Db");
const User = require("../Models/User");

dotenv.config();

function promptPassword() {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== "function") {
    return Promise.reject(new Error("Set ADMIN_PASSWORD in the environment when running without an interactive terminal."));
  }

  return new Promise((resolve, reject) => {
    let password = "";
    const cleanup = () => {
      process.stdin.removeListener("data", onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdout.write("\n");
    };
    const onData = (input) => {
      for (const character of input.toString()) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Password prompt cancelled."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(password);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          password = password.slice(0, -1);
        } else if (character >= " ") {
          password += character;
        }
      }
    };

    process.stdout.write("Admin password (minimum 8 characters): ");
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on("data", onData);
  });
}

async function main() {
  try {
    const email = (process.env.ADMIN_EMAIL || "admin@gmail.com").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || await promptPassword();
    if (password.length < 8) throw new Error("Admin password must be at least 8 characters.");

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.role !== "admin") throw new Error(`The email ${email} is already registered as a non-admin account.`);
      console.log(`Admin account ${email} already exists. Its password was not changed.`);
      return;
    }

    const user = await User.create({
      name: process.env.ADMIN_NAME || "Ride Local Admin",
      email,
      phone: process.env.ADMIN_PHONE || "0000000000",
      password: await bcrypt.hash(password, 12),
      role: "admin"
    });
    console.log(`Seed admin account created: ${user.email}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    const mongoose = require("mongoose");
    if (mongoose.connection.readyState) await mongoose.disconnect();
  }
}

main();
