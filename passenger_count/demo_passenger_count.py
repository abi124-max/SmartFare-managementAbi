import cv2
from ultralytics import YOLO
import time
import random
import firebase_admin
from firebase_admin import credentials, db

# Firebase Configuration - Your existing project
FIREBASE_CONFIG = {
    "databaseURL": "https://sample-firebase-ai-app-208e2-default-rtdb.firebaseio.com"
}

# Bus stop configuration - Update existing stop1
BUS_STOP_NAME = "stop1"  # Update existing stop1
BUS_STOP_LOCATION = "koyambedu"  # Location for stop1
ENTRY_LINE_X = 320  # Middle of 640px frame
CONFIDENCE_THRESHOLD = 0.5
TRACKING_DISTANCE = 100

# Initialize Firebase
try:
    cred_path = r"c:\Users\Abirami H\Documents\SmartFare2.0\2.0Smartfare\passenger_count\serviceAccountKey.json"
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred, {
        "databaseURL": FIREBASE_CONFIG["databaseURL"]
    })
    print("✅ Firebase connected successfully")
    db_ref = db.reference("bus_stops")
except Exception as e:
    print(f"⚠️ Firebase connection failed: {e}")
    print("📝 Using demo mode (console output only)")
    db_ref = None

class PersonTracker:
    def __init__(self):
        self.tracked_people = {}
        self.next_id = 0
        self.counted_people = set()
        self.total_count = 0
        self.line_crossing_history = {}  # Track line crossing directions
        self.last_firebase_count = 0  # Track last Firebase update
        
    def update(self, boxes):
        current_positions = {}
        count_increased = False  # Flag for Firebase update
        
        # Update positions of detected people
        for box in boxes:
            x1, y1, x2, y2, conf, cls = box
            center_x = (x1 + x2) // 2
            center_y = (y1 + y2) // 2
            
            # Find closest tracked person
            best_match_id = None
            best_distance = float('inf')
            
            for track_id, track_pos in self.tracked_people.items():
                distance = abs(center_x - track_pos['x']) + abs(center_y - track_pos['y'])
                if distance < TRACKING_DISTANCE and distance < best_distance:
                    best_distance = distance
                    best_match_id = track_id
            
            if best_match_id is not None:
                # Existing person - update position
                current_positions[best_match_id] = {'x': center_x, 'y': center_y, 'box': box}
                
                # Check for line crossing (only for existing tracked people)
                if best_match_id not in self.counted_people:
                    previous_x = self.tracked_people[best_match_id]['x']
                    
                    # Check if person crossed the entry line from left to right
                    # Add stricter condition: must move significantly across the line
                    if previous_x <= ENTRY_LINE_X - 20 and center_x > ENTRY_LINE_X + 20:
                        # Person crossed the line from outside to inside (with buffer)
                        self.counted_people.add(best_match_id)
                        self.total_count += 1
                        self.line_crossing_history[best_match_id] = 'crossed_left_to_right'
                        count_increased = True  # Set flag for Firebase update
                        print(f"🚶 PERSON ENTERED! Total count: {self.total_count}")
                        
            else:
                # New person detected
                new_id = self.next_id
                self.next_id += 1
                current_positions[new_id] = {'x': center_x, 'y': center_y, 'box': box}
                
                # Initialize line crossing history
                self.line_crossing_history[new_id] = 'not_crossed'
                
                # Only count if they're significantly past the line when first detected
                if center_x > ENTRY_LINE_X + 30 and new_id not in self.counted_people:
                    self.counted_people.add(new_id)
                    self.total_count += 1
                    self.line_crossing_history[new_id] = 'already_crossed'
                    count_increased = True  # Set flag for Firebase update
                    print(f"🚶 PERSON DETECTED INSIDE! Total count: {self.total_count}")
        
        # Update tracked people (remove those not detected anymore)
        self.tracked_people = current_positions
        
        return count_increased  # Return True if count increased

