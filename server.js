const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");

// Middleware
app.use(cors());
app.use(express.json());

// 🔹 MongoDB Connect
mongoose.connect("mongodb://127.0.0.1:27017/nearbyApp")
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("MongoDB Error ❌", err));

// 🔹 Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

// 🔹 Test route
app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

// 🔹 Signup API
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.json({
        success: false,
        message: "All fields are required ❌"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({
        success: false,
        message: "User already exists ❌"
      });
    }

    const newUser = new User({ name, email, password });
    await newUser.save();

    console.log("User saved:", newUser.email);

    res.json({
      success: true,
      message: "Account created successfully ✅"
    });

  } catch (error) {
    console.log("Signup Error:", error);
    res.json({
      success: false,
      message: "Signup failed ❌"
    });
  }
});

// 🔹 Login API
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "All fields are required ❌"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User not found ❌"
      });
    }

    if (user.password !== password) {
      return res.json({
        success: false,
        message: "Wrong password ❌"
      });
    }

    console.log("Login success:", user.email);

    // ✅ IMPORTANT: clean response
    res.json({
      success: true,
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.log("Login Error:", error);
    res.json({
      success: false,
      message: "Login failed ❌"
    });
  }
});

// 🔹 Start server
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});                 