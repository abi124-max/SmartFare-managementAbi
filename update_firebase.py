import requests
import json

# Firebase URL
firebase_url = "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/bus_stops/stop1.json"

# Data to update
data = {
    "location": "Koyambedu",
    "count": 4,
    "ticket_distribution": 2,
    "status": "unchecked",
    "last_updated": "2026-03-12T10:20:00.000Z"
}

# Update Firebase
response = requests.put(firebase_url, json=data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
print("Firebase updated successfully!")
