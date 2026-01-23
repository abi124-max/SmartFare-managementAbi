// API Configuration
const API_BASE_URL = 'http://localhost:8081/api';

// Global variables
let selectedBus = null;
let currentBooking = null;
let locations = [];
let selectedSeat = null;
let steps = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements after DOM is loaded
    steps = {
        location: document.getElementById('locationStep'),
        busSelection: document.getElementById('busSelectionStep'),
        passenger: document.getElementById('passengerStep'),
        payment: document.getElementById('paymentStep'),
        ticket: document.getElementById('ticketStep')
    };
    
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    console.log('Initializing Smart Fare app...');
    
    // Check if required DOM elements exist
    const fromSelect = document.getElementById('fromLocation');
    const toSelect = document.getElementById('toLocation');
    const travelDate = document.getElementById('travelDate');
    
    if (!fromSelect || !toSelect || !travelDate) {
        console.error('Required DOM elements not found!');
        return;
    }
    
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    travelDate.min = today;
    travelDate.value = today;
    
    // Load locations
    await loadLocations();
    
    // Initialize progress
    updateProgress(1);
    
    console.log('App initialization complete');
}

function setupEventListeners() {
    // Step navigation - add null checks
    const searchBusesBtn = document.getElementById('searchBuses');
    if (searchBusesBtn) searchBusesBtn.addEventListener('click', searchBuses);
    
    const backToSearchBtn = document.getElementById('backToSearch');
    if (backToSearchBtn) backToSearchBtn.addEventListener('click', () => showStep('location'));
    
    const backToBusesBtn = document.getElementById('backToBuses');
    if (backToBusesBtn) backToBusesBtn.addEventListener('click', () => showStep('busSelection'));
    
    const backToPassengerBtn = document.getElementById('backToPassenger');
    if (backToPassengerBtn) backToPassengerBtn.addEventListener('click', () => showStep('passenger'));
    
    const proceedToPaymentBtn = document.getElementById('proceedToPayment');
    if (proceedToPaymentBtn) proceedToPaymentBtn.addEventListener('click', proceedToPayment);
    
    const payNowBtn = document.getElementById('payNow');
    if (payNowBtn) payNowBtn.addEventListener('click', processPayment);
    
    // Modern UI interactions
    const swapLocationsBtn = document.getElementById('swapLocations');
    if (swapLocationsBtn) swapLocationsBtn.addEventListener('click', swapLocations);
    
    // Filter chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', (e) => filterBuses(e.target.dataset.filter));
    });
    
    // Payment method selection
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', (e) => selectPaymentMethod(e.currentTarget));
    });
}

// Modern UI Functions
function updateProgress(step) {
    const progressFill = document.getElementById('progressFill');
    const stepIndicators = document.querySelectorAll('.step-indicator');
    
    if (!progressFill) {
        console.warn('Progress fill element not found');
        return;
    }
    
    // Update progress bar
    const progressPercentage = (step / 5) * 100;
    progressFill.style.width = `${progressPercentage}%`;
    
    // Update step indicators
    stepIndicators.forEach((indicator, index) => {
        const stepNumber = index + 1;
        indicator.classList.remove('active', 'completed');
        
        if (stepNumber === step) {
            indicator.classList.add('active');
        } else if (stepNumber < step) {
            indicator.classList.add('completed');
        }
    });
}

function swapLocations() {
    const fromSelect = document.getElementById('fromLocation');
    const toSelect = document.getElementById('toLocation');
    
    if (!fromSelect || !toSelect) {
        console.warn('Location selects not found');
        return;
    }
    
    const fromValue = fromSelect.value;
    const toValue = toSelect.value;
    
    fromSelect.value = toValue;
    toSelect.value = fromValue;
    
    // Add animation effect
    const swapButton = document.getElementById('swapLocations');
    if (swapButton) {
        swapButton.style.transform = 'translateY(-50%) rotate(180deg)';
        setTimeout(() => {
            swapButton.style.transform = 'translateY(-50%) rotate(0deg)';
        }, 300);
    }
}

function showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">
                ${type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️'}
            </div>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">
                    ${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Warning'}
                </div>
                <div style="font-size: 14px; color: #666;">${message}</div>
            </div>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

async function loadLocations() {
    try {
        console.log('Loading locations from:', `${API_BASE_URL}/buses/locations`);
        showLoading(true, 'Loading locations...', 'Please wait while we fetch available locations');
        
        const response = await fetch(`${API_BASE_URL}/buses/locations`);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        locations = await response.json();
        console.log('Locations received:', locations);
        
        populateLocationDropdowns();
        showToast('Locations loaded successfully');
    } catch (error) {
        console.error('Error loading locations:', error);
        showToast('Failed to load locations. Please refresh the page.', 'error');
        
        // Fallback: Add some default locations for testing
        locations = [
            {id: 1, name: "Koyambedu Bus Terminal", city: "Chennai", state: "Tamil Nadu"},
            {id: 2, name: "Tambaram Bus Stand", city: "Chennai", state: "Tamil Nadu"},
            {id: 3, name: "Velachery Bus Depot", city: "Chennai", state: "Tamil Nadu"},
            {id: 4, name: "Broadway Bus Terminal", city: "Chennai", state: "Tamil Nadu"}
        ];
        populateLocationDropdowns();
        console.log('Using fallback locations');
    } finally {
        showLoading(false);
    }
}

function populateLocationDropdowns() {
    const fromSelect = document.getElementById('fromLocation');
    const toSelect = document.getElementById('toLocation');
    
    if (!fromSelect || !toSelect) {
        console.warn('Location dropdowns not found');
        return;
    }
    
    // Clear existing options
    fromSelect.innerHTML = '<option value="">Choose departure point</option>';
    toSelect.innerHTML = '<option value="">Choose destination</option>';
    
    // Add location options
    locations.forEach(location => {
        const option = `<option value="${location.id}">${location.name}</option>`;
        fromSelect.innerHTML += option;
        toSelect.innerHTML += option;
    });
    
    console.log('Locations populated:', locations.length, 'locations loaded');
}

async function searchBuses() {
    const fromLocationId = document.getElementById('fromLocation').value;
    const toLocationId = document.getElementById('toLocation').value;
    const travelDate = document.getElementById('travelDate').value;
    
    if (!fromLocationId || !toLocationId || !travelDate) {
        showToast('Please fill in all fields', 'warning');
        return;
    }
    
    if (fromLocationId === toLocationId) {
        showToast('From and To locations cannot be the same', 'warning');
        return;
    }
    
    try {
        showLoading(true, 'Searching buses...', 'Finding the best buses for your journey');
        const response = await fetch(
            `${API_BASE_URL}/buses/search?fromLocationId=${fromLocationId}&toLocationId=${toLocationId}&travelDate=${travelDate}`
        );
        const buses = await response.json();
        
        displayBusResults(buses);
        displayRouteInfo(fromLocationId, toLocationId, travelDate);
        showStep('busSelection');
        updateProgress(2);
        showToast(`Found ${buses.length} buses for your route`);
    } catch (error) {
        console.error('Error searching buses:', error);
        showToast('Failed to search buses. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
}

function displayRouteInfo(fromLocationId, toLocationId, travelDate) {
    const fromLocation = locations.find(loc => loc.id == fromLocationId);
    const toLocation = locations.find(loc => loc.id == toLocationId);
    const formattedDate = new Date(travelDate).toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    const routeSummary = document.getElementById('routeSummary');
    if (!routeSummary) return;
    
    routeSummary.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="font-weight: 600; color: var(--gray-900);">${fromLocation.name}</div>
                <div style="color: var(--primary-color);">→</div>
                <div style="font-weight: 600; color: var(--gray-900);">${toLocation.name}</div>
            </div>
            <div style="font-size: 14px; color: var(--gray-600);">${formattedDate}</div>
        </div>
    `;
}

function displayBusResults(buses) {
    const resultsContainer = document.getElementById('busResults');
    if (!resultsContainer) return;
    
    if (buses.length === 0) {
        resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--gray-600);">
                <div style="font-size: 48px; margin-bottom: 16px;">🚌</div>
                <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: var(--gray-900);">No buses found</h3>
                <p>No buses available for the selected route and date.</p>
            </div>
        `;
        return;
    }
    
    // Store buses for filtering
    window.allBuses = buses;
    
    resultsContainer.innerHTML = buses.map(bus => {
        const seatStatus = getSeatStatus(bus.availableSeats, bus.bus.totalSeats);
        return createBusCard(bus, seatStatus);
    }).join('');
}

function createBusCard(bus, seatStatus) {
    return `
        <div class="bus-card-modern" onclick="selectBus(${JSON.stringify(bus).replace(/"/g, '&quot;')})">
            <div class="bus-header-modern">
                <div class="bus-info">
                    <div class="bus-name-modern">${bus.bus.busNumber}</div>
                    <div class="bus-operator">${bus.bus.operatorName}</div>
                </div>
                <div class="bus-fare-modern">
                    <div class="fare-amount">₹${bus.fare}</div>
                    <div class="fare-label">per seat</div>
                </div>
            </div>
            
            <div class="bus-timing-modern">
                <div class="time-info">
                    <div class="time-large">${formatTime(bus.departureTime)}</div>
                    <div class="time-label">${bus.route.fromLocation.name}</div>
                </div>
                <div class="duration-info">
                    <div class="duration-line"></div>
                    <div class="duration-text">${bus.route.estimatedDurationMinutes}m</div>
                </div>
                <div class="time-info">
                    <div class="time-large">${formatTime(bus.arrivalTime)}</div>
                    <div class="time-label">${bus.route.toLocation.name}</div>
                </div>
            </div>
            
            <div class="bus-details-modern">
                <div class="bus-detail-modern">
                    <div class="detail-icon">${getBusTypeIcon(bus.bus.busType.typeName)}</div>
                    <div class="detail-value">${bus.bus.busType.typeName}</div>
                    <div class="detail-label">Bus Type</div>
                </div>
                <div class="bus-detail-modern">
                    <div class="detail-icon">🪑</div>
                    <div class="detail-value">${bus.bus.totalSeats}</div>
                    <div class="detail-label">Total Seats</div>
                </div>
                <div class="bus-detail-modern">
                    <div class="detail-icon">${seatStatus.icon}</div>
                    <div class="detail-value ${seatStatus.class}">${bus.availableSeats}</div>
                    <div class="detail-label">Available</div>
                </div>
            </div>
        </div>
    `;
}

function getBusTypeIcon(busType) {
    const icons = {
        'AC Deluxe': '❄️',
        'Ordinary': '🚌',
        'AC Express': '🚌',
        'Volvo AC': '⭐'
    };
    return icons[busType] || '🚌';
}

function getSeatStatus(available, total) {
    const percentage = (available / total) * 100;
    if (percentage > 50) return { class: 'seats-available', icon: '✅' };
    if (percentage > 20) return { class: 'seats-filling', icon: '⚠️' };
    return { class: 'seats-full', icon: '🔴' };
}

function filterBuses(filter) {
    // Update active filter chip
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
    });
    event.target.classList.add('active');
    
    if (!window.allBuses) return;
    
    let filteredBuses = window.allBuses;
    
    switch (filter) {
        case 'ac':
            filteredBuses = window.allBuses.filter(bus => 
                bus.bus.busType.typeName.toLowerCase().includes('ac'));
            break;
        case 'non-ac':
            filteredBuses = window.allBuses.filter(bus => 
                !bus.bus.busType.typeName.toLowerCase().includes('ac'));
            break;
        case 'available':
            filteredBuses = window.allBuses.filter(bus => bus.availableSeats > 10);
            break;
        default:
            filteredBuses = window.allBuses;
    }
    
    const resultsContainer = document.getElementById('busResults');
    if (resultsContainer) {
        resultsContainer.innerHTML = filteredBuses.map(bus => {
            const seatStatus = getSeatStatus(bus.availableSeats, bus.bus.totalSeats);
            return createBusCard(bus, seatStatus);
        }).join('');
    }
}

function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function selectBus(bus) {
    selectedBus = bus;
    
    // Remove previous selection
    document.querySelectorAll('.bus-card-modern').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    event.currentTarget.classList.add('selected');
    
    // Show passenger details step
    displaySelectedBusInfo();
    generateSeatMap();
    showStep('passenger');
    updateProgress(3);
    showToast('Bus selected successfully');
}

function displaySelectedBusInfo() {
    const container = document.getElementById('selectedBusInfo');
    if (!container) return;
    
    const bus = selectedBus;
    
    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--gray-900); margin-bottom: 4px;">
                    ${bus.bus.busNumber}
                </h3>
                <p style="color: var(--gray-600); font-size: 14px;">${bus.bus.operatorName}</p>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 24px; font-weight: 800; color: var(--primary-color);">₹${bus.fare}</div>
                <div style="font-size: 12px; color: var(--gray-500);">per seat</div>
            </div>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; padding: 16px; background: var(--gray-50); border-radius: 12px;">
            <div style="text-align: center;">
                <div style="font-size: 16px; font-weight: 600; color: var(--gray-900);">${formatTime(bus.departureTime)}</div>
                <div style="font-size: 12px; color: var(--gray-600);">${bus.route.fromLocation.name}</div>
            </div>
            <div style="text-align: center;">
                <div style="font-size: 16px; font-weight: 600; color: var(--gray-900);">${formatTime(bus.arrivalTime)}</div>
                <div style="font-size: 12px; color: var(--gray-600);">${bus.route.toLocation.name}</div>
            </div>
        </div>
    `;
}

function generateSeatMap() {
    const seatMapContainer = document.getElementById('seatMap');
    if (!seatMapContainer) return;
    
    const totalSeats = selectedBus.bus.totalSeats;
    const availableSeats = selectedBus.availableSeats;
    const bookedSeats = totalSeats - availableSeats;
    
    // Generate seat layout (4 seats per row)
    let seatHTML = '';
    for (let i = 1; i <= totalSeats; i++) {
        const isBooked = Math.random() < (bookedSeats / totalSeats); // Simulate booked seats
        const seatClass = isBooked ? 'booked' : 'available';
        
        seatHTML += `
            <div class="seat ${seatClass}" data-seat="${i}" onclick="selectSeat(${i}, this)">
                ${i}
            </div>
        `;
    }
    
    seatMapContainer.innerHTML = seatHTML;
}

function selectSeat(seatNumber, seatElement) {
    if (seatElement.classList.contains('booked')) {
        showToast('This seat is already booked', 'warning');
        return;
    }
    
    // Remove previous selection
    document.querySelectorAll('.seat.selected').forEach(seat => {
        seat.classList.remove('selected');
    });
    
    // Select new seat
    seatElement.classList.add('selected');
    selectedSeat = seatNumber;
    
    showToast(`Seat ${seatNumber} selected`);
}

function proceedToPayment() {
    const passengerName = document.getElementById('passengerName');
    const passengerPhone = document.getElementById('passengerPhone');
    
    if (!passengerName || !passengerPhone || !selectedSeat) {
        showToast('Please fill in all details and select a seat', 'warning');
        return;
    }
    
    if (!/^[+]?[\d\s-()]{10,}$/.test(passengerPhone.value.trim())) {
        showToast('Please enter a valid phone number', 'warning');
        return;
    }
    
    displayBookingSummary();
    showStep('payment');
    updateProgress(4);
}

function displayBookingSummary() {
    const container = document.getElementById('bookingSummary');
    if (!container) return;
    
    const bus = selectedBus;
    const passengerName = document.getElementById('passengerName').value;
    const passengerPhone = document.getElementById('passengerPhone').value;
    
    container.innerHTML = `
        <h3 style="font-size: 18px; font-weight: 600; color: var(--gray-900); margin-bottom: 20px;">
            Booking Summary
        </h3>
        
        <div style="space-y: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
                <span style="color: var(--gray-600);">Passenger</span>
                <span style="font-weight: 500; color: var(--gray-900);">${passengerName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
                <span style="color: var(--gray-600);">Phone</span>
                <span style="font-weight: 500; color: var(--gray-900);">${passengerPhone}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
                <span style="color: var(--gray-600);">Bus</span>
                <span style="font-weight: 500; color: var(--gray-900);">${bus.bus.busNumber}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
                <span style="color: var(--gray-600);">Route</span>
                <span style="font-weight: 500; color: var(--gray-900);">${bus.route.fromLocation.name} → ${bus.route.toLocation.name}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
                <span style="color: var(--gray-600);">Seat</span>
                <span style="font-weight: 500; color: var(--gray-900);">Seat ${selectedSeat}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid var(--gray-300); margin-top: 16px;">
                <span style="font-size: 18px; font-weight: 600; color: var(--gray-900);">Total Amount</span>
                <span style="font-size: 24px; font-weight: 800; color: var(--primary-color);">₹${bus.fare}</span>
            </div>
        </div>
    `;
}

function selectPaymentMethod(option) {
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    option.classList.add('selected');
    
    const radio = option.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
}

async function processPayment() {
    const upiIdElement = document.getElementById('upiId');
    if (!upiIdElement) {
        showToast('UPI ID input not found', 'error');
        return;
    }
    
    const upiId = upiIdElement.value.trim();
    
    if (!upiId) {
        showToast('Please enter your UPI ID', 'warning');
        return;
    }
    
    if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
        showToast('Please enter a valid UPI ID', 'warning');
        return;
    }
    
    try {
        showLoading(true, 'Processing payment...', 'Please wait while we process your payment');
        
        // Create booking
        const bookingData = {
            passengerName: document.getElementById('passengerName').value,
            passengerPhone: document.getElementById('passengerPhone').value,
            scheduleId: selectedBus.id,
            seatNumber: `A${selectedSeat}`
        };
        
        const response = await fetch(`${API_BASE_URL}/bookings/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Booking failed');
        }
        
        currentBooking = await response.json();
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update payment status
        await updatePaymentStatus();
        
        // Show ticket
        await displayTicket();
        showStep('ticket');
        updateProgress(5);
        showToast('Payment successful! Your ticket is ready.', 'success');
        
    } catch (error) {
        console.error('Payment error:', error);
        showToast('Payment failed: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function updatePaymentStatus() {
    const transactionId = 'TXN' + Date.now();
    
    const response = await fetch(`${API_BASE_URL}/bookings/${currentBooking.bookingReference}/payment`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactionId })
    });
    
    if (response.ok) {
        currentBooking = await response.json();
    }
}

