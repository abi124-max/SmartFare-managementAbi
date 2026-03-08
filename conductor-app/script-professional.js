// Smart Fare Conductor - Professional Dashboard JavaScript

// Firebase Configuration
const firebaseConfig = {
    apiKey: "demo-key",
    authDomain: "demo-project.firebaseapp.com",
    databaseURL: "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com",
    projectId: "demo-project",
    storageBucket: "demo-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "demo-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Global Variables
let currentPage = 'dashboard';
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
    console.log('🚌 Initializing Smart Fare Conductor Professional Dashboard...');
    showLoading(true);
    
    // Initialize ZXing QR Code Reader
    codeReader = new ZXing.BrowserQRCodeReader();
    
    // Set initial fare
    updateFare();
    
    // Load initial data
    loadDashboardData();
    
    // Load saved data
    loadSavedSettings();
    loadScanHistory();
    updateAnalytics();
    updateBatteryStatus();
    
    showLoading(false);
    showNotification('Professional dashboard initialized successfully', 'success');
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const page = this.getAttribute('data-page');
            navigateToPage(page);
        });
    });
    
    // Dashboard controls
    document.getElementById('refreshDashboard').addEventListener('click', loadDashboardData);
    document.getElementById('autoRefreshToggle').addEventListener('click', toggleAutoRefresh);
    
    // QR Scanner controls
    document.getElementById('startScanBtn').addEventListener('click', startQRScanner);
    document.getElementById('stopScanBtn').addEventListener('click', stopQRScanner);
    document.getElementById('uploadQRBtn').addEventListener('click', () => {
        document.getElementById('qrFileInput').click();
    });
    document.getElementById('qrFileInput').addEventListener('change', handleQRFileUpload);
    document.getElementById('validateTicketBtn').addEventListener('click', validateScannedTicket);
    document.getElementById('saveTicketBtn').addEventListener('click', saveTicketToHistory);
    document.getElementById('clearScanBtn').addEventListener('click', clearScanResult);
    
    // Ticket form
    document.getElementById('ticketForm').addEventListener('submit', handleTicketSubmission);
    document.getElementById('sourceStop').addEventListener('change', updateFare);
    document.getElementById('destStop').addEventListener('change', updateFare);
    document.getElementById('busType').addEventListener('change', updateFare);
    
    // Analytics
    document.getElementById('exportHistoryBtn').addEventListener('click', exportHistory);
    document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);
    
    // Settings
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);
    document.getElementById('scanSpeed').addEventListener('change', updateScanSpeed);
    document.getElementById('soundEnabled').addEventListener('change', updateSoundSetting);
    document.getElementById('vibrationEnabled').addEventListener('change', updateVibrationSetting);
    document.getElementById('autoValidate').addEventListener('change', updateAutoValidateSetting);
    
    // Modal
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    
    // Notification close
    document.getElementById('closeNotification').addEventListener('click', hideNotification);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Page Navigation
function navigateToPage(page) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(p => {
        p.classList.add('hidden');
    });
    
    // Show selected page
    document.getElementById(`${page}-page`).classList.remove('hidden');
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    currentPage = page;
    
    // Page-specific initialization
    switch(page) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'analytics':
            updateAnalytics();
            displayActivityHistory();
            break;
        case 'settings':
            // Settings are already loaded
            break;
    }
}

// Firebase Real-time Updates
function startRealtimeUpdates() {
    const stopsRef = database.ref();
    
    stopsRef.on('value', (snapshot) => {
        if (autoRefresh && currentPage === 'dashboard') {
            const data = snapshot.val();
            console.log('Real-time Firebase update:', data);
            
            // Convert new Firebase structure to dashboard format
            const dashboardData = {};
            if (data) {
                Object.keys(data).forEach(busStop => {
                    const stopData = data[busStop];
                    dashboardData[`stop_${busStop.toLowerCase()}`] = {
                        stopping_name: stopData.location || busStop,
                        headcount: stopData.count || 0,
                        ticket_distribution: stopData.ticket_distribution || 0,
                        checked_status: stopData.status || 'unchecked',
                        last_updated: stopData.last_updated || new Date().toISOString()
                    };
                });
            }
            
            updateDashboard(dashboardData);
            updateValidationSummary(dashboardData);
        }
    }, (error) => {
        console.error('Firebase real-time error:', error);
        showNotification('Error connecting to Firebase', 'error');
    });
}

