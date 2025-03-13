const express = require("express");
const router = express.Router();
const File = require("../models/File");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");

// Upload file
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const newFile = new File({
      filename: req.file.originalname,
      filepath: req.file.path,
      size: req.file.size,
      uploadDate: new Date(),
    });

    await newFile.save();
    res.json({ message: "File uploaded successfully" });
    console.log('File uploaded successfully')
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all uploaded files
router.get("/files", async (req, res) => {
  try {
    const files = await File.find();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Download a file
router.get("/download/:filename", async (req, res) => {
  try {
    const file = await File.findOne({ filename: req.params.filename });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    const filepath = path.join(__dirname, "../uploads", req.params.filename);
    res.download(filepath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Delete a file
router.delete("/delete/:filename", async (req, res) => {
  try {
    const file = await File.findOne({ filename: req.params.filename });
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const filePath = path.join(__dirname, "../uploads", file.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await File.deleteOne({ filename: req.params.filename });
    res.json({ message: "File deleted successfully" });
    console.log('File deleted successfully')
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