def main():
    print("🚀 Starting YOLO Passenger Counting Demo...")
    print("📹 Press 'q' to quit")
    print(f"📍 Bus Stop: {BUS_STOP_NAME}")
    print(f"📊 Entry line at X={ENTRY_LINE_X}")
    
    # Initialize YOLO model
    try:
        model = YOLO("yolov8n.pt")
        print("✅ YOLO model loaded successfully")
    except Exception as e:
        print(f"❌ Error loading YOLO model: {e}")
        print("📥 Make sure 'yolov8n.pt' is in the same directory")
        return
    
    # Initialize camera
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("❌ Error: Cannot open camera")
        print("📹 Make sure you have a camera connected")
        return
    
    print("✅ Camera opened successfully")
    
    # Initialize tracker
    tracker = PersonTracker()
    
    # Get frame dimensions
    ret, frame = cap.read()
    if ret:
        frame_height, frame_width = frame.shape[:2]
        print(f"📐 Frame size: {frame_width}x{frame_height}")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Cannot read from camera")
            break
        
        # Run YOLO detection
        results = model(frame, conf=CONFIDENCE_THRESHOLD)
        
        # Extract person detections (class 0 = person)
        person_boxes = []
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    if box.cls == 0:  # Person class
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        conf = box.conf.cpu().numpy()[0]
                        person_boxes.append([int(x1), int(y1), int(x2), int(y2), conf, 0])
        
        # Update tracker and check if count increased
        count_increased = tracker.update(person_boxes)
        
        # Debug info
        print(f"Debug: Total count = {tracker.total_count}, Count increased = {count_increased}, Active detections = {len(person_boxes)}")
        
        # Draw entry line
        cv2.line(frame, (ENTRY_LINE_X, 0), (ENTRY_LINE_X, frame_height), (0, 0, 255), 2)
        
        # Draw detection boxes
        for box in person_boxes:
            x1, y1, x2, y2, conf, cls = box
            center_x = (x1 + x2) // 2
            
            # Find if this person is being tracked
            track_id = None
            for tid, track_pos in tracker.tracked_people.items():
                if abs(center_x - track_pos['x']) < TRACKING_DISTANCE:
                    track_id = tid
                    break
            
            # Draw box with different colors
            if track_id in tracker.counted_people:
                # Green for counted people
                color = (0, 255, 0)  # Green
                label = f"Person {track_id} (Counted)"
            else:
                # Yellow for uncounted people
                color = (0, 255, 255)  # Yellow
                label = f"Person {track_id}"
            
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Draw count and info
        cv2.putText(frame, f"Bus Stop: {BUS_STOP_NAME}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, f"Passenger Count: {tracker.total_count}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        cv2.putText(frame, f"Active Detections: {len(person_boxes)}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)
        
        # Draw entry line label
        cv2.putText(frame, "ENTRY LINE", (ENTRY_LINE_X - 50, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 1)
        
        # Show frame
        cv2.imshow('YOLO Passenger Counting', frame)
        
        # Exit on 'q' key
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        
        # Firebase update (ONLY when count increases)
        if count_increased:
            print(f"📊 Firebase Update: {BUS_STOP_NAME} - AI Count: {tracker.total_count}")
            
            # Update existing stop1 in Firebase
            if db_ref:
                try:
                    # Update with location name "koyambedu" and status "unchecked"
                    db_ref.child(BUS_STOP_NAME).update({
                        "location": "koyambedu",  # Show location name as koyambedu
                        "count": tracker.total_count,
                        "status": "unchecked"  # Set status to unchecked
                    })
                    print(f"✅ Firebase updated: {BUS_STOP_NAME}.count = {tracker.total_count}, location = koyambedu, status = unchecked")
                    
                except Exception as e:
                    print(f"❌ Firebase update failed: {e}")
                    # Try set method as fallback
                    try:
                        fallback_data = {
                            "location": "koyambedu",
                            "count": tracker.total_count,
                            "ticket_distributed": 0,
                            "status": "unchecked"
                        }
                        db_ref.child(BUS_STOP_NAME).set(fallback_data)
                        print(f"✅ Firebase set fallback: {BUS_STOP_NAME}.count = {tracker.total_count}")
                    except Exception as e2:
                        print(f"❌ Firebase fallback failed: {e2}")
            else:
                print("⚠️ Firebase not connected - using demo mode")
    
    # Cleanup
    cap.release()
    cv2.destroyAllWindows()
    print(f"✅ Final passenger count: {tracker.total_count}")
    print("🔚 Passenger counting stopped")

if __name__ == "__main__":
    main()