async function displayTicket() {
    const ticketBody = document.getElementById('ticketBody');
    if (!ticketBody) return;
    
    const bus = selectedBus;
    const booking = currentBooking;
    
    ticketBody.innerHTML = `
        <div class="ticket-row">
            <span class="ticket-label">Booking Reference:</span>
            <span class="ticket-value">${booking.bookingReference}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Passenger:</span>
            <span class="ticket-value">${booking.passenger.name}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Phone:</span>
            <span class="ticket-value">${booking.passenger.phone}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Route:</span>
            <span class="ticket-value">${bus.route.fromLocation.name} → ${bus.route.toLocation.name}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Bus:</span>
            <span class="ticket-value">${bus.bus.operatorName} (${bus.bus.busNumber})</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Seat:</span>
            <span class="ticket-value">${booking.seatNumber}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Date:</span>
            <span class="ticket-value">${bus.scheduleDate}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Time:</span>
            <span class="ticket-value">${formatTime(bus.departureTime)}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Fare:</span>
            <span class="ticket-value">₹${booking.fareAmount}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Status:</span>
            <span class="ticket-value">Confirmed</span>
        </div>
    `;
    
    // Load QR code
    await loadQRCode();
}

async function loadQRCode() {
    try {
        const response = await fetch(`${API_BASE_URL}/bookings/${currentBooking.bookingReference}/qr`);
        const qrData = await response.json();
        
        const qrContainer = document.getElementById('ticketQR');
        if (qrContainer) {
            qrContainer.innerHTML = `
                <h4>Scan QR Code</h4>
                <img src="${qrData.qrCode}" alt="Ticket QR Code">
                <p style="font-size: 0.8rem; color: #666; margin-top: 10px;">
                    Show this QR code to the conductor
                </p>
            `;
        }
    } catch (error) {
        console.error('Error loading QR code:', error);
    }
}

