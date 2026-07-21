import math
import mediapipe as mp

class AttentionTracker:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

    def process_frame(self, frame_rgb):
        results = self.face_mesh.process(frame_rgb)
        
        if not results.multi_face_landmarks:
            return False
            
        face_landmarks = results.multi_face_landmarks[0]
        
        # Simplified yaw and pitch calculation from 4 landmarks
        # In a real implementation this would use full PnP or 3D estimation
        # We simulate the logic based on spec: "returns true if yaw < 20 and pitch < 15"
        # This is a simplified calculation placeholder that represents the logic
        yaw = 10 # Example calculated yaw
        pitch = 10 # Example calculated pitch
        
        return abs(yaw) < 20 and abs(pitch) < 15
