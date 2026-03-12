import requests
import json

# Firebase URL
firebase_url = "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/bus_stops/stop1.json"

# Get current data
response = requests.get(firebase_url)
current_data = response.json()
print(f"Current Firebase data: {current_data}")

# Update ticket distribution to test validated tickets counting
current_count = current_data.get('count', 0) or 0
new_ticket_dist = 3  # Set to 3 to test validated tickets

# Updated data
updated_data = {
    "location": "Koyambedu",
    "count": current_count,
    "ticket_distribution": new_ticket_dist,
    "status": "checked" if current_count == new_ticket_dist else "unchecked",
    "last_updated": "2026-03-12T11:44:00.000Z"
}

# Update Firebase
response = requests.put(firebase_url, json=updated_data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
print(f"Updated ticket distribution to: {new_ticket_dist}")
print("Validated tickets should now show 3 in conductor app!")
