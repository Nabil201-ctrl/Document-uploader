const express = require("express");
const router = express.Router();
const File = require("../models/File");
const User = require("../models/User");
const { cloudinaryUpload } = require("../middleware/upload"); // Updated import
const auth = require("../middleware/auth");
const cloudinary = require("../config/cloudinary");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token, message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload file (protected, images only, direct to Cloudinary)
router.post("/upload", auth, cloudinaryUpload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "uploads",
          allowed_formats: ["jpg", "jpeg", "png", "gif"],
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(req.file.buffer);
    });

    const fileData = {
      filename: req.file.originalname,
      cloudinaryUrl: result.secure_url,
      size: req.file.size,
      userId: req.user.userId,
      uploadDate: new Date(),
    };

    const newFile = new File(fileData);
    await newFile.save();
    res.json({ message: "Image uploaded successfully", file: fileData });
  } catch (err) {
    if (err.message.includes("Only image files")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// Get all uploaded files for user (protected)
router.get("/files", auth, async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.userId });
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download a file (protected)
router.get("/download/:filename", auth, async (req, res) => {
  try {
    const file = await File.findOne({
      filename: req.params.filename,
      userId: req.user.userId,
    });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Redirect to Cloudinary URL
    res.redirect(file.cloudinaryUrl);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a file (protected)
router.delete("/delete/:filename", auth, async (req, res) => {
  try {
    const file = await File.findOne({
      filename: req.params.filename,
      userId: req.user.userId,
    });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete from Cloudinary
    const publicId = `uploads/${file.filename.split(".")[0]}`;
    await cloudinary.uploader.destroy(publicId);

    await File.deleteOne({ filename: req.params.filename });
    res.json({ message: "File deleted successfully" });
    console.log("File deleted successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;