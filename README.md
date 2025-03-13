# File Upload API - Step-by-Step Explanation

## Introduction
This API allows users to **upload, download, view, and delete files** using Node.js, Express, and MongoDB. It stores file metadata in a database and saves actual files in a folder called `uploads/`.

---

## 1. **Setting Up the Router**
### **Import Required Modules**
```javascript
const express = require("express");
const router = express.Router();
const File = require("../models/File");
const upload = require("../middleware/upload");
const path = require("path");
const fs = require("fs");
```
**Explanation:**
- `express` → Helps create API routes.
- `router` → Manages file-related routes.
- `File` → The MongoDB model for storing file details.
- `upload` → Middleware for handling file uploads.
- `path` → Handles file paths.
- `fs` → Helps read, write, and delete files from the system.

---

## 2. **Uploading a File**
```javascript
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step-by-Step Explanation:**
1. **`router.post("/upload", upload.single("file"))`** → This handles file uploads.
2. **`if (!req.file)`** → Checks if a file was uploaded; if not, it sends an error.
3. **`new File({...})`** → Creates a new entry in MongoDB with:
   - `filename`: Original file name.
   - `filepath`: Location where the file is stored.
   - `size`: File size in bytes.
   - `uploadDate`: Time of upload.
4. **`await newFile.save();`** → Saves file details in MongoDB.
5. **`res.json({ message: "File uploaded successfully" })`** → Sends a success response.

---

## 3. **Getting All Uploaded Files**
```javascript
router.get("/files", async (req, res) => {
  try {
    const files = await File.find();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step-by-Step Explanation:**
1. **`router.get("/files")`** → Handles GET requests to fetch all uploaded files.
2. **`await File.find();`** → Fetches all file records from MongoDB.
3. **`res.json(files);`** → Sends the list of files as a JSON response.

---

## 4. **Downloading a File**
```javascript
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
```

**Step-by-Step Explanation:**
1. **`router.get("/download/:filename")`** → Handles download requests by filename.
2. **`await File.findOne({ filename: req.params.filename })`** → Searches for the file in MongoDB.
3. **If file not found** → Sends a 404 error.
4. **`path.join(__dirname, "../uploads", req.params.filename)`** → Constructs the correct file path.
5. **`res.download(filepath);`** → Sends the file for download.

---

## 5. **Deleting a File**
```javascript
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step-by-Step Explanation:**
1. **`router.delete("/delete/:filename")`** → Handles delete requests.
2. **`await File.findOne({ filename: req.params.filename })`** → Looks for the file in MongoDB.
3. **If file not found** → Sends a 404 error.
4. **`const filePath = path.join(__dirname, "../uploads", file.filename);`** → Constructs file path.
5. **`if (fs.existsSync(filePath)) { fs.unlinkSync(filePath); }`** → Deletes file from system.
6. **`await File.deleteOne({ filename: req.params.filename })`** → Removes file record from MongoDB.
7. **`res.json({ message: "File deleted successfully" })`** → Sends success response.

---

## **Conclusion**
This API provides the following functionalities:
✅ Upload a file (**POST /upload**)
✅ Get all uploaded files (**GET /files**)
✅ Download a file (**GET /download/:filename**)
✅ Delete a file (**DELETE /delete/:filename**)

### **Folder Structure**
```
project-folder/
│── models/
│   ├── File.js  # Mongoose model for files
│── middleware/
│   ├── upload.js  # File upload middleware
│── routes/
│   ├── fileRoutes.js  # This API file
│── uploads/  # Folder where uploaded files are stored
│── server.js  # Main server file
```