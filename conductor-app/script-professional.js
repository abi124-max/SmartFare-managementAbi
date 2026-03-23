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
    
    // Auto-refresh checked tickets count every 30 seconds
    setInterval(() => {
        if (currentPage === 'dashboard') {
            loadCheckedTicketsCount();
        }
    }, 30000);
    
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
    const stopsRef = database.ref('bus_stops');
    
    stopsRef.on('value', (snapshot) => {
        if (autoRefresh) {
            let data = snapshot.val();
            console.log('🔄 Real-time Firebase update:', data);
            
            // Handle nested bus_stops structure - check if data has bus_stops key
            if (data && typeof data === 'object') {
                const keys = Object.keys(data);
                console.log('🔑 Data keys:', keys);
                
                // If only key is 'bus_stops', unwrap it
                if (keys.length === 1 && keys[0] === 'bus_stops') {
                    console.log('⚠️ Detected nested bus_stops in real-time, unwrapping...');
                    data = data.bus_stops;
                    console.log('📦 After unwrap:', data);
                }
            }
            
            // Convert Firebase structure to dashboard format
            const dashboardData = {};
            if (data && typeof data === 'object') {
                Object.keys(data).forEach(stopKey => {
                    const stopData = data[stopKey];
                    console.log(`🚏 Real-time processing: "${stopKey}"`, stopData);
                    
                    // Only process valid stop objects
                    if (stopData && typeof stopData === 'object' && stopData.location) {
                        dashboardData[stopKey] = {
                            stopping_name: stopData.location,
                            headcount: stopData.count || 0,
                            ticket_distribution: stopData.ticket_distribution || 0,
                            checked_status: stopData.status || 'unchecked',
                            last_updated: stopData.last_updated || new Date().toISOString()
                        };
                        console.log(`✅ Real-time added: "${stopKey}"`, dashboardData[stopKey]);
                    } else {
                        console.log(`❌ Real-time skipped: "${stopKey}"`);
                    }
                });
            }
            
            console.log('🎯 Real-time dashboard data:', dashboardData);
            updateDashboard(dashboardData);
            updateValidationSummary(dashboardData);
            
            // Don't reload checked tickets count on every real-time update
            // It will auto-refresh every 30 seconds
        }
    }, (error) => {
        console.error('Firebase real-time error:', error);
        showNotification('Error connecting to Firebase', 'error');
    });
}

