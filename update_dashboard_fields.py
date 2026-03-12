import requests
import json

# Firebase URL
firebase_url = "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/bus_stops/stop1.json"

# Get current data
response = requests.get(firebase_url)
current_data = response.json()
print(f"Current Firebase data: {current_data}")

# Update with current validated tickets count (assuming you validated 3 tickets)
current_count = current_data.get('count', 0) or 0
validated_tickets = 3  # Set to match your validated tickets

# Updated data
updated_data = {
    "location": "Koyambedu",
    "count": current_count,
    "ticket_distribution": validated_tickets,  # This should show in Tickets field
    "status": "checked" if current_count == validated_tickets else "unchecked",
    "last_updated": "2026-03-12T14:02:00.000Z"
}

# Update Firebase
response = requests.put(firebase_url, json=updated_data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
print(f"✅ Updated Tickets field to: {validated_tickets}")
print("📊 Dashboard should now show:")
print(f"   Headcount: {current_count}")
print(f"   Tickets: {validated_tickets}")
print(f"   Discrepancy: {abs(current_count - validated_tickets)}")
