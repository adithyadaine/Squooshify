// app.js
const fileInput = document.getElementById('fileInput');
const preview = document.getElementById('preview');
const generateBtn = document.getElementById('generateBtn');
const generateContainer = document.getElementById('generateContainer');
const downloads = document.getElementById('downloads');
const clearBtn = document.getElementById('clearBtn');
const clearBtnContainer = document.getElementById('clearBtnContainer');
const statusMessage = document.getElementById('statusMessage');
const dropZone = document.getElementById('dropZoneContainer'); // Updated selector

let originalImage = null;
let generatedObjectUrls = []; // To keep track of generated URLs for revocation

// Icon sizes to generate
const ICON_SIZES = [
  { size: 16, name: 'icon16.png' },
  { size: 48, name: 'icon48.png' },
  { size: 128, name: 'icon128.png' },
];

// Helper to display messages
function displayStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.display = 'block';
  
  // Reset classes first
  statusMessage.className = 'status-message';
  // Add appropriate class
  statusMessage.classList.add(isError ? 'error' : 'success');
  
  // Hide message after a few seconds
  setTimeout(() => {
    statusMessage.style.display = 'none';
    statusMessage.textContent = '';
    statusMessage.className = 'status-message'; // Reset
  }, 5000);
}

// Clear all generated object URLs
function revokeAllObjectUrls() {
  generatedObjectUrls.forEach((url) => URL.revokeObjectURL(url));
  generatedObjectUrls = [];
}

// Handle file processing (called by both file input and drag/drop)
function processFile(file) {
  revokeAllObjectUrls(); // Clear previous URLs
  downloads.innerHTML = ''; // Clear previous downloads
  statusMessage.style.display = 'none'; // Hide any old status messages

  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = function (e) {
      preview.src = e.target.result;
      preview.style.display = 'block';
      generateContainer.style.display = 'block';
      clearBtnContainer.style.display = 'block';
      originalImage = new Image();
      originalImage.onload = () => {
        // Ensure image is loaded before attempting to draw it
        displayStatus('Image loaded successfully! Click "Generate Icons".');
      };
      originalImage.onerror = () => {
        displayStatus('Error loading image. Please try another file.', true);
        clearAll(); // Clear UI on error
      };
      originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    displayStatus('Please upload a valid image file (PNG, JPG, JPEG).', true);
    clearAll(); // Clear UI if file is invalid
  }
}

// Show preview and enable generate button
fileInput.addEventListener('change', function () {
  if (fileInput.files && fileInput.files[0]) {
    processFile(fileInput.files[0]);
  } else {
    clearAll(); // No file selected, clear UI
  }
});

// Generate resized icons and download links
generateBtn.addEventListener('click', function () {
  if (!originalImage || !originalImage.complete) {
    displayStatus('Please wait for the image to load, or upload an image.', true);
    return;
  }

  downloads.innerHTML = '';
  revokeAllObjectUrls(); // Clear any existing URLs before generating new ones
  displayStatus('Generating icons...');

  let iconsGeneratedCount = 0;
  const totalIcons = ICON_SIZES.length;

  ICON_SIZES.forEach(({ size, name }) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Draw image centered and contained
    const minDim = Math.min(originalImage.width, originalImage.height);
    const sx = (originalImage.width - minDim) / 2;
    const sy = (originalImage.height - minDim) / 2;

    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(originalImage, sx, sy, minDim, minDim, 0, 0, size, size);

    canvas.toBlob(
      function (blob) {
        if (blob) {
          const url = URL.createObjectURL(blob);
          generatedObjectUrls.push(url); // Store URL for later revocation
          const a = document.createElement('a');
          a.href = url;
          a.download = name;
          a.textContent = `Download ${name} (${size}x${size})`;
          a.className = 'btn-success download-btn'; // Updated class
          downloads.appendChild(a);

          // Increment count and check if all icons are generated
          iconsGeneratedCount++;
          if (iconsGeneratedCount === totalIcons) {
            displayStatus('Icons generated successfully! Download them below.');
          }
        } else {
          displayStatus(`Failed to generate ${name}.`, true);
        }
      },
      'image/png',
      1 // Quality for PNG (1.0 is default, but explicit for clarity)
    );
  });
});

// Clear everything
function clearAll() {
  fileInput.value = '';
  preview.src = '';
  preview.style.display = 'none';
  generateContainer.style.display = 'none';
  downloads.innerHTML = '';
  clearBtnContainer.style.display = 'none';
  statusMessage.style.display = 'none'; // Hide status message
  statusMessage.textContent = '';
  originalImage = null;
  revokeAllObjectUrls(); // Clear all object URLs when clearing
}

clearBtn.addEventListener('click', clearAll);

// --- Drag and Drop functionality ---

// Prevent default drag behaviors
['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
  dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// Add/remove highlight class on drag events
dropZone.addEventListener('dragenter', () => dropZone.classList.add('drag-over'), false);
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'), false);
dropZone.addEventListener('drop', () => dropZone.classList.remove('drag-over'), false);

// Handle dropped files
dropZone.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;

  if (files.length > 0) {
    // Only process the first file if multiple are dropped
    processFile(files[0]);

    // Update file input with dropped file
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(files[0]);
    fileInput.files = dataTransfer.files;
  } else {
    displayStatus('No files were dropped or an error occurred.', true);
  }
});

// --- Modal Logic ---

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// Open Modals
document.getElementById('aboutLink').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('aboutModal');
});

document.getElementById('privacyLink').addEventListener('click', (e) => {
    e.preventDefault();
    openModal('privacyModal');
});

// Close Modals (x button)
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.addEventListener('click', () => {
        closeModal(btn.getAttribute('data-modal'));
    });
});

// Close Modals (outside click)
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// Update Copyright Year automatically
const currentYearSpan = document.getElementById('currentYear');
if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
}