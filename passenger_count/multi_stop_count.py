import cv2
from ultralytics import YOLO
import firebase_admin
from firebase_admin import credentials, db
import time

# Firebase initialize
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/"
})

# Multi-stop configuration
BUS_STOPS = {
    "stop1": {
        "name": "Koyambedu",
        "count": 0,
        "entry_line_x": 213,  # 1/3 of frame
        "color": (0, 255, 0),  # Green
    },
    "stop2": {
        "name": "Tambaram", 
        "count": 0,
        "entry_line_x": 426,  # 2/3 of frame
        "color": (0, 0, 255)  # Red
    }
}

def update_multiple_counts():
    """Update all bus stop counts in Firebase"""
    try:
        ref = db.reference("bus_stops")
        updates = {}
        for stop_id, stop_info in BUS_STOPS.items():
            updates[stop_id] = stop_info["count"]
            print(f"📊 {stop_info['name']}: {stop_info['count']} passengers")
        
        ref.update(updates)
        print("✅ Firebase updated for all stops")
        return True
    except Exception as e:
        print(f"❌ Firebase update failed: {e}")
        return False

# Initialize YOLO
model = YOLO("yolov8n.pt")
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Error: Cannot open camera")
    exit()

print("📹 Camera opened successfully")
print("🎯 Multi-Stop AI Counting System")
print("=" * 50)
for stop_id, stop_info in BUS_STOPS.items():
    print(f"📍 {stop_id}: {stop_info['name']} (Line at X={stop_info['entry_line_x']})")
print("=" * 50)
print("Press 'q' to quit")

# Get frame dimensions
ret, first_frame = cap.read()
if not ret:
    print("❌ Error: Cannot read from camera")
    exit()

frame_height, frame_width = first_frame.shape[:2]

# Tracking system
tracked_people = {}  # {person_id: {"centroid": (x,y), "crossed_lines": set(), "frame_count": 0}}
next_person_id = 0
DISAPPEAR_THRESHOLD = 30
last_firebase_update = time.time()
FIREBASE_UPDATE_INTERVAL = 5  # Update Firebase every 5 seconds

def get_person_side(x_pos, line_x):
    """Determine which side of the line a person is on"""
    return "left" if x_pos < line_x else "right"

def check_line_crossing(person_id, old_x, new_x, line_x):
    """Check if person crossed the line from left to right"""
    old_side = get_person_side(old_x, line_x)
    new_side = get_person_side(new_x, line_x)
    
    return old_side == "left" and new_side == "right"

print("🚀 Starting detection...")

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    # Draw entry lines for all stops
    for stop_id, stop_info in BUS_STOPS.items():
        cv2.line(frame, (stop_info["entry_line_x"], 0), 
                (stop_info["entry_line_x"], frame_height), 
                stop_info["color"], 2)
        cv2.putText(frame, f"{stop_info['name']}", 
                   (stop_info["entry_line_x"] - 50, 30),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, stop_info["color"], 2)
    
    # Run YOLO detection
    results = model(frame, verbose=False)
    
    current_positions = {}
    
    # Process detections
    for result in results:
        boxes = result.boxes
        for box in boxes:
            if box.cls == 0:  # Person class
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = box.conf[0].cpu().numpy()
                
                if conf > 0.5:
                    center_x = int((x1 + x2) / 2)
                    center_y = int((y1 + y2) / 2)
                    
                    current_positions[center_x] = (center_x, center_y)
    
    # Update tracking
    for person_id, person_data in list(tracked_people.items()):
        person_data["frame_count"] += 1
        if person_data["frame_count"] > DISAPPEAR_THRESHOLD:
            del tracked_people[person_id]
    
    # Match current positions to tracked people
    matched_positions = set()
    for person_id, person_data in tracked_people.items():
        last_x, last_y = person_data["centroid"]
        
        # Find closest current position
        min_dist = float('inf')
        best_match = None
        for curr_x, curr_pos in current_positions.items():
            if curr_x not in matched_positions:
                dist = abs(last_x - curr_x)
                if dist < 100 and dist < min_dist:  # Within 100 pixels
                    min_dist = dist
                    best_match = curr_x
        
        if best_match is not None:
            # Check line crossings for all stops
            for stop_id, stop_info in BUS_STOPS.items():
                if stop_id not in person_data["crossed_lines"]:
                    if check_line_crossing(person_id, last_x, best_match, stop_info["entry_line_x"]):
                        person_data["crossed_lines"].add(stop_id)
                        BUS_STOPS[stop_id]["count"] += 1
                        print(f"✅ {stop_info['name']} count: {BUS_STOPS[stop_id]['count']}")
            
            person_data["centroid"] = current_positions[best_match]
            matched_positions.add(best_match)
            person_data["frame_count"] = 0
        else:
            person_data["frame_count"] += 1
    
    # Add new people
    for curr_x, curr_pos in current_positions.items():
        if curr_x not in matched_positions:
            tracked_people[next_person_id] = {
                "centroid": curr_pos,
                "crossed_lines": set(),
                "frame_count": 0
            }
            next_person_id += 1
    
    # Draw bounding boxes and tracking info
    for result in results:
        boxes = result.boxes
        for box in boxes:
            if box.cls == 0:  # Person class
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                conf = box.conf[0].cpu().numpy()
                
                if conf > 0.5:
                    center_x = int((x1 + x2) / 2)
                    center_y = int((y1 + y2) / 2)
                    
                    # Find if this person is being tracked
                    is_tracked = False
                    crossed_stops = []
                    for person_id, person_data in tracked_people.items():
                        if abs(person_data["centroid"][0] - center_x) < 50:
                            is_tracked = True
                            crossed_stops = list(person_data["crossed_lines"])
                            break
                    
                    # Determine color based on crossed stops
                    if crossed_stops:
                        color = BUS_STOPS[crossed_stops[0]]["color"]
                        label = f"Counted ({BUS_STOPS[crossed_stops[0]]['name']})"
                    else:
                        color = (0, 255, 255)  # Yellow for uncounted
                        label = f"Tracking"
                    
                    cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
                    cv2.putText(frame, label, (int(x1), int(y1) - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    
    # Update Firebase periodically
    current_time = time.time()
    if current_time - last_firebase_update > FIREBASE_UPDATE_INTERVAL:
        update_multiple_counts()
        last_firebase_update = current_time
    
    # Display counts on screen
    y_offset = 60
    for stop_id, stop_info in BUS_STOPS.items():
        cv2.putText(frame, f"{stop_info['name']}: {stop_info['count']}", 
                   (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.7, 
                   stop_info["color"], 2)
        y_offset += 30
    
    cv2.imshow('Multi-Stop Passenger Counting', frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Final Firebase update
update_multiple_counts()

cap.release()
cv2.destroyAllWindows()
print("👋 AI Counting system stopped")
