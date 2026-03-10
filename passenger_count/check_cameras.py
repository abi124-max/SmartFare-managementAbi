import cv2
import time

print("Checking available cameras...")
print("=" * 40)

for i in range(5):
    cap = cv2.VideoCapture(i)
    if cap.isOpened():
        ret, frame = cap.read()
        if ret:
            print(f"✅ Camera {i}: Available - Resolution: {frame.shape[1]}x{frame.shape[0]}")
        else:
            print(f"❌ Camera {i}: Connected but no frame")
        cap.release()
    else:
        print(f"❌ Camera {i}: Not available")
    time.sleep(0.1)

print("=" * 40)
print("If no cameras are available, you may need to:")
print("1. Connect a webcam")
print("2. Check camera permissions")
print("3. Install camera drivers")