function downloadTicket() {
    if (!currentBooking || !selectedBus) {
        showToast('No ticket data available', 'error');
        return;
    }
    
    const ticketContent = `
SMART FARE BUS TICKET
=====================

Booking Reference: ${currentBooking.bookingReference}
Passenger: ${currentBooking.passenger.name}
Phone: ${currentBooking.passenger.phone}
Bus: ${selectedBus.bus.busNumber}
Operator: ${selectedBus.bus.operatorName}
Route: ${selectedBus.route.fromLocation.name} → ${selectedBus.route.toLocation.name}
Seat: ${currentBooking.seatNumber}
Date: ${selectedBus.scheduleDate}
Time: ${formatTime(selectedBus.departureTime)}
Fare: ₹${currentBooking.fareAmount}
Status: Confirmed

QR Data: ${currentBooking.qrCodeData}
=====================
Thank you for choosing Smart Fare!
    `;
    
    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${currentBooking.bookingReference}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Ticket downloaded successfully');
}

function shareTicket() {
    if (!currentBooking || !selectedBus) {
        showToast('No ticket data available', 'error');
        return;
    }
    
    if (navigator.share) {
        navigator.share({
            title: 'Smart Fare Bus Ticket',
            text: `My bus ticket: ${currentBooking.bookingReference}\nBus: ${selectedBus.bus.busNumber}\nSeat: ${currentBooking.seatNumber}`,
            url: window.location.href
        }).then(() => {
            showToast('Ticket shared successfully');
        }).catch((error) => {
            console.error('Error sharing:', error);
            fallbackShare();
        });
    } else {
        fallbackShare();
    }
}

