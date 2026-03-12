import requests
import json

# Firebase URL
firebase_url = "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/bus_stops/stop1.json"

# Get current data
response = requests.get(firebase_url)
current_data = response.json()
print(f"Current Firebase data: {current_data}")

# Update ticket distribution
new_ticket_dist = (current_data.get('ticket_distribution', 0) or 0) + 1
new_count = current_data.get('count', 0) or 0

# Updated data
updated_data = {
    "location": "Koyambedu",
    "count": new_count,
    "ticket_distribution": new_ticket_dist,
    "status": "checked" if new_count == new_ticket_dist else "unchecked",
    "last_updated": "2026-03-12T11:00:00.000Z"
}

# Update Firebase
response = requests.put(firebase_url, json=updated_data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
print(f"Updated ticket distribution to: {new_ticket_dist}")
print("Ticket scan test completed!")
