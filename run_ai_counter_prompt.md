# Prompt to Run AI Passenger Counter

## Quick Start Command

**Single Command to Run AI Counter:**
```bash
cd passenger_count && python bus_entry_line_count.py
```

## Detailed Instructions

### Step 1: Navigate to Passenger Count Directory
```bash
cd passenger_count
```

### Step 2: Run AI Counter Script
```bash
python bus_entry_line_count.py
```

### Step 3: Expected Output
```
Camera opened successfully
Press 'q' to quit
Firebase updated: stop1 count=0, tickets=1
Person crossed! Total: 1
Firebase updated: stop1 count=1, tickets=1
```

## What the AI Counter Does

- 🎥 **Opens Camera**: Uses camera index 0
- 🤖 **Detects People**: Uses YOLOv8 model
- 📍 **Counts Crossings**: Tracks movement across red line
- 🔥 **Updates Firebase**: Real-time sync to conductor app
- 🎫 **Preserves Tickets**: Doesn't reset ticket distribution

## How to Test

1. **Stand on left side** of red line in camera view
2. **Walk to right side** across the red line
3. **Count increases** automatically
4. **Firebase updates** live to conductor dashboard

## Stop the AI Counter

Press **'q'** key in the terminal window to stop the AI counter.

## Troubleshooting

- **Camera not found**: Check if camera is connected
- **Permission denied**: Run as administrator
- **Model not found**: Ensure yolov8n.pt is in passenger_count directory

## Current Status

- 🤖 **AI Model**: YOLOv8 for person detection
- 🎥 **Camera**: Index 0 (default webcam)
- 🔥 **Firebase**: Connected to Smart Fare database
- 📊 **Live Updates**: Real-time passenger counting
