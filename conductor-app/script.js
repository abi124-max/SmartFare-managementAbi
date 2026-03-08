// Smart Fare Conductor Application JavaScript

// Firebase Configuration
const firebaseConfig = {
    apiKey: "your-api-key",
    authDomain: "your-project-id.firebaseapp.com",
    databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global Variables
let autoRefresh = true;
let currentStream = null;
let codeReader = null;
let scannedTicketData = null;
let scanHistory = [];
let scanSettings = {
    speed: 'normal',
    soundEnabled: true,
    vibrationEnabled: true,
    autoValidate: false
};
let analytics = {
    todayRevenue: 0,
    ticketsScanned: 0,
    manualTickets: 0,
    validationRate: 0
};

// Fare calculation matrix
const fareMatrix = {
    'Koyambedu': {
        'Tambaram': { 'ac_deluxe': 45, 'ordinary': 35, 'ac_express': 40, 'volvo_ac': 50 },
        'Velachery': { 'ac_deluxe': 35, 'ordinary': 25, 'ac_express': 30, 'volvo_ac': 40 },
        'Broadway': { 'ac_deluxe': 25, 'ordinary': 20, 'ac_express': 22, 'volvo_ac': 28 }
    },
    'Tambaram': {
        'Koyambedu': { 'ac_deluxe': 45, 'ordinary': 35, 'ac_express': 40, 'volvo_ac': 50 },
        'Velachery': { 'ac_deluxe': 28, 'ordinary': 25, 'ac_express': 25, 'volvo_ac': 30 },
        'Broadway': { 'ac_deluxe': 40, 'ordinary': 38, 'ac_express': 38, 'volvo_ac': 45 }
    },
    'Velachery': {
        'Koyambedu': { 'ac_deluxe': 35, 'ordinary': 25, 'ac_express': 30, 'volvo_ac': 40 },
        'Tambaram': { 'ac_deluxe': 28, 'ordinary': 25, 'ac_express': 25, 'volvo_ac': 30 },
        'Broadway': { 'ac_deluxe': 32, 'ordinary': 28, 'ac_express': 30, 'volvo_ac': 35 }
    },
    'Broadway': {
        'Koyambedu': { 'ac_deluxe': 25, 'ordinary': 20, 'ac_express': 22, 'volvo_ac': 28 },
        'Tambaram': { 'ac_deluxe': 40, 'ordinary': 38, 'ac_express': 38, 'volvo_ac': 45 },
        'Velachery': { 'ac_deluxe': 32, 'ordinary': 28, 'ac_express': 30, 'volvo_ac': 35 }
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startRealtimeUpdates();
});

function initializeApp() {
    console.log('Initializing Smart Fare Conductor App...');
    showLoading(true);
    
    // Initialize ZXing QR Code Reader
    codeReader = new ZXing.BrowserQRCodeReader();
    
    // Set initial fare
    updateFare();
    
    // Load initial data
    loadDashboardData();
    
    showLoading(false);
    showNotification('Conductor app initialized successfully', 'success');
}

function setupEventListeners() {
    // Dashboard controls
    document.getElementById('refreshBtn').addEventListener('click', loadDashboardData);
    document.getElementById('autoRefreshBtn').addEventListener('click', toggleAutoRefresh);
    
    // QR Scanner controls
    document.getElementById('startScanBtn').addEventListener('click', startQRScanner);
    document.getElementById('stopScanBtn').addEventListener('click', stopQRScanner);
    document.getElementById('switchCameraBtn').addEventListener('click', switchCamera);
    document.getElementById('validateTicketBtn').addEventListener('click', validateScannedTicket);
    document.getElementById('clearScanBtn').addEventListener('click', clearScanResult);
    document.getElementById('uploadQRBtn').addEventListener('click', () => {
        document.getElementById('qrFileInput').click();
    });
    document.getElementById('qrFileInput').addEventListener('change', handleQRFileUpload);
    document.getElementById('saveTicketBtn').addEventListener('click', saveTicketToHistory);
    
    // Ticket form
    document.getElementById('ticketForm').addEventListener('submit', handleTicketSubmission);
    document.getElementById('sourceStop').addEventListener('change', updateFare);
    document.getElementById('destStop').addEventListener('change', updateFare);
    document.getElementById('busType').addEventListener('change', updateFare);
    
    // Advanced features
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    document.getElementById('exportHistoryBtn').addEventListener('click', exportHistory);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('offlineBtn').addEventListener('click', toggleOfflineMode);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    
    // Settings
    document.getElementById('scanSpeed').addEventListener('change', updateScanSpeed);
    document.getElementById('soundEnabled').addEventListener('change', updateSoundSetting);
    document.getElementById('vibrationEnabled').addEventListener('change', updateVibrationSetting);
    document.getElementById('autoValidate').addEventListener('change', updateAutoValidateSetting);
    
    // Notification close
    document.getElementById('closeNotification').addEventListener('click', hideNotification);
    
    // Load saved settings
    loadSavedSettings();
    loadScanHistory();
    updateAnalytics();
    updateBatteryStatus();
}

// Firebase Real-time Updates
function startRealtimeUpdates() {
    const stopsRef = database.ref('bus_stops');
    
    stopsRef.on('value', (snapshot) => {
        if (autoRefresh) {
            const data = snapshot.val();
            updateDashboard(data);
            updateValidationSummary(data);
        }
    }, (error) => {
        console.error('Firebase real-time error:', error);
        showNotification('Error connecting to Firebase', 'error');
    });
}

function loadDashboardData() {
    showLoading(true);
    
    database.ref('bus_stops').once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            updateDashboard(data);
            updateValidationSummary(data);
            showLoading(false);
        })
        .catch((error) => {
            console.error('Error loading dashboard data:', error);
            showNotification('Error loading dashboard data', 'error');
            showLoading(false);
        });
}

