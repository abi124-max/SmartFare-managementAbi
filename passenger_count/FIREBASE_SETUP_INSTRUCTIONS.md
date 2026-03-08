# Firebase Setup Instructions for Passenger Counting

## 🔥 Step 1: Create Firebase Project

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Create New Project**:
   - Click "Add project"
   - Project name: `smart-bus-passenger-count`
   - Click "Create project"
3. **Enable Realtime Database**:
   - Go to "Build" → "Realtime Database"
   - Click "Create Database"
   - Choose "Start in test mode"
   - Select location (choose closest to you)

## 📋 Step 2: Get Firebase Configuration

1. **Project Settings**: Click ⚙️ icon → Project Settings
2. **Web App Config**:
   - Scroll to "Your apps" section
   - Click "Web app" → "Config"
   - Copy the configuration

Your config will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "smart-bus-passenger-count.firebaseapp.com",
  databaseURL: "https://smart-bus-passenger-count-default-rtdb.firebaseio.com",
  projectId: "smart-bus-passenger-count",
  storageBucket: "smart-bus-passenger-count.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## 🔑 Step 3: Create Service Account

1. **Service Accounts**:
   - Project Settings → "Service accounts"
   - Click "Generate new private key"
2. **Create Service Account**:
   - Service account name: `firebase-admin`
   - Role: "Project → Editor"
   - Click "Continue and create key"
3. **Download Key**:
   - Choose "JSON" format
   - Click "Create"
   - Save as `serviceAccountKey.json` in passenger_count folder

## 📝 Step 4: Update Python Script

Replace the placeholders in `demo_passenger_count.py`:

```python
# Line 9-17: Replace with your actual config
FIREBASE_CONFIG = {
    "apiKey": "AIzaSyC-xxxxxxxxxxxxxxxxxxxxxxxxx",  # Replace
    "authDomain": "smart-bus-passenger-count.firebaseapp.com",  # Replace
    "databaseURL": "https://smart-bus-passenger-count-default-rtdb.firebaseio.com",  # Replace
    "projectId": "smart-bus-passenger-count",  # Replace
    "storageBucket": "smart-bus-passenger-count.appspot.com",  # Replace
    "messagingSenderId": "123456789012",  # Replace
    "appId": "1:123456789012:web:abcdef123456"  # Replace
}

# Line 20: Change bus stop name if needed
BUS_STOP_NAME = "Chennai"  # Change to your bus stop name
```

## 🚀 Step 5: Run with Real Firebase

1. **Place serviceAccountKey.json** in the passenger_count folder
2. **Update the script** with your Firebase config
3. **Run the script**:
   ```bash
   python demo_passenger_count.py
   ```

## 📊 Expected Output

When Firebase is connected, you'll see:
```
✅ Firebase connected successfully
📊 Firebase Update: bus_stops/Chennai = 1
✅ Firebase updated: Chennai = 1
```

## 🔍 Step 6: Verify in Firebase Console

1. **Go to Firebase Console**
2. **Realtime Database** → "Data"
3. **Check the structure**:
   ```
   bus_stops/
     Chennai: 1
     Mumbai: 15
   ```

## 🎯 Step 7: Connect to Conductor App

Update the conductor app to read from Firebase:
1. **Edit conductor-app/script-professional.js**
2. **Update Firebase config** with your actual config
3. **Run conductor app**: http://localhost:3001
4. **Check Dashboard** - it should show real passenger counts from Firebase

## 🐛 Troubleshooting

**Firebase Connection Issues**:
- Check `serviceAccountKey.json` is in correct folder
- Verify Firebase project ID matches
- Check database URL is correct
- Ensure service account has proper permissions

**No Camera Access**:
- Check if camera is connected
- Try different camera index (0, 1, 2...)
- Close other apps using camera

**YOLO Model Issues**:
- Ensure `yolov8n.pt` is in folder
- Check model file is not corrupted
- Verify ultralytics is installed correctly

## 📱 Mobile Testing

To test on mobile:
1. **Install Python** on mobile device
2. **Install dependencies**:
   ```bash
   pip install ultralytics opencv-python firebase-admin
   ```
3. **Copy files** to mobile device
4. **Run with mobile camera**
