# Bus Entry Counter

Real-time passenger counting system using YOLOv8 and Firebase. Tracks people crossing a vertical line to count bus entries.

## Features

- Detects people using YOLOv8
- Counts passengers crossing entry line (left to right)
- Prevents duplicate counting if person crosses back and forth
- Stores count in Firebase with bus stop name
- Real-time video display with tracking visualization

## Requirements

```bash
pip install ultralytics opencv-python firebase-admin
```

## Setup

1. Place `yolov8n.pt` model file in the project directory
2. Add your `serviceAccountKey.json` Firebase credentials
3. Update Firebase database URL in the code (line 8)
4. Set your bus stop name (line 12): `BUS_STOP_NAME = "Chennai"`

## Usage

```bash
python bus_entry_line_count.py
```

Press `q` to quit

## How It Works

- Red vertical line in the middle of the frame = entry line
- Yellow box = person being tracked
- Green box = person already counted
- Only counts when person crosses from left to right
- Once counted, won't count again even if they cross back

## Firebase Structure

```
bus_stops/
  Chennai: 20
  Mumbai: 15
```

## Configuration

- `ENTRY_LINE_X`: Position of counting line (default: middle of frame)
- `BUS_STOP_NAME`: Name of the bus stop
- Confidence threshold: 0.5 (line 62)
- Tracking distance: 100 pixels (line 71)