function updateDashboard(data) {
    const dashboardBody = document.getElementById('dashboardBody');
    dashboardBody.innerHTML = '';
    
    if (!data) {
        dashboardBody.innerHTML = '<tr><td colspan="5" class="text-center">No data available</td></tr>';
        return;
    }
    
    Object.keys(data).forEach(stopKey => {
        const stop = data[stopKey];
        const row = createDashboardRow(stopKey, stop);
        dashboardBody.appendChild(row);
    });
}

function createDashboardRow(stopKey, stop) {
    const row = document.createElement('tr');
    
    const statusClass = stop.checked_status === 'checked' ? 'status-checked' : 'status-unchecked';
    
    row.innerHTML = `
        <td><strong>${stop.stopping_name || stopKey}</strong></td>
        <td>${stop.headcount || 0}</td>
        <td>${stop.ticket_distribution || 0}</td>
        <td class="${statusClass}">${stop.checked_status || 'unchecked'}</td>
        <td>
            <button class="btn btn-sm btn-primary" onclick="viewStopDetails('${stopKey}')">
                View Details
            </button>
        </td>
    `;
    
    return row;
}

function updateValidationSummary(data) {
    if (!data) {
        resetValidationStats();
        return;
    }
    
    const stops = Object.keys(data);
    const totalStops = stops.length;
    let checkedStops = 0;
    let uncheckedStops = 0;
    let totalHeadcount = 0;
    let totalTickets = 0;
    let discrepancy = 0;
    
    stops.forEach(stopKey => {
        const stop = data[stopKey];
        const headcount = stop.headcount || 0;
        const ticketDist = stop.ticket_distribution || 0;
        
        totalHeadcount += headcount;
        totalTickets += ticketDist;
        discrepancy += Math.abs(headcount - ticketDist);
        
        if (stop.checked_status === 'checked') {
            checkedStops++;
        } else {
            uncheckedStops++;
        }
    });
    
    document.getElementById('totalStops').textContent = totalStops;
    document.getElementById('checkedStops').textContent = checkedStops;
    document.getElementById('uncheckedStops').textContent = uncheckedStops;
    document.getElementById('totalHeadcount').textContent = totalHeadcount;
    document.getElementById('totalTickets').textContent = totalTickets;
    document.getElementById('discrepancy').textContent = discrepancy;
}

function resetValidationStats() {
    document.getElementById('totalStops').textContent = '0';
    document.getElementById('checkedStops').textContent = '0';
    document.getElementById('uncheckedStops').textContent = '0';
    document.getElementById('totalHeadcount').textContent = '0';
    document.getElementById('totalTickets').textContent = '0';
    document.getElementById('discrepancy').textContent = '0';
}