function loadDashboardData() {
    showLoading(true);
    
    // Load real data from Firebase (updated by passenger counting AI)
    database.ref().once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            console.log('Firebase data:', data);
            
            // Convert new Firebase structure to dashboard format
            const dashboardData = {};
            if (data) {
                Object.keys(data).forEach(busStop => {
                    const stopData = data[busStop];
                    dashboardData[`stop_${busStop.toLowerCase()}`] = {
                        stopping_name: stopData.location || busStop,
                        headcount: stopData.count || 0,
                        ticket_distribution: stopData.ticket_distribution || 0,
                        checked_status: stopData.status || 'unchecked',
                        last_updated: stopData.last_updated || new Date().toISOString()
                    };
                });
            }
            
            updateDashboard(dashboardData);
            updateValidationSummary(dashboardData);
            showLoading(false);
            showNotification('Dashboard loaded from Firebase', 'success');
        })
        .catch((error) => {
            console.error('Error loading dashboard data:', error);
            showNotification('Error loading dashboard data', 'error');
            showLoading(false);
        });
}

function updateDashboard(data) {
    const busStopsGrid = document.getElementById('busStopsGrid');
    busStopsGrid.innerHTML = '';
    
    if (!data) {
        busStopsGrid.innerHTML = '<div class="text-center">No data available</div>';
        return;
    }
    
    Object.keys(data).forEach(stopKey => {
        const stop = data[stopKey];
        const stopCard = createBusStopCard(stopKey, stop);
        busStopsGrid.appendChild(stopCard);
    });
}

function createBusStopCard(stopKey, stop) {
    const card = document.createElement('div');
    card.className = 'bus-stop-card';
    
    const statusClass = stop.checked_status === 'checked' ? 'checked' : 'unchecked';
    const discrepancy = Math.abs((stop.headcount || 0) - (stop.ticket_distribution || 0));
    
    card.innerHTML = `
        <div class="bus-stop-header">
            <span class="bus-stop-name">${stop.stopping_name || stopKey}</span>
            <span class="status-badge ${statusClass}">${stop.checked_status || 'unchecked'}</span>
        </div>
        <div class="bus-stop-stats">
            <div class="stat-item">
                <div class="value">${stop.headcount || 0}</div>
                <div class="label">Headcount</div>
            </div>
            <div class="stat-item">
                <div class="value">${stop.ticket_distribution || 0}</div>
                <div class="label">Tickets</div>
            </div>
        </div>
        <div class="discrepancy-info">
            <span>Discrepancy: ${discrepancy}</span>
        </div>
    `;
    
    return card;
}

function updateValidationSummary(data) {
    if (!data) {
        updateStatsDisplay(0, 0, 0, 0);
        return;
    }
    
    const stops = Object.keys(data);
    let totalPassengers = 0;
    let validatedTickets = 0;
    let totalDiscrepancies = 0;
    
    stops.forEach(stopKey => {
        const stop = data[stopKey];
        const headcount = stop.headcount || 0;
        const ticketDist = stop.ticket_distribution || 0;
        
        totalPassengers += headcount;
        validatedTickets += ticketDist;
        totalDiscrepancies += Math.abs(headcount - ticketDist);
    });
    
    updateStatsDisplay(totalPassengers, validatedTickets, totalDiscrepancies, analytics.todayRevenue);
}

