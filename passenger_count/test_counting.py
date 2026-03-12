import cv2
from ultralytics import YOLO
import firebase_admin
from firebase_admin import credentials, db

# Firebase initialize
cred = credentials.Certificate("serviceAccountKey.json")

firebase_admin.initialize_app(cred, {
    "databaseURL": "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com/"
})

BUS_STOP_NAME = "stop1"

def update_count(bus_stop, count):
    try:
        ref = db.reference("bus_stops")
        ref.update({
            bus_stop: count
        })
        print(f"🔥 Firebase updated: {bus_stop} = {count}")
    except Exception as e:
        print(f"❌ Firebase update failed: {e}")

model = YOLO("yolov8n.pt")
cap = cv2.VideoCapture(0)

if not cap.isOpened():
    print("❌ Error: Cannot open camera")
    exit()

print("✅ Camera opened successfully")
print("📋 INSTRUCTIONS:")
print("   - Walk across the RED line in ANY direction")
print("   - Both LEFT→RIGHT and RIGHT→LEFT crossings count")
print("   - Press 'q' to quit")
print("   - Press 'r' to reset count")
print()

# Get first frame to determine dimensions
ret, first_frame = cap.read()
if not ret:
    print("❌ Error: Cannot read from camera")
    exit()

# Vertical line position (middle of frame)
ENTRY_LINE_X = first_frame.shape[1] // 2

# Track people crossing the line
tracked_people = {}
next_person_id = 0
passenger_count = 0
DISAPPEAR_THRESHOLD = 30

# Initialize Firebase
update_count(BUS_STOP_NAME, passenger_count)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model(frame, verbose=False)
    
    # Draw vertical counting line with labels
    cv2.line(frame, (ENTRY_LINE_X, 0), (ENTRY_LINE_X, frame.shape[0]), (0, 0, 255), 3)
    
    # Draw side labels
    cv2.putText(frame, "SIDE A", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
    cv2.putText(frame, "Cross line →", (50, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
    cv2.putText(frame, "ENTRY LINE", (ENTRY_LINE_X - 60, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    cv2.putText(frame, "SIDE B", (ENTRY_LINE_X + 50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
    cv2.putText(frame, "← Cross line", (ENTRY_LINE_X + 50, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
    
    current_detections = []
    
    # Detect people in current frame
    for r in results:
        for box in r.boxes:
            if int(box.cls[0]) == 0 and box.conf[0] > 0.5:  # Person class
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                cx = (x1 + x2) // 2
                cy = (y1 + y2) // 2
                current_detections.append({"bbox": (x1, y1, x2, y2), "centroid": (cx, cy)})
    
    # Match detections with tracked people
    matched_ids = set()
    for detection in current_detections:
        cx, cy = detection["centroid"]
        x1, y1, x2, y2 = detection["bbox"]
        
        # Find closest tracked person
        best_match_id = None
        min_distance = 100
        
        for person_id, person_data in tracked_people.items():
            if person_id in matched_ids:
                continue
            prev_cx, prev_cy = person_data["centroid"]
            distance = ((cx - prev_cx)**2 + (cy - prev_cy)**2)**0.5
            
            if distance < min_distance:
                min_distance = distance
                best_match_id = person_id
        
        # Update or create new tracked person
        if best_match_id is not None:
            # Update existing person
            prev_cx, _ = tracked_people[best_match_id]["centroid"]
            prev_side = tracked_people[best_match_id]["side"]
            
            tracked_people[best_match_id]["centroid"] = (cx, cy)
            tracked_people[best_match_id]["frame_count"] = 0
            matched_ids.add(best_match_id)
            
            # Determine current side
            current_side = "left" if cx < ENTRY_LINE_X else "right"
            tracked_people[best_match_id]["side"] = current_side
            
            # Check if person crossed the line (any direction) ONLY ONCE
            if not tracked_people[best_match_id]["crossed"]:
                # Check if person crossed from either side
                if (prev_side == "left" and current_side == "right") or (prev_side == "right" and current_side == "left"):
                    tracked_people[best_match_id]["crossed"] = True
                    passenger_count += 1
                    update_count(BUS_STOP_NAME, passenger_count)
                    print(f"🎯 PERSON COUNTED! Total: {passenger_count} (Crossed {prev_side}→{current_side})")
            
            # Draw bounding box
            color = (0, 255, 0) if tracked_people[best_match_id]["crossed"] else (255, 255, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.circle(frame, (cx, cy), 8, color, -1)
            
            status = "✅ COUNTED" if tracked_people[best_match_id]["crossed"] else f"👤 TRACKING ({current_side})"
            cv2.putText(frame, status, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        else:
            # New person detected
            initial_side = "left" if cx < ENTRY_LINE_X else "right"
            tracked_people[next_person_id] = {
                "centroid": (cx, cy),
                "crossed": False,
                "side": initial_side,
                "frame_count": 0
            }
            matched_ids.add(next_person_id)
            next_person_id += 1
            
            # Draw bounding box for new person
            cv2.rectangle(frame, (x1, y1), (x2, y2), (255, 255, 0), 2)
            cv2.circle(frame, (cx, cy), 8, (255, 255, 0), -1)
            cv2.putText(frame, f"🆕 NEW ({initial_side})", (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    
    # Increment frame count for unmatched people and remove if disappeared too long
    for person_id in list(tracked_people.keys()):
        if person_id not in matched_ids:
            tracked_people[person_id]["frame_count"] += 1
            if tracked_people[person_id]["frame_count"] > DISAPPEAR_THRESHOLD:
                del tracked_people[person_id]
    
    # Display info
    cv2.putText(frame, f"🚌 {BUS_STOP_NAME}: {passenger_count} passengers", (20, frame.shape[0] - 60),
                cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 255, 0), 3)
    cv2.putText(frame, f"👥 Tracking: {len(tracked_people)} people", (20, frame.shape[0] - 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    cv2.imshow("🚌 Bus Entry Counter - TEST MODE", frame)

    key = cv2.waitKey(1) & 0xFF
    if key == ord('q'):
        break
    elif key == ord('r'):
        passenger_count = 0
        tracked_people.clear()
        update_count(BUS_STOP_NAME, passenger_count)
        print("🔄 Count reset!")

cap.release()
cv2.destroyAllWindows()
print("👋 AI Counter stopped")
