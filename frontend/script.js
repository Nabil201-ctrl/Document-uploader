    // DOM Elements
    const uploadForm = document.getElementById('uploadForm');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const uploadArea = document.getElementById('uploadArea');
    const fileList = document.getElementById('fileList');
    const emptyState = document.getElementById('emptyState');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notificationMessage');
    const progressOverlay = document.getElementById('progressOverlay');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    // File extensions and their corresponding icons
    const fileIcons = {
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'xls': 'fa-file-excel',
      'xlsx': 'fa-file-excel',
      'txt': 'fa-file-alt',
      'jpg': 'fa-file-image',
      'jpeg': 'fa-file-image',
      'png': 'fa-file-image',
      'zip': 'fa-file-archive',
      'default': 'fa-file'
    };
    
    // Format date
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Format file size
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Get file icon based on extension
    function getFileIcon(filename) {
      const extension = filename.split('.').pop().toLowerCase();
      return fileIcons[extension] || fileIcons.default;
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
      notificationMessage.textContent = message;
      notification.className = `notification ${type}`;
      
      if (type === 'success') {
        notification.querySelector('i').className = 'fas fa-check-circle';
      } else {
        notification.querySelector('i').className = 'fas fa-exclamation-circle';
      }
      
      notification.classList.add('show');
      
      setTimeout(() => {
        notification.classList.remove('show');
      }, 3000);
    }
    
    // Show progress overlay
    function showProgress(visible) {
      if (visible) {
        progressOverlay.classList.add('visible');
      } else {
        progressOverlay.classList.remove('visible');
      }
    }
    
    // Update progress bar
    function updateProgress(percent) {
      progressBar.style.width = `${percent}%`;
      progressText.textContent = `${percent}%`;
    }
    
    // Browse button click handler
    browseBtn.addEventListener('click', () => {
      fileInput.click();
    });
    
    // File input change handler
    fileInput.addEventListener('change', (e) => {
      if (fileInput.files.length > 0) {
        uploadFile(fileInput.files[0]);
      }
    });
    
    // Drag and drop handlers
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      
      if (e.dataTransfer.files.length > 0) {
        uploadFile(e.dataTransfer.files[0]);
      }
    });
    
    // Upload file function
    async function uploadFile(file) {
      const formData = new FormData();
      formData.append('file', file);
      
      showProgress(true);
      updateProgress(0);
      
      try {
        // Simulate progress (in a real app this would use XHR or fetch with progress events)
        const progressInterval = setInterval(() => {
          const currentWidth = parseInt(progressBar.style.width || '0');
          if (currentWidth < 90) {
            updateProgress(currentWidth + 10);
          } else {
            clearInterval(progressInterval);
          }
        }, 300);
        
        const res = await fetch('http://localhost:5000/upload', {
          method: 'POST',
          body: formData,
        });
        
        clearInterval(progressInterval);
        
        if (res.ok) {
          updateProgress(100);
          setTimeout(() => {
            showProgress(false);
            showNotification('File uploaded successfully!');
            fetchFiles();
          }, 500);
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        showProgress(false);
        showNotification('Failed to upload file. Please try again.', 'error');
        console.error('Upload error:', error);
      }
      
      // Reset file input
      fileInput.value = '';
    }
    
    // Fetch uploaded files
    async function fetchFiles() {
      try {
        const res = await fetch('http://localhost:5000/files');
        const files = await res.json();
        
        fileList.innerHTML = '';
        
        if (files.length === 0) {
          emptyState.style.display = 'block';
        } else {
          emptyState.style.display = 'none';
          
          files.forEach((file) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            
            const fileIcon = getFileIcon(file.filename);
            const fileDate = file.uploadDate ? formatDate(file.uploadDate) : 'Unknown date';
            const fileSize = file.size ? formatFileSize(file.size) : 'Unknown size';
            
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
                <a href="http://localhost:5000/download/${file.filename}" class="download-btn" title="Download">
                  <i class="fas fa-download"></i>
                </a>
                <button class="delete-btn" title="Delete" data-filename="${file.filename}">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            `;
            
            fileList.appendChild(li);
          });
          
          // Add delete event listeners
          document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const filename = e.currentTarget.dataset.filename;
              if (confirm(`Are you sure you want to delete ${filename}?`)) {
                try {
                  const res = await fetch(`http://localhost:5000/delete/${filename}`, {
                    method: 'DELETE'
                  });
                  
                  if (res.ok) {
                    showNotification(`${filename} deleted successfully`);
                    fetchFiles();
                  } else {
                    throw new Error('Delete failed');
                  }
                } catch (error) {
                  showNotification('Failed to delete file', 'error');
                  console.error('Delete error:', error);
                }
              }
            });
          });
        }
      } catch (error) {
        showNotification('Failed to fetch files', 'error');
        console.error('Fetch error:', error);
        emptyState.style.display = 'block';
      }
    }
    
    // Initialize the application
    fetchFiles();