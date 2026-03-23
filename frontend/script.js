// API Configuration
const API_BASE_URL = "http://localhost:8081/api";

// Global variables
let selectedBus = null;
let currentBooking = null;
let locations = [];
let selectedSeat = null;

let steps = {};

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  // Initialize DOM elements after DOM is loaded
  steps = {
    location: document.getElementById("locationStep"),
    busSelection: document.getElementById("busSelectionStep"),
    passenger: document.getElementById("passengerStep"),
    payment: document.getElementById("paymentStep"),
    ticket: document.getElementById("ticketStep"),
  };

  // Check if required DOM elements exist
  const fromSelect = document.getElementById("fromLocation");
  const toSelect = document.getElementById("toLocation");
  const travelDate = document.getElementById("travelDate");

  if (!fromSelect || !toSelect || !travelDate) {
    console.error("Required DOM elements not found");
    return;
  }

  // Set default date to today
  const today = new Date().toISOString().split("T")[0];
  travelDate.value = today;
  travelDate.min = today;

  // Initialize the app
  initializeApp();
});

async function initializeApp() {
  console.log("Initializing Smart Fare app...");

  // Check if required DOM elements exist
  const fromSelect = document.getElementById("fromLocation");
  const toSelect = document.getElementById("toLocation");
  const travelDate = document.getElementById("travelDate");

  if (!fromSelect || !toSelect || !travelDate) {
    console.error("Required DOM elements not found!");
    return;
  }

  // Set minimum date to today
  const today = new Date().toISOString().split("T")[0];
  travelDate.min = today;
  travelDate.value = today;

  // Load locations
  await loadLocations();

  // Setup event listeners
  setupEventListeners();

  // Initialize progress
  updateProgress(1);

  console.log("App initialization complete");
}

function setupEventListeners() {
  // Step navigation - add null checks
  const searchBusesBtn = document.getElementById("searchBuses");
  if (searchBusesBtn) searchBusesBtn.addEventListener("click", searchBuses);

  const backToSearchBtn = document.getElementById("backToSearch");
  if (backToSearchBtn)
    backToSearchBtn.addEventListener("click", () => showStep("location"));

  const backToBusesBtn = document.getElementById("backToBuses");
  if (backToBusesBtn)
    backToBusesBtn.addEventListener("click", () => showStep("busSelection"));

  const backToPassengerBtn = document.getElementById("backToPassenger");
  if (backToPassengerBtn)
    backToPassengerBtn.addEventListener("click", () => showStep("passenger"));

  const proceedToPaymentBtn = document.getElementById("proceedToPayment");
  if (proceedToPaymentBtn)
    proceedToPaymentBtn.addEventListener("click", proceedToPayment);

  const payNowBtn = document.getElementById("payNow");
  if (payNowBtn) payNowBtn.addEventListener("click", processPayment);

  // Modern UI interactions
  const swapLocationsBtn = document.getElementById("swapLocations");
  if (swapLocationsBtn)
    swapLocationsBtn.addEventListener("click", swapLocations);

  // Filter chips
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.addEventListener("click", (e) => filterBuses(e.target.dataset.filter));
  });

  // Payment method selection
  document.querySelectorAll(".payment-option").forEach((option) => {
    option.addEventListener("click", (e) =>
      selectPaymentMethod(e.currentTarget)
    );
  });
}

// Modern UI Functions
function updateProgress(step) {
  const progressFill = document.getElementById("progressFill");
  const stepIndicators = document.querySelectorAll(".step-indicator");

  if (!progressFill) {
    console.warn("Progress fill element not found");
    return;
  }

  // Update progress bar
  const progressPercentage = (step / 5) * 100;
  progressFill.style.width = `${progressPercentage}%`;

  // Update step indicators
  stepIndicators.forEach((indicator, index) => {
    const stepNumber = index + 1;
    indicator.classList.remove("active", "completed");

    if (stepNumber === step) {
      indicator.classList.add("active");
    } else if (stepNumber < step) {
      indicator.classList.add("completed");
    }
  });
}

function swapLocations() {
  const fromSelect = document.getElementById("fromLocation");
  const toSelect = document.getElementById("toLocation");

  if (!fromSelect || !toSelect) {
    console.warn("Location selects not found");
    return;
  }

  const fromValue = fromSelect.value;
  const toValue = toSelect.value;

  fromSelect.value = toValue;
  toSelect.value = fromValue;

  // Add animation effect
  const swapButton = document.getElementById("swapLocations");
  if (swapButton) {
    swapButton.style.transform = "translateY(-50%) rotate(180deg)";
    setTimeout(() => {
      swapButton.style.transform = "translateY(-50%) rotate(0deg)";
    }, 300);
  }
}

