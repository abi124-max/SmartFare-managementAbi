import firebase_admin
from firebase_admin import credentials, db
import json

# Initialize Firebase
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred, {
        "databaseURL": "https://smartbusai-bf6c1-default-rtdb.asia-southeast1.firebasedatabase.app/"
    })
    
    # Get reference to bus_stops
    ref = db.reference("bus_stops")
    data = ref.get()
    
    print("🔥 Firebase Database Contents")
    print("=" * 40)
    print(f"📊 Bus Stop Data:")
    
    if data:
        for stop, count in data.items():
            print(f"  📍 {stop}: {count} passengers")
    else:
        print("  📭 No data found yet")
        print("  🚀 AI counting system needs to detect passengers first")
    
    print("=" * 40)
    print("🌐 Firebase Console URL:")
    print("https://console.firebase.google.com/project/smartbusai-bf6c1/database/smartbusai-bf6c1-default-rtdb/data/")
    
except Exception as e:
    print(f"❌ Error accessing Firebase: {e}")
    print("📝 Make sure serviceAccountKey.json is valid")
