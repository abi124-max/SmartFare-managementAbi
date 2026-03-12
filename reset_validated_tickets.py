import requests

# Reset validated tickets counter by setting ticket_distribution to 0
firebase_url = "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/bus_stops/stop1.json"

# Reset data
reset_data = {
    "location": "Koyambedu",
    "count": 1,  # Keep current AI count
    "ticket_distribution": 0,  # Reset to 0
    "status": "unchecked",
    "last_updated": "2026-03-12T11:51:00.000Z"
}

# Update Firebase
response = requests.put(firebase_url, json=reset_data)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
print("✅ Validated tickets counter reset to 0")
print("🎫 Now scan tickets to increment validated tickets count!")
