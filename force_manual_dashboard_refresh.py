import requests
import json

# Force update Firebase with current AI count to trigger dashboard refresh
firebase_url = "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/bus_stops/stop1.json"

# Get current data
response = requests.get(firebase_url)
current_data = response.json()
print(f"Current Firebase data: {current_data}")

# Update with current AI count (3) and tickets (0)
updated_data = {
    "location": "Koyambedu",
    "count": 3,  # Current AI count
    "ticket_distribution": 0,  # Current tickets
    "status": "unchecked",
    "last_updated": "2026-03-12T12:27:00.000Z"  # New timestamp
}

# Update Firebase
response = requests.put(firebase_url, json=updated_data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
print("✅ Firebase updated with current AI count (3)")
print("📊 Dashboard should show: Headcount=3, Tickets=0, Discrepancy=3")
print("🔄 Refresh conductor app to see updated data!")