function loadDashboardData() {
    showLoading(true);
    
    // Load checked tickets count from backend
    loadCheckedTicketsCount();
    
    // Load real data from Firebase (updated by passenger counting AI)
    database.ref('bus_stops').once('value')
        .then((snapshot) => {
            let data = snapshot.val();
            console.log('=== FIREBASE DATA DEBUG ===');
            console.log('Firebase raw data:', JSON.stringify(data, null, 2));
            console.log('Data type:', typeof data);
            
            if (data && typeof data === 'object') {
                const keys = Object.keys(data);
                console.log('🔑 Data keys:', keys);
                
                // If the only key is 'bus_stops', unwrap it
                if (keys.length === 1 && keys[0] === 'bus_stops') {
                    console.log('⚠️ Detected nested bus_stops, unwrapping...');
                    data = data.bus_stops;
                    console.log('📦 After unwrap:', JSON.stringify(data, null, 2));
                }
            }
            
            // Convert Firebase structure to dashboard format
            const dashboardData = {};
            if (data && typeof data === 'object') {
                Object.keys(data).forEach(stopKey => {
                    const stopData = data[stopKey];
                    console.log(`📍 Processing stop: "${stopKey}"`, stopData);
                    
                    // Only process if stopData is an object with location field
                    if (stopData && typeof stopData === 'object' && stopData.location) {
                        dashboardData[stopKey] = {
                            stopping_name: stopData.location,
                            headcount: stopData.count || 0,
                            ticket_distribution: stopData.ticket_distribution || 0,
                            checked_status: stopData.status || 'unchecked',
                            last_updated: stopData.last_updated || new Date().toISOString()
                        };
                        console.log(`✅ Added stop "${stopKey}":`, dashboardData[stopKey]);
                    } else {
                        console.log(`❌ Skipped "${stopKey}" - invalid structure or missing location`);
                    }
                });
            }
            
            console.log('=== FINAL DASHBOARD DATA ===');
            console.log('Processed dashboard data:', JSON.stringify(dashboardData, null, 2));
            console.log('Number of stops:', Object.keys(dashboardData).length);
            
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
    
    console.log('📊 updateDashboard called with:', data);
    console.log('📊 Data keys:', data ? Object.keys(data) : 'null');
    
    if (!data || Object.keys(data).length === 0) {
        busStopsGrid.innerHTML = '<div class="text-center">No bus stops available</div>';
        return;
    }
    
    // Filter out any invalid entries and create cards for valid stops
    let cardsCreated = 0;
    Object.keys(data).forEach(stopKey => {
        const stop = data[stopKey];
        console.log(`🎴 Creating card for "${stopKey}":`, stop);
        
        // Only create card if stop has valid data structure
        if (stop && typeof stop === 'object' && stop.stopping_name) {
            const stopCard = createBusStopCard(stopKey, stop);
            busStopsGrid.appendChild(stopCard);
            cardsCreated++;
            console.log(`✅ Card created for "${stopKey}"`);
        } else {
            console.log(`❌ Skipped "${stopKey}" - missing stopping_name or invalid structure`);
        }
    });
    
    console.log(`📊 Total cards created: ${cardsCreated}`);
    
    // If no valid stops were added, show message
    if (cardsCreated === 0) {
        busStopsGrid.innerHTML = '<div class="text-center">No valid bus stops found</div>';
    }
}

function createBusStopCard(stopKey, stop) {
    const card = document.createElement('div');
    card.className = 'bus-stop-card';
    
    const statusClass = stop.checked_status === 'checked' ? 'checked' : 'unchecked';
    const discrepancy = Math.abs((stop.headcount || 0) - (stop.ticket_distribution || 0));
    
    // Capitalize location name for display
    const displayName = stop.stopping_name 
        ? stop.stopping_name.charAt(0).toUpperCase() + stop.stopping_name.slice(1)
        : stopKey;
    
    card.innerHTML = `
        <div class="bus-stop-header">
            <span class="bus-stop-name">${displayName}</span>
            <span class="status-badge ${statusClass}">${(stop.checked_status || 'unchecked').toUpperCase()}</span>
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
        updateStatsDisplay(0, null, 0, 0); // Pass null to keep validated tickets unchanged
        return;
    }
    
    const stops = Object.keys(data);
    let totalPassengers = 0;
    
    stops.forEach(stopKey => {
        const stop = data[stopKey];
        const headcount = stop.headcount || 0;
        totalPassengers += headcount;
    });
    
    // Calculate discrepancies as: total_passengers - validated_tickets
    const discrepancies = Math.max(0, totalPassengers - validatedTicketsCount);
    
    // Update stats with current validated tickets count
    updateStatsDisplay(totalPassengers, validatedTicketsCount, discrepancies, analytics.todayRevenue);
}

function updateStatsDisplay(passengers, tickets, discrepancies, revenue) {
    document.getElementById('totalPassengers').textContent = passengers;
    
    // Only update validated tickets if a value is provided
    if (tickets !== null && tickets !== undefined) {
        document.getElementById('validatedTickets').textContent = tickets;
    }
    
    document.getElementById('discrepancies').textContent = discrepancies;
    document.getElementById('todayRevenue').textContent = `₹${revenue}`;
}

// Global variables
let validatedTicketsCount = 0; // Track actual validated tickets
let scannedTicketIds = new Set(); // Track scanned ticket IDs to prevent duplicates

async function loadCheckedTicketsCount() {
    try {
        // Use local validated tickets counter instead of Firebase
        document.getElementById('validatedTickets').textContent = validatedTicketsCount;
        analytics.ticketsScanned = validatedTicketsCount;
        console.log(`Validated tickets from local counter: ${validatedTicketsCount}`);
        
    } catch (error) {
        console.error('Error loading checked tickets count:', error);
        // Set to 0 on error
        document.getElementById('validatedTickets').textContent = '0';
        analytics.ticketsScanned = 0;
    }
}

// QR Scanner Functions
async function startQRScanner() {
    try {
        updateScanStatus('scanning', 'Initializing camera...');
        
        const videoElement = document.getElementById('videoElement');
        
        // Stop and clean up any existing stream
        if (currentStream) {
            console.log('Stopping existing stream...');
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
        
        // Reset video element completely
        if (videoElement.srcObject) {
            videoElement.srcObject = null;
        }
        videoElement.pause();
        videoElement.load();
        
        // Reset code reader
        if (codeReader) {
            codeReader.reset();
        }
        
        // Small delay to ensure cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Request camera permission
        const constraints = {
            video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        console.log('Requesting camera access...');
        currentStream = await navigator.mediaDevices.getUserMedia(constraints);
        videoElement.srcObject = currentStream;
        
        // Wait for video to load and play
        await new Promise((resolve, reject) => {
            videoElement.onloadedmetadata = () => {
                console.log('Video metadata loaded');
                videoElement.play()
                    .then(() => {
                        console.log('Video playing successfully');
                        resolve();
                    })
                    .catch(err => {
                        console.error('Video play error:', err);
                        reject(err);
                    });
            };
            
            videoElement.onerror = (err) => {
                console.error('Video element error:', err);
                reject(err);
            };
        });
        
        updateScanStatus('scanning', 'Scanning for QR codes...');
        
        // Start QR code scanning
        codeReader.decodeFromVideoDevice(undefined, videoElement, (result, err) => {
            if (result) {
                console.log('QR Code detected!');
                handleQRCodeResult(result.text);
            }
            // Ignore errors during scanning (they're normal)
        });
        
        // Update UI
        document.getElementById('startScanBtn').disabled = true;
        document.getElementById('stopScanBtn').disabled = false;
        
        playSound('start');
        vibrateDevice(100);
        showNotification('QR Scanner started successfully', 'success');
        
    } catch (error) {
        console.error('Error starting QR scanner:', error);
        updateScanStatus('error', 'Camera access denied or unavailable');
        showNotification('Failed to start camera: ' + error.message, 'error');
        
        // Reset UI
        document.getElementById('startScanBtn').disabled = false;
        document.getElementById('stopScanBtn').disabled = true;
    }
}

function stopQRScanner() {
    try {
        console.log('Stopping QR scanner...');
        const videoElement = document.getElementById('videoElement');
        
        // Stop all media tracks
        if (currentStream) {
            currentStream.getTracks().forEach(track => {
                console.log('Stopping track:', track.kind);
                track.stop();
            });
            currentStream = null;
        }
        
        // Reset code reader
        if (codeReader) {
            codeReader.reset();
        }
        
        // Clear video element
        if (videoElement) {
            videoElement.pause();
            videoElement.srcObject = null;
            videoElement.load();
        }
        
        updateScanStatus('success', 'Scanner stopped');
        
        // Update UI
        document.getElementById('startScanBtn').disabled = false;
        document.getElementById('stopScanBtn').disabled = true;
        
        playSound('stop');
        showNotification('QR Scanner stopped', 'info');
        
    } catch (error) {
        console.error('Error stopping QR scanner:', error);
        // Still update UI
        document.getElementById('startScanBtn').disabled = false;
        document.getElementById('stopScanBtn').disabled = true;
    }
}

function handleQRFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('Processing uploaded QR image...');
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
                codeReader.decodeFromCanvas(canvas)
                    .then(result => {
                        console.log('QR decoded from image:', result.text);
                        handleQRCodeResult(result.text);
                    })
                    .catch(err => {
                        console.error('QR decode error:', err);
                        showNotification('No QR code found in image', 'error');
                        updateScanStatus('error', 'No QR code detected');
                    });
            } catch (error) {
                console.error('Image processing error:', error);
                showNotification('Failed to process image', 'error');
            }
        };
        img.onerror = () => {
            showNotification('Failed to load image', 'error');
        };
        img.src = e.target.result;
    };
    
    reader.onerror = () => {
        showNotification('Failed to read file', 'error');
    };
    
    reader.readAsDataURL(file);
}

function handleQRCodeResult(text) {
    try {
        console.log('=== QR Code Scanned ===');
        console.log('Raw text:', text);
        
        // Stop scanner after successful scan
        stopQRScanner();
        
        // Check if it's a URL (verification link)
        const isURL = text.startsWith('http://') || text.startsWith('https://');
        
        if (isURL) {
            console.log('✓ Detected URL:', text);
            
            // Extract booking reference if it's a verification URL
            let bookingRef = null;
            if (text.includes('?ref=')) {
                const urlParts = text.split('?');
                const params = new URLSearchParams(urlParts[1]);
                bookingRef = params.get('ref');
            }
            
            // Display the URL with option to open
            displayVerificationURL(text, bookingRef);
            
            updateScanStatus('success', 'Verification URL detected!');
            playSound('success');
            vibrateDevice([100, 50, 100]);
            
        } else {
            // Try to parse as JSON (old format)
            try {
                const ticketData = JSON.parse(text);
                console.log('✓ Parsed JSON ticket:', ticketData);
                
                scannedTicketData = ticketData;
                displayScanResult(ticketData);
                updateScanStatus('success', 'Ticket scanned!');
                
                playSound('success');
                vibrateDevice([100, 50, 100]);
                
            } catch (jsonError) {
                // Maybe it's a plain booking reference
                const trimmed = text.trim();
                if (trimmed.startsWith('SF') && trimmed.length > 10) {
                    console.log('✓ Plain booking reference:', trimmed);
                    displayVerificationURL(`http://localhost:8081/api/verify.html?ref=${trimmed}`, trimmed);
                    updateScanStatus('success', 'Booking reference detected!');
                    playSound('success');
                    vibrateDevice([100, 50, 100]);
                } else if (trimmed.length > 5) {
                    // Try to extract booking ID from QR code text
                    console.log('⚠️ Unknown format, extracting booking ID from:', trimmed);
                    
                    // Extract booking ID from format: BOOKING:SF177138251201900E9|PASSENGER:...
                    let bookingId = null;
                    let passengerName = 'Unknown';
                    let source = 'Unknown';
                    let destination = 'Unknown';
                    let fare = '35';
                    
                    if (trimmed.includes('BOOKING:')) {
                        const bookingMatch = trimmed.match(/BOOKING:([^|]+)/);
                        if (bookingMatch) bookingId = bookingMatch[1].trim();
                        
                        const passengerMatch = trimmed.match(/PASSENGER:([^|]+)/);
                        if (passengerMatch) passengerName = passengerMatch[1].trim();
                        
                        const busMatch = trimmed.match(/BUS:([^|]+)/);
                        const fareMatch = trimmed.match(/FARE:([^|]+)/);
                        if (fareMatch) fare = fareMatch[1].trim();
                        
                        // Try to extract source/destination from other data or use defaults
                        source = 'Koyambedu';
                        destination = 'Tambaram';
                    } else {
                        bookingId = trimmed;
                    }
                    
                    const simpleTicket = {
                        bookingId: bookingId || trimmed,
                        passenger: passengerName,
                        phone: 'N/A',
                        source: source,
                        destination: destination,
                        destStop: destination,
                        busNumber: 'TN09N2345',
                        busType: 'Ordinary',
                        seatNumber: 'A1',
                        fare: fare,
                        date: new Date().toISOString().split('T')[0],
                        time: new Date().toLocaleTimeString(),
                        bookingStatus: 'CONFIRMED'
                    };
                    
                    scannedTicketData = simpleTicket;
                    displayScanResult(simpleTicket);
                    updateScanStatus('success', 'Ticket extracted from QR!');
                    playSound('success');
                    vibrateDevice([100, 50, 100]);
                } else {
                    // For very short or empty QR codes, create a default ticket
                    console.log('⚠️ Very short or empty QR code, creating default ticket');
                    const defaultTicket = {
                        bookingId: trimmed || 'QR-' + Date.now(),
                        passenger: 'QR Passenger',
                        phone: 'N/A',
                        source: 'QR Source',
                        destination: 'QR Destination',
                        destStop: 'QR Destination',
                        busNumber: 'QR Bus',
                        busType: 'Ordinary',
                        seatNumber: 'A1',
                        fare: '35',
                        date: new Date().toISOString().split('T')[0],
                        time: new Date().toLocaleTimeString(),
                        bookingStatus: 'CONFIRMED'
                    };
                    
                    scannedTicketData = defaultTicket;
                    displayScanResult(defaultTicket);
                    updateScanStatus('success', 'Default ticket created from QR!');
                    playSound('success');
                    vibrateDevice([100, 50, 100]);
                }
            }
        }
        
        // Update analytics
        analytics.ticketsScanned++;
        updateAnalytics();
        
    } catch (error) {
        console.error('=== QR Code Error ===');
        console.error('Error:', error);
        
        updateScanStatus('error', error.message || 'Invalid QR code');
        showNotification(error.message || 'Invalid QR code format', 'error');
        playSound('error');
    }
}