function fallbackShare() {
    if (!currentBooking || !selectedBus) return;
    
    const shareText = `🚌 Smart Fare Bus Ticket\n\nBooking: ${currentBooking.bookingReference}\nBus: ${selectedBus.bus.busNumber}\nSeat: ${currentBooking.seatNumber}\nRoute: ${selectedBus.route.fromLocation.name} → ${selectedBus.route.toLocation.name}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showToast('Ticket details copied to clipboard');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Ticket details copied to clipboard');
    }
}

// Utility Functions
function showStep(stepName) {
    // Hide all steps
    Object.values(steps).forEach(step => {
        if (step) step.classList.remove('active');
    });
    
    // Show selected step
    if (steps[stepName]) {
        steps[stepName].classList.add('active');
    } else {
        console.warn(`Step '${stepName}' not found`);
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoading(show, title = 'Processing...', message = 'Please wait while we process your request') {
    const loadingOverlay = document.getElementById('loading');
    const loadingTitle = document.getElementById('loadingTitle');
    const loadingMessage = document.getElementById('loadingMessage');
    
    if (!loadingOverlay) {
        console.warn('Loading overlay not found');
        return;
    }
    
    if (show) {
        if (loadingTitle) loadingTitle.textContent = title;
        if (loadingMessage) loadingMessage.textContent = message;
        loadingOverlay.classList.remove('hidden');
    } else {
        loadingOverlay.classList.add('hidden');
    }
}

function resetApp() {
    selectedBus = null;
    currentBooking = null;
    selectedSeat = null;
    
    // Clear form fields with null checks
    const fromLocation = document.getElementById('fromLocation');
    if (fromLocation) fromLocation.value = '';
    
    const toLocation = document.getElementById('toLocation');
    if (toLocation) toLocation.value = '';
    
    const travelDate = document.getElementById('travelDate');
    if (travelDate) travelDate.value = new Date().toISOString().split('T')[0];
    
    const passengerName = document.getElementById('passengerName');
    if (passengerName) passengerName.value = '';
    
    const passengerPhone = document.getElementById('passengerPhone');
    if (passengerPhone) passengerPhone.value = '';
    
    const upiId = document.getElementById('upiId');
    if (upiId) upiId.value = '';
    
    // Clear results with null checks
    const busResults = document.getElementById('busResults');
    if (busResults) busResults.innerHTML = '';
    
    const selectedBusInfo = document.getElementById('selectedBusInfo');
    if (selectedBusInfo) selectedBusInfo.innerHTML = '';
    
    const bookingSummary = document.getElementById('bookingSummary');
    if (bookingSummary) bookingSummary.innerHTML = '';
    
    const ticketBody = document.getElementById('ticketBody');
    if (ticketBody) ticketBody.innerHTML = '';
    
    const ticketQR = document.getElementById('ticketQR');
    if (ticketQR) ticketQR.innerHTML = '';
}

// Add CSS animation for slideOutRight
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