function showToast(message, type = "success") {
  const toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    console.warn("Toast container not found");
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 20px;">
                ${type === "success" ? "✓" : type === "error" ? "✗" : "!"}
            </div>
            <div>
                <div style="font-weight: 600; margin-bottom: 4px;">
                    ${
                      type === "success"
                        ? "Success"
                        : type === "error"
                        ? "Error"
                        : "Warning"
                    }
                </div>
                <div style="font-size: 14px; color: #666;">${message}</div>
            </div>
        </div>
    `;

  toastContainer.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = "slideOutRight 0.3s ease-out forwards";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 4000);
}

async function loadLocations() {
  try {
    console.log("Loading locations from:", `${API_BASE_URL}/buses/locations`);
    showLoading(
      true,
      "Loading locations...",
      "Please wait while we fetch available locations"
    );

    const response = await fetch(`${API_BASE_URL}/buses/locations`);
    console.log("Response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    locations = await response.json();
    console.log("Locations received:", locations);

    populateLocationDropdowns();
    showToast("Locations loaded successfully");
  } catch (error) {
    console.error("Error loading locations:", error);
    showToast("Failed to load locations. Please refresh the page.", "error");

    // Fallback: Add some default locations for testing
    locations = [
      {
        id: 1,
        name: "Koyambedu Bus Terminal",
        city: "Chennai",
        state: "Tamil Nadu",
      },
      {
        id: 2,
        name: "Tambaram Bus Stand",
        city: "Chennai",
        state: "Tamil Nadu",
      },
      {
        id: 3,
        name: "Velachery Bus Depot",
        city: "Chennai",
        state: "Tamil Nadu",
      },
      {
        id: 4,
        name: "Broadway Bus Terminal",
        city: "Chennai",
        state: "Tamil Nadu",
      },
    ];
    populateLocationDropdowns();
    console.log("Using fallback locations");
  } finally {
    showLoading(false);
  }
}

function populateLocationDropdowns() {
  const fromSelect = document.getElementById("fromLocation");
  const toSelect = document.getElementById("toLocation");

  if (!fromSelect || !toSelect) {
    console.warn("Location dropdowns not found");
    return;
  }

  // Clear existing options
  fromSelect.innerHTML = '<option value="">Choose departure point</option>';
  toSelect.innerHTML = '<option value="">Choose destination</option>';

  // Add location options
  locations.forEach((location) => {
    const option = `<option value="${location.id}">${location.name}</option>`;
    fromSelect.innerHTML += option;
    toSelect.innerHTML += option;
  });

  // Add event listeners to prevent selecting same location
  fromSelect.addEventListener("change", function () {
    filterToDropdown(this.value);
  });

  toSelect.addEventListener("change", function () {
    filterFromDropdown(this.value);
  });

  console.log("Locations populated:", locations.length, "locations loaded");
}

function filterToDropdown(fromLocationId) {
  const toSelect = document.getElementById("toLocation");
  const currentValue = toSelect.value;

  toSelect.innerHTML = '<option value="">Choose destination</option>';

  locations.forEach((location) => {
    if (location.id != fromLocationId) {
      const option = `<option value="${location.id}">${location.name}</option>`;
      toSelect.innerHTML += option;
    }
  });

  // Restore previous selection if it's still valid
  if (currentValue && currentValue != fromLocationId) {
    toSelect.value = currentValue;
  }
}

function filterFromDropdown(toLocationId) {
  const fromSelect = document.getElementById("fromLocation");
  const currentValue = fromSelect.value;

  fromSelect.innerHTML = '<option value="">Choose departure point</option>';

  locations.forEach((location) => {
    if (location.id != toLocationId) {
      const option = `<option value="${location.id}">${location.name}</option>`;
      fromSelect.innerHTML += option;
    }
  });

  // Restore previous selection if it's still valid
  if (currentValue && currentValue != toLocationId) {
    fromSelect.value = currentValue;
  }
}

async function searchBuses() {
  const fromLocationId = document.getElementById("fromLocation").value;
  const toLocationId = document.getElementById("toLocation").value;
  const travelDate = document.getElementById("travelDate").value;

  console.log("Search parameters:", {
    fromLocationId,
    toLocationId,
    travelDate,
  });

  if (!fromLocationId || !toLocationId || !travelDate) {
    showToast("Please fill in all fields", "warning");
    return;
  }

  if (fromLocationId === toLocationId) {
    showToast("From and To locations cannot be the same", "warning");
    return;
  }

  try {
    showLoading(
      true,
      "Searching buses...",
      "Finding the best buses for your journey"
    );

    const apiUrl = `${API_BASE_URL}/buses/search?fromLocationId=${fromLocationId}&toLocationId=${toLocationId}&travelDate=${travelDate}`;
    console.log("Making API call to:", apiUrl);

    const response = await fetch(apiUrl);
    console.log("API response status:", response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buses = await response.json();
    console.log("Buses received:", buses);
    console.log("Number of buses:", buses.length);
    
    // Debug first bus structure
    if (buses.length > 0) {
        console.log("First bus structure:", buses[0]);
        console.log("First bus route:", buses[0].route);
        console.log("First bus route.fromLocation:", buses[0].route?.fromLocation);
        console.log("First bus route.toLocation:", buses[0].route?.toLocation);
        console.log("Bus has fromLocationName:", buses[0].fromLocationName);
        console.log("Bus has toLocationName:", buses[0].toLocationName);
    }

    displayBusResults(buses);
    displayRouteInfo(fromLocationId, toLocationId, travelDate);
    showStep("busSelection");
    updateProgress(2);

    if (buses.length > 0) {
      showToast(`Found ${buses.length} buses for your route!`, "success");
    } else {
      showToast("No buses found for the selected route and date", "warning");
    }
  } catch (error) {
    console.error("Error searching buses:", error);
    showToast("Failed to search buses. Please try again.", "error");
  } finally {
    showLoading(false);
  }
}

function displayRouteInfo(fromLocationId, toLocationId, travelDate) {
  const fromLocation = locations.find((loc) => loc.id == fromLocationId);
  const toLocation = locations.find((loc) => loc.id == toLocationId);
  const formattedDate = new Date(travelDate).toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const routeSummary = document.getElementById("routeSummary");
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
  const resultsContainer = document.getElementById("busResults");
  if (!resultsContainer) {
    console.error("busResults container not found!");
    return;
  }

  console.log("displayBusResults called with:", buses.length, "buses");

  if (buses.length === 0) {
    console.log("No buses to display - showing empty message");
    resultsContainer.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--gray-600);">
                <div style="font-size: 48px; margin-bottom: 16px;">BUS</div>
                <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 8px; color: var(--gray-900);">No buses found</h3>
                <p>No buses available for the selected route and date.</p>
            </div>
        `;
    return;
  }

  console.log("Creating bus cards for", buses.length, "buses");

  // Store buses for filtering
  window.allBuses = buses;

  try {
    resultsContainer.innerHTML = buses
      .map((bus) => {
        console.log("Creating card for bus:", bus);
        
        // Handle both DTO format and entity format
        const busNumber = bus.busNumber || bus.bus?.busNumber;
        const busType = bus.busType || bus.bus?.busType?.typeName || 'Ordinary';
        const operatorName = bus.operatorName || bus.bus?.operatorName;
        const fromLocationName = bus.fromLocationName || bus.route?.fromLocation?.name;
        const toLocationName = bus.toLocationName || bus.route?.toLocation?.name;
        const totalSeats = bus.totalSeats || bus.bus?.totalSeats || 40;
        
        console.log("Bus details:", {
          busNumber, busType, operatorName, fromLocationName, toLocationName, totalSeats
        });
        
        const seatStatus = getSeatStatus(bus.availableSeats, totalSeats);
        return createBusCard(bus, seatStatus);
      })
      .join("");

    console.log("Bus cards created successfully");
  } catch (error) {
    console.error("Error creating bus cards:", error);
    resultsContainer.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: var(--red-600);">
        <h3>Error displaying buses</h3>
        <p>Please try again.</p>
      </div>
    `;
  }
}

function createBusCard(bus, seatStatus) {
  // Extract values from both DTO and entity formats
  const busNumber = bus.busNumber || bus.bus?.busNumber;
  const operatorName = bus.operatorName || bus.bus?.operatorName;
  const fromLocationName = bus.fromLocationName || bus.route?.fromLocation?.name;
  const toLocationName = bus.toLocationName || bus.route?.toLocation?.name;
  const estimatedDuration = bus.route?.estimatedDurationMinutes || 45;
  
  return `
        <div class="bus-card-modern" onclick="selectBus(${JSON.stringify(
          bus
        ).replace(/"/g, "&quot;")})">
            <div class="bus-header-modern">
                <div class="bus-info">
                    <div class="bus-name-modern">${busNumber}</div>
                    <div class="bus-operator">${operatorName}</div>
                </div>
                <div class="bus-fare-modern">
                    <div class="fare-amount">₹${bus.fare}</div>
                    <div class="fare-label">per seat</div>
                </div>
            </div>
            
            <div class="bus-timing-modern">
                <div class="time-info">
                    <div class="time-large">${formatTime(
                      bus.departureTime
                    )}</div>
                    <div class="time-label">${fromLocationName}</div>
                </div>
                <div class="duration-info">
                    <div class="duration-line"></div>
                    <div class="duration-text">${estimatedDuration} min</div>
                </div>
                <div class="time-info">
                    <div class="time-large">${formatTime(
                      bus.arrivalTime
                    )}</div>
                    <div class="time-label">${toLocationName}</div>
                </div>
            </div>
            
            <div class="bus-details-modern">
                <div class="bus-detail-modern">
                    <div class="detail-icon">${getBusTypeIcon(
                      bus.busType || bus.bus?.busType?.typeName
                    )}</div>
                    <div class="detail-value">${bus.busType || bus.bus?.busType?.typeName || 'Ordinary'}</div>
                    <div class="detail-label">Bus Type</div>
                </div>
                <div class="bus-detail-modern">
                    <div class="detail-icon">SEAT</div>
                    <div class="detail-value">${bus.totalSeats || bus.bus?.totalSeats || 40}</div>
                    <div class="detail-label">Total Seats</div>
                </div>
                <div class="bus-detail-modern">
                    <div class="detail-icon">${seatStatus.icon}</div>
                    <div class="detail-value ${seatStatus.class}">${
    bus.availableSeats
  }</div>
                    <div class="detail-label">Available</div>
                </div>
            </div>
        </div>
    `;
}

function getBusTypeIcon(busType) {
  const icons = {
    "AC Deluxe": "AC",
    Ordinary: "BUS",
    "AC Express": "EXP",
    "Volvo AC": "VOLVO",
  };
  return icons[busType] || "BUS";
}

function getSeatStatus(available, total) {
  const percentage = (available / total) * 100;
  if (percentage > 50) return { class: "seats-available", icon: "✓" };
  if (percentage > 20) return { class: "seats-filling", icon: "!" };
  return { class: "seats-full", icon: "X" };
}

function filterBuses(filter) {
  // Update active filter chip
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    chip.classList.remove("active");
  });
  event.target.classList.add("active");

  if (!window.allBuses) return;

  let filteredBuses = window.allBuses;

  switch (filter) {
    case "ac":
      filteredBuses = window.allBuses.filter((bus) =>
        bus.bus.busType.typeName.toLowerCase().includes("ac")
      );
      break;
    case "non-ac":
      filteredBuses = window.allBuses.filter(
        (bus) => !bus.bus.busType.typeName.toLowerCase().includes("ac")
      );
      break;
    case "available":
      filteredBuses = window.allBuses.filter((bus) => bus.availableSeats > 10);
      break;
    default:
      filteredBuses = window.allBuses;
  }

  const resultsContainer = document.getElementById("busResults");
  if (resultsContainer) {
    resultsContainer.innerHTML = filteredBuses
      .map((bus) => {
        const seatStatus = getSeatStatus(
          bus.availableSeats,
          bus.bus.totalSeats
        );
        return createBusCard(bus, seatStatus);
      })
      .join("");
  }
}

function formatTime(timeString) {
  const [hours, minutes] = timeString.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

function selectBus(bus) {
  console.log("selectBus called with:", bus);
  
  // Validate bus object
  if (!bus) {
    console.error("Bus object is undefined");
    return;
  }
  
  selectedBus = bus;

  // Remove previous selection
  document.querySelectorAll(".bus-card-modern").forEach((card) => {
    card.classList.remove("selected");
  });

  // Add selection to clicked card
  event.currentTarget.classList.add("selected");

  // Show passenger details step
  displaySelectedBusInfo();
  generateSeatMap();
  showStep("passenger");
  updateProgress(3);
  showToast("Bus selected successfully");
}

function displaySelectedBusInfo() {
  console.log("displaySelectedBusInfo called with selectedBus:", selectedBus);
  
  const container = document.getElementById("selectedBusInfo");
  if (!container) return;

  const bus = selectedBus;
  
  // Validate bus object
  if (!bus) {
    console.error("Bus object is undefined in displaySelectedBusInfo");
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--red-600);">
        <h3>Error: No bus selected</h3>
      </div>
    `;
    return;
  }

  // Extract values from both DTO and entity formats
  const busNumber = bus.busNumber || bus.bus?.busNumber;
  const operatorName = bus.operatorName || bus.bus?.operatorName;
  const busType = bus.busType || bus.bus?.busType?.typeName || 'Ordinary';
  const fromLocationName = bus.fromLocationName || bus.route?.fromLocation?.name;
  const toLocationName = bus.toLocationName || bus.route?.toLocation?.name;
  const fare = bus.fare;
  const availableSeats = bus.availableSeats;
  const totalSeats = bus.totalSeats || bus.bus?.totalSeats || 40;
  const departureTime = bus.departureTime;
  const arrivalTime = bus.arrivalTime;

  console.log("Extracted bus details:", {
    busNumber, operatorName, busType, fromLocationName, toLocationName, fare, availableSeats, totalSeats
  });

  container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
                <h3 style="font-size: 18px; font-weight: 700; color: var(--gray-900); margin-bottom: 4px;">
                    ${busNumber || 'N/A'}
                </h3>
                <p style="font-size: 14px; color: var(--gray-600); margin: 0;">
                    ${operatorName || 'N/A'} • ${busType}
                </p>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 20px; font-weight: 700; color: var(--primary-color);">
                    ₹${fare || '0'}
                </div>
                <div style="font-size: 12px; color: var(--gray-600);">per seat</div>
            </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--gray-50); border-radius: 8px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">
                    ${fromLocationName || 'N/A'}
                </div>
                <div style="color: var(--primary-color);">→</div>
                <div style="font-size: 14px; font-weight: 600; color: var(--gray-900);">
                    ${toLocationName || 'N/A'}
                </div>
            </div>
            <div style="font-size: 12px; color: var(--gray-600);">
                ${formatTime(departureTime)} - ${formatTime(arrivalTime)}
            </div>
        </div>
        
        <div style="display: flex; gap: 16px;">
            <div style="flex: 1; text-align: center; padding: 8px; background: var(--green-50); border-radius: 6px;">
                <div style="font-size: 16px; font-weight: 600; color: var(--green-600);">
                    ${availableSeats || '0'}
                </div>
                <div style="font-size: 12px; color: var(--gray-600);">Available Seats</div>
            </div>
            <div style="flex: 1; text-align: center; padding: 8px; background: var(--blue-50); border-radius: 6px;">
                <div style="font-size: 16px; font-weight: 600; color: var(--blue-600);">
                    ${totalSeats || '0'}
                </div>
                <div style="font-size: 12px; color: var(--gray-600);">Total Seats</div>
            </div>
        </div>
    `;
}

function generateSeatMap() {
  const seatMapContainer = document.getElementById("seatMap");
  if (!seatMapContainer) return;

  // Extract totalSeats from both DTO and entity formats
  const totalSeats = selectedBus.totalSeats || selectedBus.bus?.totalSeats || 40;
  const availableSeats = selectedBus.availableSeats;
  const bookedSeats = totalSeats - availableSeats;

  // Generate seat layout (4 seats per row)
  let seatHTML = "";
  for (let i = 1; i <= totalSeats; i++) {
    const isBooked = Math.random() < bookedSeats / totalSeats; // Simulate booked seats
    const seatClass = isBooked ? "booked" : "available";

    seatHTML += `
            <div class="seat ${seatClass}" data-seat="${i}" onclick="selectSeat(${i}, this)">
                ${i}
            </div>
        `;
  }

  seatMapContainer.innerHTML = seatHTML;
}

function selectSeat(seatNumber, seatElement) {
  if (seatElement.classList.contains("booked")) {
    showToast("This seat is already booked", "warning");
    return;
  }

  // Remove previous selection
  document.querySelectorAll(".seat.selected").forEach((seat) => {
    seat.classList.remove("selected");
  });

  // Select new seat
  seatElement.classList.add("selected");
  selectedSeat = seatNumber;

  showToast(`Seat ${seatNumber} selected`);
}

function proceedToPayment() {
  console.log("proceedToPayment called, selectedBus:", selectedBus);
  
  // Validate selectedBus
  if (!selectedBus) {
    showToast("Please select a bus first", "warning");
    return;
  }
  
  const passengerName = document.getElementById("passengerName");
  const passengerPhone = document.getElementById("passengerPhone");

  if (!passengerName || !passengerPhone) {
    showToast("Please fill in all details and select a seat", "warning");
    return;
  }

  if (!/^[+]?[\d\s-()]{10,}$/.test(passengerPhone.value.trim())) {
    showToast("Please enter a valid phone number", "warning");
    return;
  }

  displayBookingSummary();
  showStep("payment");
  updateProgress(4);
}

function displayBookingSummary() {
  console.log("displayBookingSummary called, selectedBus:", selectedBus);
  
  const container = document.getElementById("bookingSummary");
  if (!container) return;

  const bus = selectedBus;
  
  // Validate bus object
  if (!bus) {
    console.error("Selected bus is undefined in displayBookingSummary");
    container.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--red-600);">
        <h3>Error: No bus selected</h3>
      </div>
    `;
    return;
  }

  const passengerName = document.getElementById("passengerName").value;
  const passengerPhone = document.getElementById("passengerPhone").value;

  // Extract values from both DTO and entity formats
  const busNumber = bus.busNumber || bus.bus?.busNumber;
  const fromLocationName = bus.fromLocationName || bus.route?.fromLocation?.name;
  const toLocationName = bus.toLocationName || bus.route?.toLocation?.name;
  const fare = bus.fare;

  console.log("Booking summary details:", {
    busNumber, fromLocationName, toLocationName, fare, passengerName, passengerPhone
  });

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
                <span style="font-weight: 500; color: var(--gray-900);">${busNumber || 'N/A'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
                <span style="color: var(--gray-600);">Route</span>
                <span style="font-weight: 500; color: var(--gray-900);">${fromLocationName || 'N/A'} → ${toLocationName || 'N/A'}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--gray-200);">
                <span style="color: var(--gray-600);">Seat</span>
                <span style="font-weight: 500; color: var(--gray-900);">Seat ${selectedSeat}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid var(--gray-300); margin-top: 16px;">
                <span style="font-size: 18px; font-weight: 600; color: var(--gray-900);">Total Amount</span>
                <span style="font-size: 24px; font-weight: 800; color: var(--primary-color);">₹${fare || '0'}</span>
            </div>
        </div>
    `;
}

function selectPaymentMethod(option) {
  document.querySelectorAll(".payment-option").forEach((opt) => {
    opt.classList.remove("selected");
  });
  option.classList.add("selected");

  const radio = option.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
}

async function processPayment() {
  const upiIdElement = document.getElementById("upiId");
  if (!upiIdElement) {
    showToast("UPI ID input not found", "error");
    return;
  }

  const upiId = upiIdElement.value.trim();

  if (!upiId) {
    showToast("Please enter your UPI ID", "warning");
    return;
  }

  if (!/^[\w.-]+@[\w.-]+$/.test(upiId)) {
    showToast("Please enter a valid UPI ID", "warning");
    return;
  }

  try {
    showLoading(
      true,
      "Processing payment...",
      "Please wait while we process your payment"
    );

    // Ensure selectedBus exists
    if (!selectedBus) {
      console.error("No bus selected for payment");
      showToast("Please select a bus first", "error");
      showLoading(false);
      return;
    }

    console.log("Processing payment with selectedBus:", selectedBus);

    // Create booking locally (backend not available)
    // Extract values from both DTO and entity formats
    const busNumber = selectedBus.busNumber || selectedBus.bus?.busNumber;
    const fromLocationName = selectedBus.fromLocationName || selectedBus.route?.fromLocation?.name;
    const toLocationName = selectedBus.toLocationName || selectedBus.route?.toLocation?.name;
    const fare = selectedBus.fare;
    
    const bookingData = {
      bookingId: "SF" + Date.now(),
      bookingReference: "SF" + Date.now(),
      passenger: {
        name: document.getElementById("passengerName").value,
        phone: document.getElementById("passengerPhone").value
      },
      source: fromLocationName,
      destination: toLocationName,
      busNumber: busNumber,
      seatNumber: `A${selectedSeat}`,
      fare: fare,
      date: travelDate,
      time: new Date().toLocaleTimeString(),
      bookingStatus: "CONFIRMED"
    };

    // Simulate successful booking creation
    currentBooking = bookingData;
    console.log("Local booking created:", currentBooking);
    
    // Store booking in localStorage for downloadTicket function
    localStorage.setItem("booking", JSON.stringify(currentBooking));
    console.log("Booking stored in localStorage");

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Update payment status
    await updatePaymentStatus();

    // Show ticket
    await displayTicket();
    showStep("ticket");
    updateProgress(5);
    showToast("Payment successful! Your ticket is ready.", "success");
  } catch (error) {
    console.error("Payment error:", error);
    showToast("Payment failed: " + error.message, "error");
  } finally {
    showLoading(false);
  }
}

async function updatePaymentStatus() {
  // Update payment status locally (backend not available)
  const transactionId = "TXN" + Date.now();
  
  currentBooking.paymentStatus = "PAID";
  currentBooking.transactionId = transactionId;
  currentBooking.paymentTime = new Date().toISOString();
  
  console.log("Payment status updated locally:", currentBooking);
}

async function displayTicket() {
  console.log("displayTicket called, selectedBus:", selectedBus, "currentBooking:", currentBooking);
  
  const ticketBody = document.getElementById("ticketBody");
  if (!ticketBody) return;

  const bus = selectedBus;
  const booking = currentBooking;

  // Validate booking object
  if (!booking) {
    console.error("Booking data missing in displayTicket");
    ticketBody.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--red-600);">
        <h3>Error: Booking data missing</h3>
      </div>
    `;
    return;
  }

  // Validate bus object
  if (!bus) {
    console.error("Bus data missing in displayTicket");
    ticketBody.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--red-600);">
        <h3>Error: Bus data missing</h3>
      </div>
    `;
    return;
  }

  // Extract values from both DTO and entity formats
  const busNumber = bus.busNumber || bus.bus?.busNumber;
  const operatorName = bus.operatorName || bus.bus?.operatorName;
  const fromLocationName = bus.fromLocationName || bus.route?.fromLocation?.name;
  const toLocationName = bus.toLocationName || bus.route?.toLocation?.name;
  const fare = booking.fare || booking.fareAmount || bus.fare;
  const scheduleDate = bus.scheduleDate || travelDate;

  console.log("Ticket display details:", {
    busNumber, operatorName, fromLocationName, toLocationName, fare, scheduleDate
  });

  ticketBody.innerHTML = `
        <div class="ticket-row">
            <span class="ticket-label">Booking Reference:</span>
            <span class="ticket-value">${booking.bookingReference || 'N/A'}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Passenger:</span>
            <span class="ticket-value">${booking.passenger ? booking.passenger.name : 'Passenger'}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Phone:</span>
            <span class="ticket-value">${booking.passenger ? booking.passenger.phone : 'N/A'}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Route:</span>
            <span class="ticket-value">${fromLocationName || 'N/A'} → ${toLocationName || 'N/A'}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Bus:</span>
            <span class="ticket-value">${operatorName || 'N/A'} (${busNumber || 'N/A'})</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Seat:</span>
            <span class="ticket-value">${booking.seatNumber || 'N/A'}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Date:</span>
            <span class="ticket-value">${scheduleDate || 'N/A'}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Time:</span>
            <span class="ticket-value">${formatTime(bus.departureTime) || 'N/A'}</span>
        </div>
        <div class="ticket-row">
            <span class="ticket-label">Fare:</span>
            <span class="ticket-value">₹${fare || '0'}</span>
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
    // Generate QR code locally (backend not available)
    const qrData = {
      qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`,
      bookingReference: currentBooking.bookingId
    };

    const qrContainer = document.getElementById("ticketQR");
    if (qrContainer) {
      qrContainer.innerHTML = `
                <h4>Scan QR Code</h4>
                <img src="${qrData.qrCode}" alt="Ticket QR Code">
                <p style="font-size: 0.8rem; color: #666; margin-top: 10px;">
                    Booking ID: ${qrData.bookingReference}
                </p>
            `;
    }
  } catch (error) {
    console.error("Error loading QR code:", error);
  }
}

async function downloadTicket() {
  console.log("downloadTicket called, currentBooking:", currentBooking, "selectedBus:", selectedBus);
  
  // Validate booking data
  if (!currentBooking) {
    // Try to get booking from localStorage
    const storedBooking = localStorage.getItem("booking");
    if (storedBooking) {
      try {
        currentBooking = JSON.parse(storedBooking);
        console.log("Retrieved booking from localStorage:", currentBooking);
      } catch (error) {
        console.error("Failed to parse stored booking:", error);
        showToast("Booking data not found", "error");
        return;
      }
    } else {
      showToast("No ticket data available", "error");
      return;
    }
  }

  // Validate bus data
  if (!selectedBus) {
    showToast("Bus data not available", "error");
    return;
  }

  // Extract values from both DTO and entity formats
  const busNumber = selectedBus.busNumber || selectedBus.bus?.busNumber;
  const fromLocationName = selectedBus.fromLocationName || selectedBus.route?.fromLocation?.name;
  const toLocationName = selectedBus.toLocationName || selectedBus.route?.toLocation?.name;
  const fare = currentBooking.fare || currentBooking.fareAmount || selectedBus.fare;

  console.log("Download ticket details:", {
    busNumber, fromLocationName, toLocationName, fare
  });

  try {
    // Load QR code first with graceful error handling
    let qrCodeUrl = "";
    try {
      const response = await fetch(
        `${API_BASE_URL}/bookings/${currentBooking.bookingReference}/qr`
      );
      if (response.ok) {
        const qrData = await response.json();
        qrCodeUrl = qrData.qrCode;
        console.log("QR Code loaded:", qrCodeUrl);
      } else {
        throw new Error("QR code not available from backend");
      }
    } catch (error) {
      console.warn("QR Code API failed, using fallback:", error);
      // Fallback: Generate QR with verification URL
      const verificationUrl = `http://localhost:8081/api/verify.html?ref=${currentBooking.bookingReference}`;
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=png&data=${encodeURIComponent(
        verificationUrl
      )}`;
    }

    // Pre-load the QR code image to ensure it's ready
    await preloadImage(qrCodeUrl);

    console.log("Generating ticket for booking:", currentBooking.bookingReference);

    // Create a temporary container for the ticket (mobile-optimized)
    const tempContainer = document.createElement("div");
    tempContainer.style.cssText =
      "position: fixed; left: -9999px; top: -9999px; width: 375px;";
    document.body.appendChild(tempContainer);

    // Build the mobile-optimized ticket HTML
    tempContainer.innerHTML = `
      <div id="ticket-content" style="
        font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white;
        width: 375px;
        margin: 0;
        border-radius: 0;
        overflow: hidden;
      ">
        <!-- Header -->
        <div style="
          padding: 16px 20px 12px;
          text-align: center;
          background: rgba(0,0,0,0.1);
        ">
          <h1 style="margin: 0 0 4px 0; font-size: 24px; font-weight: 800; letter-spacing: 1.5px;">SMART FARE</h1>
          <p style="margin: 0; opacity: 0.9; font-size: 12px;">Bus E-Ticket</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 16px; background: white; color: #333;">
          <!-- Booking Reference -->
          <div style="text-align: center; margin-bottom: 14px;">
            <div style="
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              padding: 10px 16px;
              border-radius: 12px;
              border: 1px solid #93c5fd;
            ">
              <div style="font-size: 10px; color: #1e40af; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; font-weight: 600;">Booking ID</div>
              <div style="font-size: 16px; font-weight: 800; color: #29095c;">
               ${currentBooking.bookingReference}</div>
            </div>
          </div>

          <!-- Passenger Info -->
          <div style="margin-bottom: 14px;">
            <div style="
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-radius: 12px;
              padding: 12px;
              border-left: 3px solid #2563eb;
            ">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; font-weight: 600;">PASSENGER</div>
              <h2 style="margin: 0 0 4px 0; font-size: 18px; font-weight: 700; color: #1e293b;">${
                currentBooking.passenger.name
              }</h2>
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                ${currentBooking.passenger.phone}
              </p>
            </div>
          </div>
          
          <!-- Journey Details -->
          <div style="
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 14px;
            color: white;
          ">
            <!-- Route -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
              <div style="flex: 1;">
                <div style="font-size: 10px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">FROM</div>
                <div style="font-size: 18px; font-weight: 800;">${
                  fromLocationName || 'N/A'
                }</div>
              </div>
              
              <div style="padding: 0 12px; font-size: 20px;">→</div>
              
              <div style="flex: 1; text-align: right;">
                <div style="font-size: 10px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">TO</div>
                <div style="font-size: 18px; font-weight: 800;">${
                  toLocationName || 'N/A'
                }</div>
              </div>
            </div>
            
            <!-- Details Grid -->
            <div style="
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px;
            ">
              <div style="
                background: rgba(255,255,255,0.15);
                padding: 10px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              ">
                <div style="font-size: 9px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">BUS</div>
                <div style="font-size: 16px; font-weight: 700;">${
                  busNumber || 'N/A'
                }</div>
              </div>
              
              <div style="
                background: rgba(255,255,255,0.15);
                padding: 10px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              ">
                <div style="font-size: 9px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">SEAT</div>
                <div style="font-size: 16px; font-weight: 700;">${
                  currentBooking.seatNumber
                }</div>
              </div>
              
              <div style="
                background: rgba(255,255,255,0.15);
                padding: 10px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              ">
                <div style="font-size: 9px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">DATE</div>
                <div style="font-size: 14px; font-weight: 700;">${
                  selectedBus.scheduleDate
                }</div>
              </div>
              
              <div style="
                background: rgba(255,255,255,0.15);
                padding: 10px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
              ">
                <div style="font-size: 9px; opacity: 0.85; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 3px;">TIME</div>
                <div style="font-size: 14px; font-weight: 700;">${formatTime(
                  selectedBus.departureTime
                )}</div>
              </div>
            </div>
            
            <!-- Fare -->
            <div style="
              margin-top: 14px;
              padding: 12px;
              background: rgba(255,255,255,0.2);
              border-radius: 10px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              backdrop-filter: blur(10px);
            ">
              <div>
                <div style="font-size: 11px; opacity: 0.85; margin-bottom: 2px;">Total Fare</div>
                <div style="font-size: 26px; font-weight: 900;">₹${
                  currentBooking.fareAmount
                }</div>
              </div>
              <div style="
                background: #10b981;
                padding: 6px 14px;
                border-radius: 16px;
                font-size: 11px;
                font-weight: 700;
              ">
                ${currentBooking.paymentStatus || "PAID"}
              </div>
            </div>
          </div>
          
          <!-- QR Code Section -->
          <div style="text-align: center; margin-bottom: 12px;">
            <div style="
              background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
              padding: 14px;
              border-radius: 12px;
              border: 2px solid #93c5fd;
            ">
              <h3 style="
                margin: 0 0 10px 0;
                color: #1e40af;
                font-size: 13px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">
                Boarding Pass
              </h3>
              
              <!-- QR Code Container -->
              <div style="
                width: 160px;
                height: 160px;
                margin: 0 auto 10px;
                padding: 10px;
                background: white;
                border: 2px solid #2563eb;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(37, 99, 235, 0.15);
              ">
                <img src="${qrCodeUrl}" 
                     alt="Ticket QR Code" 
                     crossorigin="anonymous"
                     style="
                       width: 100%;
                       height: 100%;
                       object-fit: contain;
                       display: block;
                     ">
              </div>
              
              <p style="
                margin: 0;
                color: #1e40af;
                font-size: 11px;
                line-height: 1.4;
              ">
                Show this code to the conductor for boarding
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="
            text-align: center;
            color: #64748b;
            font-size: 11px;
            padding-top: 10px;
            border-top: 1px dashed #cbd5e1;
          ">
            <p style="margin: 0; font-weight: 600; color: #1e293b;">
              Thank you for choosing Smart Fare
            </p>
          </div>
        </div>
      </div>
    `;

    // Wait for ALL images to load completely (including QR code)
    await waitForImages(tempContainer);

    // Small delay to ensure rendering is complete
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate and download the image
    await generateAndDownloadImage(
      tempContainer.querySelector("#ticket-content"),
      currentBooking.bookingReference
    );

    // Cleanup
    document.body.removeChild(tempContainer);
  } catch (error) {
    console.error("Error downloading ticket:", error);
    showToast("Failed to download ticket. Please try again.", "error");
  }
}

// Helper function to preload an image
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      console.log("QR code image preloaded successfully");
      resolve(img);
    };
    img.onerror = (err) => {
      console.error("Failed to preload QR code:", err);
      reject(err);
    };
    img.src = url;
  });
}

// Helper function to wait for all images in container
function waitForImages(container) {
  return new Promise((resolve) => {
    const images = container.querySelectorAll("img");
    let loadedCount = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
      resolve();
      return;
    }

    const checkComplete = () => {
      loadedCount++;
      console.log(`Images loaded: ${loadedCount}/${totalImages}`);
      if (loadedCount === totalImages) {
        resolve();
      }
    };

    images.forEach((img, index) => {
      if (img.complete && img.naturalHeight !== 0) {
        console.log(`Image ${index} already loaded`);
        checkComplete();
      } else {
        img.onload = () => {
          console.log(`Image ${index} loaded successfully`);
          checkComplete();
        };
        img.onerror = () => {
          console.error(`Image ${index} failed to load`);
          checkComplete(); // Continue even if image fails
        };
      }
    });
  });
}

// Helper function to generate and download image
async function generateAndDownloadImage(element, bookingRef) {
  return new Promise((resolve, reject) => {
    // Load html2canvas if not already available
    if (typeof html2canvas === "undefined") {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = () => {
        generateImage(element, bookingRef).then(resolve).catch(reject);
      };
      script.onerror = () => reject(new Error("Failed to load html2canvas"));
      document.head.appendChild(script);
    } else {
      generateImage(element, bookingRef).then(resolve).catch(reject);
    }
  });

  async function generateImage(element, ref) {
    try {
      console.log("Starting image generation...");

      // Create a canvas with high quality
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution for mobile
        backgroundColor: "#ffffff",
        useCORS: true, // Allow cross-origin images
        allowTaint: false, // Strict CORS
        logging: true, // Enable logging for debugging
        imageTimeout: 30000, // 30 second timeout
        removeContainer: false,
        foreignObjectRendering: false, // Better compatibility
        onclone: (clonedDoc, clonedElement) => {
          // Ensure proper styling in cloned document
          clonedElement.style.transform = "none";
          clonedElement.style.position = "static";
          clonedElement.style.left = "0";
          clonedElement.style.top = "0";

          // Ensure all images in cloned element are visible
          const imgs = clonedElement.querySelectorAll("img");
          imgs.forEach((img) => {
            img.style.display = "block";
            img.style.visibility = "visible";
          });
        },
      });

      console.log("Canvas created successfully");

      // Convert to data URL
      const dataUrl = canvas.toDataURL("image/png", 1.0);

      // Create download link
      const link = document.createElement("a");
      link.download = `SmartFare-Ticket-${ref}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast("🎫 Ticket downloaded successfully!");
      return Promise.resolve();
    } catch (error) {
      console.error("Image generation failed:", error);
      showToast("Failed to generate ticket image. Please try again.", "error");
      return Promise.reject(error);
    }
  }
}

