import firebase_admin
from firebase_admin import credentials, db

# Check current Firebase structure
cred = credentials.Certificate("serviceAccountKey.json")
app = firebase_admin.initialize_app(cred, {
    "databaseURL": "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/"
})

print("🔍 Checking current Firebase structure...")
print("=" * 50)

# Check bus_stops structure
ref = db.reference("bus_stops")
data = ref.get()

print("📊 Current bus_stops data:")
if data:
    for key, value in data.items():
        print(f"  {key}: {value}")
else:
    print("  No data found in bus_stops")

print("\n" + "=" * 50)
print("🤔 What structure do you want?")
print("Option 1: {'stop1': count, 'stop2': count}")
print("Option 2: {'stop1': {'name': 'Koyambedu', 'count': count}}")
print("Option 3: {'Koyambedu': count, 'Tambaram': count}")

# Also check if there's data at root
root_ref = db.reference("")
root_data = root_ref.get()
print(f"\n🌐 Root level data keys: {list(root_data.keys()) if root_data else 'None'}")
