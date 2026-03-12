import json

# Create sample ticket data for testing
sample_ticket_data = {
    "bookingId": "TEST123456",
    "passengerName": "Test Passenger",
    "source": "Koyambedu",
    "destination": "Tambaram",
    "busNumber": "TN09N2345",
    "fare": "35",
    "date": "2026-03-12",
    "time": "11:41:00",
    "bookingStatus": "CONFIRMED"
}

print("Sample Ticket Data for Testing:")
print(json.dumps(sample_ticket_data, indent=2))
print("\nUse this data in the conductor app scanner to test validation:")
print("1. Go to Scanner page")
print("2. Click 'Manual Entry' or use this QR data")
print("3. Click 'Validate Ticket'")