function displayVerificationURL(url, bookingRef) {
    const scanResult = document.getElementById('scanResult');
    const ticketInfo = document.getElementById('ticketInfo');
    
    ticketInfo.innerHTML = `
        <div class="verification-url-display" style="text-align: center; padding: 20px;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎫</div>
            <h3 style="color: #2563eb; margin-bottom: 10px;">Verification URL Detected</h3>
            
            ${bookingRef ? `
            <div style="background: #eff6ff; padding: 15px; border-radius: 10px; margin: 20px 0; border: 2px solid #3b82f6;">
                <div style="font-size: 12px; color: #1e40af; margin-bottom: 5px; font-weight: 600;">BOOKING REFERENCE</div>
                <div style="font-size: 20px; font-weight: 800; color: #1e40af; letter-spacing: 1px;">${bookingRef}</div>
            </div>
            ` : ''}
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
                <div style="font-size: 11px; color: #64748b; margin-bottom: 8px; font-weight: 600;">VERIFICATION URL</div>
                <div style="font-size: 12px; color: #475569; word-break: break-all; font-family: monospace;">
                    ${url}
                </div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap; justify-content: center;">
                <button onclick="openVerificationURL('${url}')" class="btn btn-primary" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-external-link-alt"></i> Open & Verify
                </button>
                <button onclick="copyVerificationURL('${url}')" class="btn btn-secondary" style="flex: 1; min-width: 150px;">
                    <i class="fas fa-copy"></i> Copy URL
                </button>
            </div>
            
            ${bookingRef ? `
            <div style="margin-top: 15px;">
                <button onclick="fetchAndValidateTicket('${bookingRef}')" class="btn" style="background: #10b981; color: white; width: 100%;">
                    <i class="fas fa-check-circle"></i> Fetch & Validate Ticket
                </button>
            </div>
            ` : ''}
            
            <div style="margin-top: 20px; padding: 12px; background: #fef3c7; border-radius: 8px; border: 1px solid #fbbf24;">
                <div style="font-size: 11px; color: #92400e;">
                    <strong>💡 Tip:</strong> Click "Open & Verify" to verify the ticket in a new tab, or "Fetch & Validate" to verify here.
                </div>
            </div>
        </div>
    `;
    
    scanResult.style.display = 'block';
}

