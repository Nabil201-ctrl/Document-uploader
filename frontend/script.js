// DOM Elements
const fileInput = document.getElementById("fileInput");
const browseBtn = document.getElementById("browseBtn");
const uploadArea = document.getElementById("uploadArea");
const fileList = document.getElementById("fileList");
const emptyState = document.getElementById("emptyState");
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notificationMessage");
const progressOverlay = document.getElementById("progressOverlay");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");
const logoutBtn = document.getElementById("logoutBtn");
const imageModal = document.getElementById("imageModal");
const modalImage = document.getElementById("modalImage");
const modalClose = document.querySelector(".modal-close");

// File extensions and their corresponding icons (images only)
const fileIcons = {
  jpg: "fa-file-image",
  jpeg: "fa-file-image",
  png: "fa-file-image",
  gif: "fa-file-image",
};

// State to prevent multiple uploads
let isUploading = false;

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Get file icon based on extension
function getFileIcon(filename) {
  const extension = filename.split(".").pop().toLowerCase();
  return fileIcons[extension] || fileIcons.jpg; // Default to image icon
}

// Show notification
function showNotification(message, type = "success") {
  notificationMessage.textContent = message;
  notification.className = `notification ${type}`;
  notification.querySelector("i").className =
    type === "success" ? "fas fa-check-circle" : "fas fa-exclamation-circle";
  notification.classList.add("show");
  setTimeout(() => {
    notification.classList.remove("show");
  }, 3000);
}

// Show progress overlay
function showProgress(visible) {
  progressOverlay.classList.toggle("visible", visible);
}

// Update progress bar
function updateProgress(percent) {
  progressBar.style.width = `${percent}%`;
  progressText.textContent = `${percent}%`;
}

// Show image modal with Cloudinary transformation
function showImageModal(url) {
  // Add transformation for optimized display
  const optimizedUrl = url.replace("/upload/", "/upload/c_scale,w_800/");
  modalImage.src = optimizedUrl;
  imageModal.classList.add("show");
}

// Close image modal
modalClose.addEventListener("click", () => {
  imageModal.classList.remove("show");
  modalImage.src = ""; // Clear image to free memory
});

// Close modal when clicking outside
imageModal.addEventListener("click", (e) => {
  if (e.target === imageModal) {
    imageModal.classList.remove("show");
    modalImage.src = ""; // Clear image to free memory
  }
});

// Check if user is authenticated
function checkAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
  }
  return token;
}

// Browse button click handler
browseBtn.addEventListener("click", () => {
  if (!isUploading) {
    fileInput.click();
  }
});

// File input change handler
fileInput.addEventListener("change", (e) => {
  if (isUploading) return;
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    if (!file.type.startsWith("image/")) {
      showNotification("Only image files (jpg, jpeg, png, gif) are allowed", "error");
      fileInput.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification("File size exceeds 5MB limit", "error");
      fileInput.value = "";
      return;
    }
    uploadFile(file);
  }
});

// Drag and drop handlers
uploadArea.addEventListener("dragover", (e) => {
  e.preventDefault();
  if (!isUploading) {
    uploadArea.classList.add("dragover");
  }
});

uploadArea.addEventListener("dragleave", () => {
  uploadArea.classList.remove("dragover");
});

uploadArea.addEventListener("drop", (e) => {
  e.preventDefault();
  uploadArea.classList.remove("dragover");
  if (isUploading) return;
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (!file.type.startsWith("image/")) {
      showNotification("Only image files (jpg, jpeg, png, gif) are allowed", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification("File size exceeds 5MB limit", "error");
      return;
    }
    uploadFile(file);
  }
});

// Logout handler
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// Upload file function
async function uploadFile(file) {
  if (isUploading) return;
  isUploading = true;
  const token = checkAuth();
  const formData = new FormData();
  formData.append("file", file);

  showProgress(true);
  updateProgress(0);

  try {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5000/api/upload", true);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        updateProgress(percent);
      }
    };

    xhr.onload = () => {
      showProgress(false);
      isUploading = false;
      if (xhr.status === 200) {
        showNotification("Image uploaded successfully!");
        fetchFiles();
      } else {
        let errorMessage = "Failed to upload image.";
        try {
          const response = JSON.parse(xhr.responseText);
          errorMessage = response.error || errorMessage;
        } catch (e) {
          // Non-JSON response
        }
        showNotification(errorMessage, "error");
      }
    };

    xhr.onerror = () => {
      showProgress(false);
      isUploading = false;
      showNotification("Failed to upload image due to network error.", "error");
    };

    xhr.send(formData);
    fileInput.value = "";
  } catch (error) {
    showProgress(false);
    isUploading = false;
    showNotification("Failed to upload image: " + error.message, "error");
  }
}

// Fetch uploaded files
async function fetchFiles() {
  const token = checkAuth();
  fileList.innerHTML = "<li>Loading...</li>"; // Show loading state
  try {
    const res = await fetch("http://localhost:5000/api/files", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch images");
    }
    const files = await res.json();

    fileList.innerHTML = "";

    if (files.length === 0) {
      emptyState.style.display = "block";
    } else {
      emptyState.style.display = "none";

      files.forEach((file) => {
        const li = document.createElement("li");
        li.className = "file-item";

        const fileIcon = getFileIcon(file.filename);
        const fileDate = file.uploadDate ? formatDate(file.uploadDate) : "Unknown date";
        const fileSize = file.size ? formatFileSize(file.size) : "Unknown size";
        const downloadUrl = file.cloudinaryUrl;

        li.innerHTML = `
          <div class="file-icon">
            <i class="fas ${fileIcon}"></i>
          </div>
          <div class="file-info">
            <div class="file-name">${file.filename}</div>
            <div class="file-details">
              <span class="file-size">${fileSize}</span>
              <span class="file-date">${fileDate}</span>
            </div>
          </div>
          <div class="file-actions">
            <button class="view-btn" title="View" data-url="${downloadUrl}">
              <i class="fas fa-eye"></i>
            </button>
            <a href="${downloadUrl}" class="download-btn" title="Download" download>
              <i class="fas fa-download"></i>
            </a>
            <button class="delete-btn" title="Delete" data-filename="${file.filename}">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        `;

        fileList.appendChild(li);
      });

      // Add view event listeners
      document.querySelectorAll(".view-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const url = e.currentTarget.dataset.url;
          showImageModal(url);
        });
      });

      // Add delete event listeners
      document.querySelectorAll(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
          const filename = e.currentTarget.dataset.filename;
          if (confirm(`Are you sure you want to delete ${filename}?`)) {
            try {
              const res = await fetch(`http://localhost:5000/api/delete/${filename}`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (res.ok) {
                showNotification(`${filename} deleted successfully`);
                fetchFiles();
              } else {
                const error = await res.json();
                throw new Error(error.error || "Delete failed");
              }
            } catch (error) {
              showNotification(`Failed to delete image: ${error.message}`, "error");
              console.error("Delete error:", error);
              if (error.message.includes("Unauthorized")) {
                localStorage.removeItem("token");
                window.location.href = "login.html";
              }
            }
          }
        });
      });
    }
  } catch (error) {
    showNotification(`Failed to fetch images: ${error.message}`, "error");
    console.error("Fetch error:", error);
    fileList.innerHTML = "";
    emptyState.style.display = "block";
    if (error.message.includes("Unauthorized")) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }
}

// Initialize the application
checkAuth();
fetchFiles();