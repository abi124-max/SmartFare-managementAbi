import firebase_admin
from firebase_admin import credentials, db
import json

# Try both Firebase configurations
firebase_configs = [
    {
        "name": "Main Project",
        "databaseURL": "https://smartbusai-bf6c1-default-rtdb.asia-southeast1.firebasedatabase.app/"
    },
    {
        "name": "Sample Project", 
        "databaseURL": "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com"
    }
]

for config in firebase_configs:
    print(f"\n🔥 Checking {config['name']}...")
    print("=" * 40)
    
    try:
        # Reset Firebase app if already initialized
        if len(firebase_admin.get_apps()) > 0:
            firebase_admin.delete_app(firebase_admin.get_apps()[0])
        
        cred = credentials.Certificate("serviceAccountKey.json")
        app = firebase_admin.initialize_app(cred, {
            "databaseURL": config["databaseURL"]
        })
        
        # Get bus_stops data
        ref = db.reference("bus_stops")
        data = ref.get()
        
        print(f"✅ Connected to {config['name']}")
        print(f"📊 Bus Stop Data:")
        
        if data:
            for stop, count in data.items():
                print(f"  📍 {stop}: {count} passengers")
        else:
            print("  📭 No data found yet")
            
        print(f"\n🌐 Console URL: {config['databaseURL']}")
        break  # Stop if successful
        
    except Exception as e:
        print(f"❌ Failed to connect to {config['name']}: {e}")
        continue

print("\n" + "=" * 40)
print("💡 To view Firebase in browser:")
print("1. Go to: https://console.firebase.google.com/")
print("2. Select your project")
print("3. Go to Firestore Database or Realtime Database")
print("4. Look for 'bus_stops' collection")