function updateStatsDisplay(passengers, tickets, discrepancies, revenue) {
    document.getElementById('totalPassengers').textContent = passengers;
    document.getElementById('validatedTickets').textContent = tickets;
    document.getElementById('discrepancies').textContent = discrepancies;
    document.getElementById('todayRevenue').textContent = `₹${revenue}`;
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
            
            // Start QR code scanning
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

function updateScanStatus(status, message) {
    const statusElement = document.getElementById('scanStatus');
    statusElement.className = status;
    statusElement.textContent = message;
}

function displayScanResult(ticketData) {
    const scanResult = document.getElementById('scanResult');
    const ticketInfo = document.getElementById('ticketInfo');
    
    ticketInfo.innerHTML = `
        <div class="ticket-details">
            <div class="ticket-detail">
                <label>Booking ID:</label>
                <span>${ticketData.bookingId || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Passenger:</label>
                <span>${ticketData.passenger || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Source:</label>
                <span>${ticketData.source || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Destination:</label>
                <span>${ticketData.destination || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Bus Number:</label>
                <span>${ticketData.busNumber || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Fare:</label>
                <span>₹${ticketData.fare || '0'}</span>
            </div>
            <div class="ticket-detail">
                <label>Date:</label>
                <span>${ticketData.date || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Time:</label>
                <span>${ticketData.time || 'N/A'}</span>
            </div>
        </div>
    `;
    
    scanResult.style.display = 'block';
}

function clearScanResult() {
    document.getElementById('scanResult').style.display = 'none';
    scannedTicketData = null;
    updateScanStatus('success', 'Ready to scan');
}

async function validateScannedTicket() {
    if (!scannedTicketData) {
        showNotification('No ticket data to validate', 'warning');
        return;
    }
    
    try {
        showLoading(true);
        
        // Extract bus stop information from ticket data
        // Assuming ticket has destination or stop information
        const ticketDestination = scannedTicketData.destination || scannedTicketData.to || scannedTicketData.toLocation;
        
        if (!ticketDestination) {
            showNotification('Cannot determine bus stop from ticket', 'error');
            showLoading(false);
            return;
        }
        
        // Find matching bus stop in Firebase
        const snapshot = await database.ref().once('value');
        const busStops = snapshot.val();
        
        let stopKey = null;
        let stopData = null;
        
        // Find the stop that matches the ticket destination
        if (busStops) {
            for (const key in busStops) {
                const stop = busStops[key];
                if (stop.location && stop.location.toLowerCase().includes(ticketDestination.toLowerCase())) {
                    stopKey = key;
                    stopData = stop;
                    break;
                }
            }
        }
        
        if (!stopKey || !stopData) {
            showNotification('Bus stop not found in database', 'error');
            showLoading(false);
            return;
        }
        
        // Increment ticket_distribution by 1
        const currentTicketDist = stopData.ticket_distribution || 0;
        const newTicketDist = currentTicketDist + 1;
        
        // Calculate new status
        const headcount = stopData.count || 0;
        const newStatus = (headcount === newTicketDist) ? 'checked' : 'unchecked';
        
        // Update Firebase
        await database.ref(`${stopKey}`).update({
            ticket_distribution: newTicketDist,
            status: newStatus,
            last_updated: new Date().toISOString()
        });
        
        showNotification(`Ticket validated! ${stopData.location}: ${newTicketDist} tickets distributed`, 'success');
        
        // Update analytics
        analytics.ticketsScanned++;
        updateAnalytics();
        
        // Save to history
        saveTicketToHistory();
        
        // Update dashboard data
        loadDashboardData();
        
        // Clear scan result
        clearScanResult();
        
    } catch (error) {
        console.error('Error validating ticket:', error);
        showNotification('Error validating ticket: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
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
            scanHistory = scanHistory.slice(0, 50);
        }
        
        localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
        showNotification('Ticket saved to history', 'success');
    }
}

// Manual Ticket Issuing
function updateFare() {
    const source = document.getElementById('sourceStop').value;
    const dest = document.getElementById('destStop').value;
    const busType = document.getElementById('busType').value;
    
    if (source && dest && busType && source !== dest) {
        const fare = calculateFare(source, dest, busType);
        document.getElementById('fareAmount').textContent = `₹${fare}`;
    } else {
        document.getElementById('fareAmount').textContent = '₹0.00';
    }
}

function calculateFare(source, destination, busType) {
    const sourceRoutes = fareMatrix[source];
    if (sourceRoutes) {
        const destFares = sourceRoutes[destination];
        if (destFares) {
            return destFares[busType] || 0;
        }
    }
    return 0;
}

async function handleTicketSubmission(event) {
    event.preventDefault();
    
    const formData = {
        sourceStop: document.getElementById('sourceStop').value,
        destStop: document.getElementById('destStop').value,
        busType: document.getElementById('busType').value,
        passengerName: document.getElementById('passengerName').value,
        fare: document.getElementById('fareAmount').textContent.replace('₹', ''),
        busNumber: 'TN09N2345',
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
            
            // Display issued ticket
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
    const modal = document.getElementById('ticketModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="ticket-display">
            <h4>🎫 Ticket Issued Successfully</h4>
            <div class="ticket-qr">
                <img src="${ticket.qrCode}" alt="Ticket QR Code" />
            </div>
            <div class="ticket-details">
                <div class="ticket-detail">
                    <label>Booking ID:</label>
                    <span>${ticket.bookingId}</span>
                </div>
                <div class="ticket-detail">
                    <label>Passenger:</label>
                    <span>${ticket.passengerName}</span>
                </div>
                <div class="ticket-detail">
                    <label>Route:</label>
                    <span>${ticket.sourceStop} → ${ticket.destStop}</span>
                </div>
                <div class="ticket-detail">
                    <label>Fare:</label>
                    <span>₹${ticket.fare}</span>
                </div>
                <div class="ticket-detail">
                    <label>Bus:</label>
                    <span>${ticket.busNumber}</span>
                </div>
                <div class="ticket-detail">
                    <label>Date:</label>
                    <span>${new Date(ticket.timestamp).toLocaleString()}</span>
                </div>
            </div>
            <div class="ticket-actions">
                <button onclick="printTicket('${ticket.bookingId}')" class="btn btn-primary">
                    <i class="fas fa-print"></i> Print Ticket
                </button>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
}

function printTicket(bookingId) {
    showNotification(`Printing ticket ${bookingId}`, 'info');
    window.print();
}

// Analytics Functions
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
    
    // Update dashboard stats
    updateStatsDisplay(
        parseInt(document.getElementById('totalPassengers').textContent) || 0,
        parseInt(document.getElementById('validatedTickets').textContent) || 0,
        parseInt(document.getElementById('discrepancies').textContent) || 0,
        analytics.todayRevenue
    );
}

function displayActivityHistory() {
    const activityList = document.getElementById('activityList');
    activityList.innerHTML = '';
    
    scanHistory.slice(0, 10).forEach(item => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div>
                <strong>${item.bookingId || 'Manual'}</strong>
                <span class="route">${item.source || 'N/A'} → ${item.destination || 'N/A'}</span>
            </div>
            <div class="time">${new Date(item.scanTime).toLocaleTimeString()}</div>
        `;
        activityItem.addEventListener('click', () => showTicketDetails(item));
        activityList.appendChild(activityItem);
    });
    
    if (scanHistory.length === 0) {
        activityList.innerHTML = '<div class="text-center">No activity history available</div>';
    }
}

function showTicketDetails(ticket) {
    const modal = document.getElementById('ticketModal');
    const modalBody = document.getElementById('modalBody');
    
    modalBody.innerHTML = `
        <div class="ticket-details-full">
            <h4>🎫 Complete Ticket Details</h4>
            <div class="detail-grid">
                <div class="ticket-detail">
                    <label>Booking ID:</label>
                    <span>${ticket.bookingId || 'N/A'}</span>
                </div>
                <div class="ticket-detail">
                    <label>Passenger:</label>
                    <span>${ticket.passenger || ticket.passengerName || 'N/A'}</span>
                </div>
                <div class="ticket-detail">
                    <label>Route:</label>
                    <span>${ticket.source || 'N/A'} → ${ticket.destination || 'N/A'}</span>
                </div>
                <div class="ticket-detail">
                    <label>Bus Number:</label>
                    <span>${ticket.busNumber || 'N/A'}</span>
                </div>
                <div class="ticket-detail">
                    <label>Fare:</label>
                    <span>₹${ticket.fare || '0'}</span>
                </div>
                <div class="ticket-detail">
                    <label>Date:</label>
                    <span>${ticket.date || new Date(ticket.timestamp).toLocaleDateString()}</span>
                </div>
                <div class="ticket-detail">
                    <label>Time:</label>
                    <span>${ticket.time || new Date(ticket.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="ticket-detail">
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

function clearHistory() {
    if (confirm('Are you sure you want to clear all scan history?')) {
        scanHistory = [];
        localStorage.removeItem('scanHistory');
        displayActivityHistory();
        showNotification('History cleared successfully', 'success');
    }
}

// Settings Functions
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

function loadScanHistory() {
    const saved = localStorage.getItem('scanHistory');
    if (saved) {
        scanHistory = JSON.parse(saved);
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
        document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-compress"></i> Exit Fullscreen';
    } else {
        document.exitFullscreen();
        document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-expand"></i> Fullscreen Mode';
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    document.getElementById('darkModeBtn').innerHTML = isDarkMode ? '<i class="fas fa-sun"></i> Light Mode' : '<i class="fas fa-moon"></i> Dark Mode';
    localStorage.setItem('darkMode', isDarkMode);
}

function toggleAutoRefresh() {
    autoRefresh = !autoRefresh;
    const btn = document.getElementById('autoRefreshToggle');
    btn.innerHTML = autoRefresh ? '<i class="fas fa-pause"></i> Auto Refresh' : '<i class="fas fa-play"></i> Auto Refresh';
    btn.className = autoRefresh ? 'btn btn-primary' : 'btn btn-secondary';
    
    showNotification(`Auto refresh ${autoRefresh ? 'enabled' : 'disabled'}`, 'info');
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

// Utility Functions
function playSound(type) {
    if (!scanSettings.soundEnabled) return;
    
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

function handleKeyboardShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case '1':
                event.preventDefault();
                navigateToPage('dashboard');
                break;
            case '2':
                event.preventDefault();
                navigateToPage('scanner');
                break;
            case '3':
                event.preventDefault();
                navigateToPage('tickets');
                break;
            case '4':
                event.preventDefault();
                navigateToPage('analytics');
                break;
            case '5':
                event.preventDefault();
                navigateToPage('settings');
                break;
            case 's':
                event.preventDefault();
                if (currentPage === 'scanner') {
                    startQRScanner();
                }
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
    document.getElementById('darkModeBtn').innerHTML = '<i class="fas fa-sun"></i> Light Mode';
}

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
    
    // Swipe left to right - navigate to next page
    if (Math.abs(deltaX) > 100 && Math.abs(deltaX) > Math.abs(deltaY)) {
        const pages = ['dashboard', 'scanner', 'tickets', 'analytics', 'settings'];
        const currentIndex = pages.indexOf(currentPage);
        
        if (deltaX > 0 && currentIndex > 0) {
            // Swipe right - previous page
            navigateToPage(pages[currentIndex - 1]);
        } else if (deltaX < 0 && currentIndex < pages.length - 1) {
            // Swipe left - next page
            navigateToPage(pages[currentIndex + 1]);
        }
    }
});
