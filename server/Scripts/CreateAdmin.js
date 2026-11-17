const readline = require("readline");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const connectDB = require("../Config/Db");
const User = require("../Models/User");

dotenv.config();
const input = readline.createInterface({ input: process.stdin, output: process.stdout });
function ask(question) { return new Promise((resolve) => input.question(question, resolve)); }

async function main() {
  try {
    await connectDB();
    const name = (await ask("Admin name: ")).trim();
    const email = (await ask("Admin email: ")).trim().toLowerCase();
    const phone = (await ask("Admin phone: ")).trim();
    const password = await ask("Admin password (minimum 8 characters): ");
    if (!name || !email || !phone || password.length < 8) throw new Error("Enter all fields and use a password of at least 8 characters.");
    if (await User.exists({ email })) throw new Error("An account already uses that email.");
    await User.create({ name, email, phone, password: await bcrypt.hash(password, 12), role: "admin" });
    console.log("Administrator account created. Sign in from the admin app.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    input.close();
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  }
}

main();