function shareTicket() {
  if (!currentBooking || !selectedBus) {
    showToast("No ticket data available", "error");
    return;
  }

  if (navigator.share) {
    navigator
      .share({
        title: "Smart Fare Bus Ticket",
        text: `My bus ticket: ${currentBooking.bookingReference}\nBus: ${selectedBus.bus.busNumber}\nSeat: ${currentBooking.seatNumber}`,
        url: window.location.href,
      })
      .then(() => {
        showToast("Ticket shared successfully");
      })
      .catch((error) => {
        console.error("Error sharing:", error);
        fallbackShare();
      });
  } else {
    fallbackShare();
  }
}

function fallbackShare() {
  if (!currentBooking || !selectedBus) return;

  const shareText = `Smart Fare Bus Ticket\n\nBooking: ${currentBooking.bookingReference}\nBus: ${SafeAccess.getBusNumber(selectedBus)}\nSeat: ${currentBooking.seatNumber}\nRoute: ${SafeAccess.getFromLocation(selectedBus)} → ${SafeAccess.getToLocation(selectedBus)}`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareText).then(() => {
      showToast("Ticket details copied to clipboard");
    });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = shareText;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showToast("Ticket details copied to clipboard");
  }
}

// Utility Functions
function showStep(stepName) {
  // Hide all steps
  Object.values(steps).forEach((step) => {
    if (step) step.classList.remove("active");
  });

  // Show selected step
  if (steps[stepName]) {
    steps[stepName].classList.add("active");
  } else {
    console.warn(`Step '${stepName}' not found`);
  }

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showLoading(
  show,
  title = "Processing...",
  message = "Please wait while we process your request"
) {
  const loadingOverlay = document.getElementById("loading");
  const loadingTitle = document.getElementById("loadingTitle");
  const loadingMessage = document.getElementById("loadingMessage");

  if (!loadingOverlay) {
    console.warn("Loading overlay not found");
    return;
  }

  if (show) {
    if (loadingTitle) loadingTitle.textContent = title;
    if (loadingMessage) loadingMessage.textContent = message;
    loadingOverlay.classList.remove("hidden");
  } else {
    loadingOverlay.classList.add("hidden");
  }
}

function resetApp() {
  selectedBus = null;
  currentBooking = null;
  selectedSeat = null;

  // Clear form fields with null checks
  const fromLocation = document.getElementById("fromLocation");
  if (fromLocation) fromLocation.value = "";

  const toLocation = document.getElementById("toLocation");
  if (toLocation) toLocation.value = "";

  const travelDate = document.getElementById("travelDate");
  if (travelDate) travelDate.value = new Date().toISOString().split("T")[0];

  const passengerName = document.getElementById("passengerName");
  if (passengerName) passengerName.value = "";

  const passengerPhone = document.getElementById("passengerPhone");
  if (passengerPhone) passengerPhone.value = "";

  const upiId = document.getElementById("upiId");
  if (upiId) upiId.value = "";

  // Clear results with null checks
  const busResults = document.getElementById("busResults");
  if (busResults) busResults.innerHTML = "";

  const selectedBusInfo = document.getElementById("selectedBusInfo");
  if (selectedBusInfo) selectedBusInfo.innerHTML = "";

  const bookingSummary = document.getElementById("bookingSummary");
  if (bookingSummary) bookingSummary.innerHTML = "";

  const ticketBody = document.getElementById("ticketBody");
  if (ticketBody) ticketBody.innerHTML = "";

  const ticketQR = document.getElementById("ticketQR");
  if (ticketQR) ticketQR.innerHTML = "";
}

// Add CSS animation for slideOutRight
const style = document.createElement("style");
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