// QR Scanner Functions
async function startQRScanner() {
    try {
        updateScanStatus('scanning', 'Initializing camera...');
        
        const videoElement = document.getElementById('videoElement');
        
        // Request camera permission with better constraints
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 },
                focusMode: 'continuous'
            }
        };
        
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
        
        // Wait for video to be ready
        videoElement.onloadedmetadata = () => {
            videoElement.play();
            updateScanStatus('scanning', 'Scanning for QR codes...');
            
            // Start QR code scanning with enhanced settings
            const scanInterval = getScanInterval();
            
            codeReader.decodeFromVideoDevice(undefined, videoElement, (result, err) => {
                if (result) {
                    handleQRCodeResult(result.text);
                }
            });
        };
        
        // Update UI
        document.getElementById('startScanBtn').disabled = true;
        document.getElementById('stopScanBtn').disabled = false;
        
        playSound('start');
        vibrateDevice(100);
        showNotification('QR Scanner started successfully', 'success');
        
    } catch (error) {
        console.error('Error starting QR scanner:', error);
        updateScanStatus('error', 'Camera access denied');
        showNotification('Failed to start camera. Please check permissions.', 'error');
    }
}

function getScanInterval() {
    const speedMap = {
        'fast': 100,
        'normal': 300,
        'slow': 500
    };
    return speedMap[scanSettings.speed] || 300;
}

function updateScanStatus(status, message) {
    const statusElement = document.getElementById('scanStatus');
    statusElement.className = status;
    statusElement.textContent = message;
}

function stopQRScanner() {
    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
        
        if (codeReader) {
            codeReader.reset();
        }
        
        const videoElement = document.getElementById('videoElement');
        videoElement.srcObject = null;
        
        updateScanStatus('success', 'Scanner stopped');
        
        // Update UI
        document.getElementById('startScanBtn').disabled = false;
        document.getElementById('stopScanBtn').disabled = true;
        
        playSound('stop');
        showNotification('QR Scanner stopped', 'info');
        
    } catch (error) {
        console.error('Error stopping QR scanner:', error);
    }
}

async function switchCamera() {
    try {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }
        
        const videoElement = document.getElementById('videoElement');
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (videoDevices.length > 1) {
            // Switch between front and back camera
            const currentFacingMode = videoElement.srcObject?.getVideoTracks()[0]?.getSettings().facingMode;
            const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
            
            currentStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: newFacingMode }
            });
            
            videoElement.srcObject = currentStream;
            showNotification(`Switched to ${newFacingMode === 'user' ? 'front' : 'back'} camera`, 'info');
        } else {
            showNotification('Only one camera available', 'warning');
        }
        
    } catch (error) {
        console.error('Error switching camera:', error);
        showNotification('Failed to switch camera', 'error');
    }
}

function handleQRFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    context.drawImage(img, 0, 0);
                    
                    // Use ZXing to decode QR from image
                    codeReader.decodeFromCanvas(canvas, (result, err) => {
                        if (result) {
                            handleQRCodeResult(result.text);
                        } else {
                            showNotification('No QR code found in image', 'error');
                        }
                    });
                } catch (error) {
                    showNotification('Failed to process image', 'error');
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function handleQRCodeResult(text) {
    try {
        scannedTicketData = JSON.parse(text);
        displayScanResult(scannedTicketData);
        updateScanStatus('success', 'QR code detected!');
        
        playSound('success');
        vibrateDevice([100, 50, 100]);
        
        // Auto-validate if enabled
        if (scanSettings.autoValidate) {
            setTimeout(() => validateScannedTicket(), 1000);
        }
        
        // Add to analytics
        analytics.ticketsScanned++;
        updateAnalytics();
        
        // Stop scanning after successful scan
        stopQRScanner();
        
    } catch (error) {
        console.error('Error parsing QR code:', error);
        updateScanStatus('error', 'Invalid QR code format');
        showNotification('Invalid QR code format', 'error');
    }
}

function displayScanResult(ticketData) {
    const scanResult = document.getElementById('scanResult');
    const ticketInfo = document.getElementById('ticketInfo');
    const qrPreview = document.getElementById('qrPreview');
    
    ticketInfo.innerHTML = `
        <div class="ticket-details">
            <h4>🎫 Ticket Information</h4>
            <p><strong>Booking ID:</strong> ${ticketData.bookingId || 'N/A'}</p>
            <p><strong>Passenger:</strong> ${ticketData.passenger || 'N/A'}</p>
            <p><strong>Source:</strong> ${ticketData.source || 'N/A'}</p>
            <p><strong>Destination:</strong> ${ticketData.destination || 'N/A'}</p>
            <p><strong>Bus Number:</strong> ${ticketData.busNumber || 'N/A'}</p>
            <p><strong>Fare:</strong> ₹${ticketData.fare || '0'}</p>
            <p><strong>Date:</strong> ${ticketData.date || 'N/A'}</p>
            <p><strong>Time:</strong> ${ticketData.time || 'N/A'}</p>
        </div>
    `;
    
    // Create QR preview
    if (ticketData.qrCode) {
        qrPreview.innerHTML = `<img src="${ticketData.qrCode}" alt="Ticket QR Code" />`;
    } else {
        qrPreview.innerHTML = '<p>No QR image available</p>';
    }
    
    scanResult.classList.remove('hidden');
}

function clearScanResult() {
    document.getElementById('scanResult').classList.add('hidden');
    scannedTicketData = null;
    updateScanStatus('success', 'Ready to scan');
}

function saveTicketToHistory() {
    if (scannedTicketData) {
        const historyItem = {
            ...scannedTicketData,
            scanTime: new Date().toISOString(),
            scanType: 'QR Scan'
        };
        
        scanHistory.unshift(historyItem);
        if (scanHistory.length > 50) {
            scanHistory = scanHistory.slice(0, 50); // Keep only last 50 items
        }
        
        localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
        displayScanHistory();
        showNotification('Ticket saved to history', 'success');
    }
}

function displayScanHistory() {
    const historyList = document.getElementById('scanHistory');
    historyList.innerHTML = '';
    
    scanHistory.slice(0, 10).forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-content">
                <strong>${item.bookingId || 'Manual'}</strong>
                <span class="route">${item.source || 'N/A'} → ${item.destination || 'N/A'}</span>
                <span class="fare">₹${item.fare || '0'}</span>
            </div>
            <div class="time">${new Date(item.scanTime).toLocaleTimeString()}</div>
        `;
        historyItem.addEventListener('click', () => showTicketDetails(item));
        historyList.appendChild(historyItem);
    });
    
    if (scanHistory.length === 0) {
        historyList.innerHTML = '<p class="text-center">No scan history available</p>';
    }
}

function showTicketDetails(ticket) {
    const modal = document.getElementById('ticketModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="ticket-details-full">
            <h4>🎫 Complete Ticket Details</h4>
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Booking ID:</label>
                    <span>${ticket.bookingId || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <label>Passenger:</label>
                    <span>${ticket.passenger || ticket.passengerName || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <label>Route:</label>
                    <span>${ticket.source || 'N/A'} → ${ticket.destination || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <label>Bus Number:</label>
                    <span>${ticket.busNumber || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <label>Fare:</label>
                    <span>₹${ticket.fare || '0'}</span>
                </div>
                <div class="detail-item">
                    <label>Date:</label>
                    <span>${ticket.date || new Date(ticket.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="detail-item">
                    <label>Time:</label>
                    <span>${ticket.time || new Date(ticket.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="detail-item">
                    <label>Scan Type:</label>
                    <span>${ticket.scanType || 'N/A'}</span>
                </div>
            </div>
            ${ticket.qrCode ? `<div class="qr-display"><img src="${ticket.qrCode}" alt="QR Code" /></div>` : ''}
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('ticketModal').classList.add('hidden');
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all scan history?')) {
        scanHistory = [];
        localStorage.removeItem('scanHistory');
        displayScanHistory();
        showNotification('History cleared successfully', 'success');
    }
}

function exportHistory() {
    if (scanHistory.length === 0) {
        showNotification('No history to export', 'warning');
        return;
    }
    
    const csv = [
        ['Booking ID', 'Passenger', 'Source', 'Destination', 'Fare', 'Date', 'Time', 'Scan Type'],
        ...scanHistory.map(item => [
            item.bookingId || '',
            item.passenger || item.passengerName || '',
            item.source || '',
            item.destination || '',
            item.fare || '',
            item.date || new Date(item.timestamp).toLocaleDateString(),
            item.time || new Date(item.timestamp).toLocaleTimeString(),
            item.scanType || ''
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scan_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('History exported successfully', 'success');
}

function playSound(type) {
    if (!scanSettings.soundEnabled) return;
    
    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch (type) {
        case 'success':
            oscillator.frequency.value = 800;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
        case 'error':
            oscillator.frequency.value = 300;
            gainNode.gain.value = 0.1;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
        case 'start':
            oscillator.frequency.value = 600;
            gainNode.gain.value = 0.05;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
        case 'stop':
            oscillator.frequency.value = 400;
            gainNode.gain.value = 0.05;
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
    }
}

function vibrateDevice(pattern) {
    if (!scanSettings.vibrationEnabled || !navigator.vibrate) return;
    
    if (Array.isArray(pattern)) {
        navigator.vibrate(pattern);
    } else {
        navigator.vibrate(pattern);
    }
}

async function validateScannedTicket() {
    if (!scannedTicketData) {
        showNotification('No ticket data to validate', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        // Call backend to validate ticket
        const response = await fetch('/api/conductor/validate-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scannedTicketData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Ticket validated successfully!', 'success');
            
            // Update dashboard data
            loadDashboardData();
            
            // Clear scan result
            clearScanResult();
        } else {
            showNotification('Ticket validation failed: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error validating ticket:', error);
        showNotification('Error validating ticket', 'error');
    } finally {
        showLoading(false);
    }
}

// Manual Ticket Issuing
function updateFare() {
    const source = document.getElementById('sourceStop').value;
    const dest = document.getElementById('destStop').value;
    const busType = document.getElementById('busType').value;
    
    if (source && dest && busType && source !== dest) {
        const fare = fareMatrix[source]?.[dest]?.[busType] || 0;
        document.getElementById('fareAmount').textContent = `₹${fare}`;
    } else {
        document.getElementById('fareAmount').textContent = '₹0.00';
    }
}

async function handleTicketSubmission(event) {
    event.preventDefault();
    
    const formData = {
        sourceStop: document.getElementById('sourceStop').value,
        destStop: document.getElementById('destStop').value,
        busType: document.getElementById('busType').value,
        passengerName: document.getElementById('passengerName').value,
        fare: document.getElementById('fareAmount').textContent.replace('₹', ''),
        busNumber: 'TN09N2345', // Current bus number
        timestamp: new Date().toISOString()
    };
    
    try {
        showLoading(true);
        
        // Call backend to issue ticket
        const response = await fetch('/api/conductor/issue-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Ticket issued successfully!', 'success');
            
            // Display ticket with QR code
            displayIssuedTicket(result.ticket);
            
            // Reset form
            document.getElementById('ticketForm').reset();
            updateFare();
            
            // Update dashboard
            loadDashboardData();
            
        } else {
            showNotification('Ticket issuance failed: ' + result.message, 'error');
        }
        
    } catch (error) {
        console.error('Error issuing ticket:', error);
        showNotification('Error issuing ticket', 'error');
    } finally {
        showLoading(false);
    }
}

function displayIssuedTicket(ticket) {
    // Create a modal or section to display the issued ticket
    const ticketHtml = `
        <div class="ticket-display">
            <h3>🎫 Ticket Issued Successfully</h3>
            <div class="ticket-qr">
                <img src="${ticket.qrCode}" alt="Ticket QR Code" />
            </div>
            <div class="ticket-details">
                <p><strong>Booking ID:</strong> ${ticket.bookingId}</p>
                <p><strong>Passenger:</strong> ${ticket.passengerName}</p>
                <p><strong>Route:</strong> ${ticket.source} → ${ticket.destination}</p>
                <p><strong>Fare:</strong> ₹${ticket.fare}</p>
                <p><strong>Bus:</strong> ${ticket.busNumber}</p>
                <p><strong>Date:</strong> ${new Date(ticket.timestamp).toLocaleString()}</p>
            </div>
            <button onclick="printTicket('${ticket.bookingId}')" class="btn btn-primary">🖨️ Print Ticket</button>
        </div>
    `;
    
    // Display in a modal or dedicated section
    showNotification('Ticket issued! Check console for details.', 'success');
    console.log('Issued Ticket:', ticket);
}

// Advanced Features Functions
function updateAnalytics() {
    // Calculate today's revenue from scan history
    const today = new Date().toDateString();
    const todayScans = scanHistory.filter(item => 
        new Date(item.scanTime).toDateString() === today
    );
    
    analytics.todayRevenue = todayScans.reduce((sum, item) => 
        sum + (parseFloat(item.fare) || 0), 0
    );
    
    analytics.manualTickets = todayScans.filter(item => 
        item.scanType === 'Manual Issue'
    ).length;
    
    const totalTickets = analytics.ticketsScanned + analytics.manualTickets;
    analytics.validationRate = totalTickets > 0 ? 
        Math.round((analytics.ticketsScanned / totalTickets) * 100) : 0;
    
    // Update UI
    document.getElementById('todayRevenue').textContent = `₹${analytics.todayRevenue}`;
    document.getElementById('ticketsScanned').textContent = analytics.ticketsScanned;
    document.getElementById('manualTickets').textContent = analytics.manualTickets;
    document.getElementById('validationRate').textContent = `${analytics.validationRate}%`;
}

function loadScanHistory() {
    const saved = localStorage.getItem('scanHistory');
    if (saved) {
        scanHistory = JSON.parse(saved);
        displayScanHistory();
    }
}

function loadSavedSettings() {
    const saved = localStorage.getItem('scanSettings');
    if (saved) {
        scanSettings = JSON.parse(saved);
        
        // Apply settings to UI
        document.getElementById('scanSpeed').value = scanSettings.speed;
        document.getElementById('soundEnabled').checked = scanSettings.soundEnabled;
        document.getElementById('vibrationEnabled').checked = scanSettings.vibrationEnabled;
        document.getElementById('autoValidate').checked = scanSettings.autoValidate;
    }
}

function updateScanSpeed() {
    scanSettings.speed = document.getElementById('scanSpeed').value;
    saveSettings();
}

function updateSoundSetting() {
    scanSettings.soundEnabled = document.getElementById('soundEnabled').checked;
    saveSettings();
}

function updateVibrationSetting() {
    scanSettings.vibrationEnabled = document.getElementById('vibrationEnabled').checked;
    saveSettings();
}

function updateAutoValidateSetting() {
    scanSettings.autoValidate = document.getElementById('autoValidate').checked;
    saveSettings();
}

function saveSettings() {
    localStorage.setItem('scanSettings', JSON.stringify(scanSettings));
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.getElementById('fullscreenBtn').textContent = '🖥️ Exit Fullscreen';
    } else {
        document.exitFullscreen();
        document.getElementById('fullscreenBtn').textContent = '🖥️ Fullscreen Mode';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    document.getElementById('darkModeBtn').textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    localStorage.setItem('darkMode', isDarkMode);
}

function toggleOfflineMode() {
    const isOffline = !navigator.onLine;
    document.getElementById('offlineBtn').textContent = isOffline ? '📴 Online Mode' : '📴 Offline Mode';
    showNotification(isOffline ? 'Offline mode activated' : 'Online mode activated', 'info');
}

async function updateBatteryStatus() {
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            const updateBatteryLevel = () => {
                const level = Math.round(battery.level * 100);
                document.getElementById('batteryLevel').textContent = `${level}%`;
            };
            
            updateBatteryLevel();
            battery.addEventListener('levelchange', updateBatteryLevel);
            battery.addEventListener('chargingchange', updateBatteryLevel);
        } catch (error) {
            console.log('Battery API not available');
        }
    }
}

// Enhanced Manual Ticket Issuing
async function handleTicketSubmission(event) {
    event.preventDefault();
    
    const formData = {
        sourceStop: document.getElementById('sourceStop').value,
        destStop: document.getElementById('destStop').value,
        busType: document.getElementById('busType').value,
        passengerName: document.getElementById('passengerName').value,
        fare: document.getElementById('fareAmount').textContent.replace('₹', ''),
        busNumber: 'TN09N2345', // Current bus number
        timestamp: new Date().toISOString()
    };
    
    try {
        showLoading(true);
        
        // Call backend to issue ticket
        const response = await fetch('/api/conductor/issue-ticket', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification('Ticket issued successfully!', 'success');
            playSound('success');
            vibrateDevice([100, 50, 100]);
            
            // Display ticket with QR code
            displayIssuedTicket(result.ticket);
            
            // Add to history and analytics
            const historyItem = {
                ...result.ticket,
                scanTime: new Date().toISOString(),
                scanType: 'Manual Issue'
            };
            scanHistory.unshift(historyItem);
            if (scanHistory.length > 50) {
                scanHistory = scanHistory.slice(0, 50);
            }
            
            localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
            analytics.manualTickets++;
            analytics.todayRevenue += parseFloat(result.ticket.fare);
            updateAnalytics();
            displayScanHistory();
            
            // Reset form
            document.getElementById('ticketForm').reset();
            updateFare();
            
            // Update dashboard
            loadDashboardData();
            
        } else {
            showNotification('Ticket issuance failed: ' + result.message, 'error');
            playSound('error');
        }
        
    } catch (error) {
        console.error('Error issuing ticket:', error);
        showNotification('Error issuing ticket', 'error');
        playSound('error');
    } finally {
        showLoading(false);
    }
}

function displayIssuedTicket(ticket) {
    // Create a modal or section to display the issued ticket
    const ticketHtml = `
        <div class="ticket-display">
            <h3>🎫 Ticket Issued Successfully</h3>
            <div class="ticket-qr">
                <img src="${ticket.qrCode}" alt="Ticket QR Code" />
            </div>
            <div class="ticket-details">
                <p><strong>Booking ID:</strong> ${ticket.bookingId}</p>
                <p><strong>Passenger:</strong> ${ticket.passengerName}</p>
                <p><strong>Route:</strong> ${ticket.sourceStop} → ${ticket.destStop}</p>
                <p><strong>Fare:</strong> ₹${ticket.fare}</p>
                <p><strong>Bus:</strong> ${ticket.busNumber}</p>
                <p><strong>Date:</strong> ${new Date(ticket.timestamp).toLocaleString()}</p>
            </div>
            <div class="ticket-actions">
                <button onclick="printTicket('${ticket.bookingId}')" class="btn btn-primary">🖨️ Print Ticket</button>
                <button onclick="saveTicketToHistory()" class="btn btn-info">💾 Save to History</button>
            </div>
        </div>
    `;
    
    // Show in modal
    const modal = document.getElementById('ticketModal');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = ticketHtml;
    modal.classList.remove('hidden');
}

function printTicket(bookingId) {
    // Implementation for printing ticket
    showNotification(`Printing ticket ${bookingId}`, 'info');
    window.print();
}

// Utility Functions
function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    const btn = document.getElementById('autoRefreshBtn');
    btn.textContent = autoRefresh ? '⏸️ Auto Refresh: ON' : '▶️ Auto Refresh: OFF';
    btn.className = autoRefresh ? 'btn btn-secondary' : 'btn btn-primary';
    
    showNotification(`Auto refresh ${autoRefresh ? 'enabled' : 'disabled'}`, 'info');
}

function viewStopDetails(stopKey) {
    // Implementation to show detailed stop information
    showNotification(`Viewing details for ${stopKey}`, 'info');
}

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notificationMessage');
    
    messageElement.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideNotification();
    }, 5000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.classList.add('hidden');
}

// Error Handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred', 'error');
});

// Network Status
window.addEventListener('online', () => {
    showNotification('Connection restored', 'success');
    updateBatteryStatus();
});

window.addEventListener('offline', () => {
    showNotification('Connection lost', 'error');
});

// Initialize dark mode from saved preference
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    document.getElementById('darkModeBtn').textContent = '☀️ Light Mode';
}

// Add keyboard shortcuts
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 's':
                event.preventDefault();
                startQRScanner();
                break;
            case 'd':
                event.preventDefault();
                toggleDarkMode();
                break;
            case 'f':
                event.preventDefault();
                toggleFullscreen();
                break;
        }
    }
});

// Add touch gestures for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (event) => {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
});

document.addEventListener('touchend', (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // Swipe left to right - start scanner
    if (Math.abs(deltaX) > 100 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 0) {
            startQRScanner();
        }
    }
});