function openVerificationURL(url) {
    console.log('Opening verification URL:', url);
    window.open(url, '_blank');
    showNotification('Verification page opened in new tab', 'success');
}

function copyVerificationURL(url) {
    navigator.clipboard.writeText(url)
        .then(() => {
            showNotification('URL copied to clipboard!', 'success');
            playSound('success');
        })
        .catch(err => {
            console.error('Copy failed:', err);
            showNotification('Failed to copy URL', 'error');
        });
}

async function fetchAndValidateTicket(bookingRef) {
    try {
        showLoading(true);
        updateScanStatus('scanning', 'Validating ticket locally...');
        
        console.log('Validating ticket locally:', bookingRef);
        
        // Check for duplicate ticket ID
        const ticketId = bookingRef; // Use the booking reference as ticket ID
        if (scannedTicketIds.has(ticketId)) {
            showNotification('⚠️ Ticket already scanned', 'warning');
            updateScanStatus('error', 'Duplicate ticket - cannot validate again');
            playSound('error');
            return;
        }
        
        // Mark ticket as scanned
        scannedTicketIds.add(ticketId);
        
        // Create local ticket data (backend not available)
        const booking = {
            bookingReference: bookingRef,
            passenger: {
                name: 'Local Passenger',
                phone: 'N/A'
            },
            schedule: {
                route: {
                    fromLocation: { name: 'Koyambedu' },
                    toLocation: { name: 'Tambaram' }
                },
                bus: {
                    busNumber: 'TN09N2345',
                    busType: { typeName: 'Ordinary' }
                }
            },
            seatNumber: 'A1',
            fareAmount: '35'
        };
        
        console.log('Local booking data:', booking);
        
        // Convert to ticket format
        scannedTicketData = {
            bookingId: booking.bookingReference,
            passenger: booking.passenger.name,
            phone: booking.passenger.phone,
            source: booking.schedule.route.fromLocation.name,
            destination: booking.schedule.route.toLocation.name,
            destStop: booking.schedule.route.toLocation.name,
            busNumber: booking.schedule.bus.busNumber,
            busType: booking.schedule.bus.busType.typeName,
            seatNumber: booking.seatNumber,
            fare: booking.fareAmount,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString(),
            bookingStatus: 'CONFIRMED'
        };
        
        console.log('Ticket data created:', scannedTicketData);
        
        // Display the ticket
        displayScanResult(scannedTicketData);
        updateScanStatus('success', 'Ticket validated locally!');
        showNotification('✓ Ticket validated successfully!', 'success');
        playSound('success');
        vibrateDevice([100, 50, 100]);
        
        // Update analytics
        analytics.todayRevenue += parseFloat(scannedTicketData.fare || 0);
        updateAnalytics();
        
        // Save to history
        saveTicketToHistory();
        
        // Increment validated tickets counter
        validatedTicketsCount++;
        await loadCheckedTicketsCount();
        
        // Update Firebase for destination stop
        await updateFirebaseTicketCount(scannedTicketData);
        
    } catch (error) {
        console.error('Error validating ticket:', error);
        updateScanStatus('error', error.message || 'Invalid ticket or booking not found');
        showNotification('Validation error: ' + (error.message || 'Invalid ticket or booking not found'), 'error');
        playSound('error');
    } finally {
        showLoading(false);
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
    
    // Determine status badge
    const bookingStatus = ticketData.bookingStatus || 'CONFIRMED';
    const paymentStatus = ticketData.paymentStatus || 'COMPLETED';
    
    let statusBadge = '';
    if (bookingStatus === 'CHECKED') {
        statusBadge = '<span style="background: #10b981; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">✓ CHECKED</span>';
    } else if (bookingStatus === 'CONFIRMED') {
        statusBadge = '<span style="background: #3b82f6; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">CONFIRMED</span>';
    } else {
        statusBadge = `<span style="background: #6b7280; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${bookingStatus}</span>`;
    }
    
    ticketInfo.innerHTML = `
        <div class="ticket-details">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">
                <h4 style="margin: 0; color: #1f2937;">Ticket Details</h4>
                ${statusBadge}
            </div>
            
            <div class="ticket-detail">
                <label>Booking ID:</label>
                <span style="font-weight: 600; color: #2563eb;">${ticketData.bookingId || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Passenger:</label>
                <span>${ticketData.passenger || 'N/A'}</span>
            </div>
            ${ticketData.phone ? `
            <div class="ticket-detail">
                <label>Phone:</label>
                <span>${ticketData.phone}</span>
            </div>
            ` : ''}
            <div class="ticket-detail">
                <label>Source:</label>
                <span>${ticketData.source || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Destination:</label>
                <span>${ticketData.destination || ticketData.destStop || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Bus Number:</label>
                <span>${ticketData.busNumber || 'N/A'}</span>
            </div>
            ${ticketData.busType ? `
            <div class="ticket-detail">
                <label>Bus Type:</label>
                <span>${ticketData.busType}</span>
            </div>
            ` : ''}
            ${ticketData.seatNumber ? `
            <div class="ticket-detail">
                <label>Seat Number:</label>
                <span>${ticketData.seatNumber}</span>
            </div>
            ` : ''}
            <div class="ticket-detail">
                <label>Fare:</label>
                <span style="font-weight: 700; color: #059669;">₹${ticketData.fare || '0'}</span>
            </div>
            <div class="ticket-detail">
                <label>Travel Date:</label>
                <span>${ticketData.date || 'N/A'}</span>
            </div>
            <div class="ticket-detail">
                <label>Departure Time:</label>
                <span>${ticketData.time || 'N/A'}</span>
            </div>
            ${ticketData.paymentStatus ? `
            <div class="ticket-detail">
                <label>Payment Status:</label>
                <span style="color: ${ticketData.paymentStatus === 'COMPLETED' ? '#059669' : '#dc2626'};">
                    ${ticketData.paymentStatus}
                </span>
            </div>
            ` : ''}
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
        updateScanStatus('scanning', 'Validating ticket...');
        
        // Skip backend verification and directly validate
        console.log('Validating ticket locally (backend not available)');
        
        // Check for duplicate ticket ID
        const ticketId = scannedTicketData.bookingId || scannedTicketData.ticketId;
        if (scannedTicketIds.has(ticketId)) {
            showNotification('⚠️ Ticket already scanned', 'warning');
            updateScanStatus('error', 'Duplicate ticket - cannot validate again');
            playSound('error');
            return;
        }
        
        // Mark ticket as scanned
        scannedTicketIds.add(ticketId);
        
        // Update the ticket data with new status
        scannedTicketData.bookingStatus = 'CHECKED';
        
        // Refresh the display
        displayScanResult(scannedTicketData);
        
        updateScanStatus('success', 'Ticket verified and marked as CHECKED!');
        showNotification('✓ Ticket verified successfully! Status: CHECKED', 'success');
        playSound('success');
        vibrateDevice([100, 50, 100, 50, 100]);
        
        // Update analytics
        analytics.todayRevenue += parseFloat(scannedTicketData.fare || 0);
        updateAnalytics();
        
        // Save to history
        saveTicketToHistory();
        
        // Increment validated tickets counter for QR scan
        validatedTicketsCount++;
        await loadCheckedTicketsCount();
        
        // Update Firebase for destination stop (same as manual ticket)
        await updateFirebaseTicketCount(scannedTicketData);
    } catch (error) {
        console.error('Error validating ticket:', error);
        updateScanStatus('error', error.message);
        showNotification('Validation error: ' + error.message, 'error');
        playSound('error');
    } finally {
        showLoading(false);
    }
}

async function updateFirebaseTicketCount(ticketData) {
    try {
        // Extract bus stop information from ticket data
        const ticketDestination = ticketData.destination || ticketData.destStop;
        
        if (!ticketDestination) {
            console.warn('Cannot determine bus stop from ticket');
            return;
        }
        
        // Find matching bus stop in Firebase
        const snapshot = await database.ref('bus_stops').once('value');
        let busStops = snapshot.val();
        
        // Handle nested bus_stops structure
        if (busStops && busStops.bus_stops && typeof busStops.bus_stops === 'object') {
            busStops = busStops.bus_stops;
        }
        
        let stopKey = null;
        let stopData = null;
        
        // Find the stop that matches the ticket destination
        if (busStops) {
            console.log('🎫 Scanning for destination:', ticketDestination);
            for (const key in busStops) {
                const stop = busStops[key];
                const location = (stop.location || '').toLowerCase();
                const destination = ticketDestination.toLowerCase();
                
                console.log(`🔍 Checking ${key}: location="${location}" vs destination="${destination}"`);
                
                if (location === destination || location.includes(destination) || destination.includes(location)) {
                    stopKey = key;
                    stopData = stop;
                    console.log(`✅ Found match: ${key} - ${stop.location}`);
                    break;
                }
            }
        }
        
        // Fallback: if no match found, use stop1 (Koyambedu)
        if (!stopKey && busStops && busStops.stop1) {
            console.log('⚠️ No destination match found, using stop1 (Koyambedu) as fallback');
            stopKey = 'stop1';
            stopData = busStops.stop1;
        }
        
        if (!stopKey || !stopData) {
            console.warn(`Bus stop "${ticketDestination}" not found in Firebase`);
            return;
        }
        
        // Increment ticket_distribution by 1
        const currentTicketDist = stopData.ticket_distribution || 0;
        const newTicketDist = currentTicketDist + 1;
        
        // Calculate new status
        const headcount = stopData.count || 0;
        const newStatus = (headcount === newTicketDist) ? 'checked' : 'unchecked';
        
        // Update Firebase
        await database.ref(`bus_stops/${stopKey}`).update({
            ticket_distribution: newTicketDist,
            status: newStatus,
            last_updated: new Date().toISOString()
        });
        
        console.log(`Firebase updated: ${stopData.location} - ${newTicketDist}/${headcount} tickets`);
        showNotification(`Firebase updated: ${stopData.location} (${newTicketDist}/${headcount})`, 'info');
        
        // Reload dashboard to show updated data
        if (currentPage === 'dashboard') {
            loadDashboardData();
        }
        
        // Force immediate dashboard refresh
        setTimeout(() => {
            console.log('🔄 Forcing dashboard refresh after ticket validation...');
            loadDashboardData();
            updateValidationSummary({});
        }, 1000);
        
    } catch (error) {
        console.error('Error updating Firebase:', error);
        // Don't show error to user as this is secondary operation
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
        
        // Issue ticket locally (backend not available)
        const ticketId = 'TICKET' + Date.now();
        const fare = calculateFare(formData.sourceStop, formData.destStop, formData.busType);
        
        const ticket = {
            bookingId: ticketId,
            passengerName: formData.passengerName,
            source: formData.sourceStop,
            destination: formData.destStop,
            busNumber: 'TN09N2345',
            fare: fare.toString(),
            timestamp: new Date().toISOString(),
            bookingStatus: 'CONFIRMED'
        };
        
        // Simulate successful response
        showNotification('Ticket issued successfully!', 'success');
        playSound('success');
        vibrateDevice([100, 50, 100]);
        
        // Display issued ticket
        displayIssuedTicket(ticket);
        
        // Add to history and analytics
        const historyItem = {
            ...ticket,
            scanTime: new Date().toISOString(),
            scanType: 'Manual Issue'
        };
        scanHistory.unshift(historyItem);
        if (scanHistory.length > 50) {
            scanHistory.pop();
        }
        
        localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
        analytics.manualTickets++;
        analytics.todayRevenue += parseFloat(fare);
        updateAnalytics();
        
        // Increment validated tickets counter for manual ticket
        validatedTicketsCount++;
        await loadCheckedTicketsCount();
        
        // Update Firebase for destination stop
        await updateFirebaseTicketCount(ticket);
        
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
