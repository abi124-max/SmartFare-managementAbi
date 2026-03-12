import requests
import json

# Force update Firebase to trigger conductor app refresh
firebase_url = "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/bus_stops/stop1.json"

# Get current data
response = requests.get(firebase_url)
current_data = response.json()
print(f"Current Firebase data: {current_data}")

# Force update with new timestamp to trigger refresh
current_count = current_data.get('count', 0) or 0
current_tickets = current_data.get('ticket_distribution', 0) or 0

# Updated data with new timestamp
updated_data = {
    "location": "Koyambedu",
    "count": current_count,
    "ticket_distribution": current_tickets,
    "status": "checked" if current_count == current_tickets else "unchecked",
    "last_updated": "2026-03-12T12:12:00.000Z"  # New timestamp to trigger refresh
}

# Update Firebase
response = requests.put(firebase_url, json=updated_data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
print("✅ Firebase updated with new timestamp to trigger conductor app refresh")
print(f"📊 Current data: count={current_count}, tickets={current_tickets}")
