import mediapipe as mp
import threading

class AttentionTracker:
    def __init__(self):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self._lock = threading.Lock()

    def process_frame(self, frame_rgb):
        with self._lock:
            results = self.face_mesh.process(frame_rgb)
        
        if not results.multi_face_landmarks:
            return {
                'available': False,
                'attention': 0.0,
                'attentive': False,
                'yaw': 0.0,
                'pitch': 0.0,
            }
            
        landmarks = results.multi_face_landmarks[0].landmark
        nose = landmarks[1]
        left_cheek = landmarks[234]
        right_cheek = landmarks[454]
        forehead = landmarks[10]
        chin = landmarks[152]

        face_width = max(abs(right_cheek.x - left_cheek.x), 1e-6)
        face_height = max(abs(chin.y - forehead.y), 1e-6)
        face_mid_x = (left_cheek.x + right_cheek.x) / 2
        face_mid_y = (forehead.y + chin.y) / 2

        # Normalised landmark displacement provides a stable, lightweight head
        # orientation estimate suitable for the two-second live scan cadence.
        yaw = ((nose.x - face_mid_x) / face_width) * 90
        pitch = ((nose.y - face_mid_y) / face_height) * 70
        yaw_quality = max(0.0, 1.0 - abs(yaw) / 28.0)
        pitch_quality = max(0.0, 1.0 - abs(pitch) / 22.0)
        attention = round((yaw_quality * 0.6) + (pitch_quality * 0.4), 3)

        def eye_aspect_ratio(indices):
            outer, upper_outer, upper_inner, inner, lower_inner, lower_outer = [landmarks[i] for i in indices]
            width = max(abs(inner.x - outer.x), 1e-6)
            vertical = (abs(upper_outer.y - lower_outer.y) + abs(upper_inner.y - lower_inner.y)) / 2
            return vertical / width

        left_ear = eye_aspect_ratio([33, 160, 158, 133, 153, 144])
        right_ear = eye_aspect_ratio([362, 385, 387, 263, 373, 380])
        average_ear = (left_ear + right_ear) / 2
        mouth_width = max(abs(landmarks[308].x - landmarks[78].x), 1e-6)
        mouth_open_ratio = abs(landmarks[14].y - landmarks[13].y) / mouth_width

        eye_closure = max(0.0, min(1.0, (0.20 - average_ear) / 0.10))
        yawn_score = max(0.0, min(1.0, (mouth_open_ratio - 0.10) / 0.18))
        fatigue = round((eye_closure * 0.7) + (yawn_score * 0.3), 3)

        return {
            'available': True,
            'attention': attention,
            'attentive': attention >= 0.5,
            'yaw': round(yaw, 2),
            'pitch': round(pitch, 2),
            'fatigue': fatigue,
            'eye_aspect_ratio': round(average_ear, 3),
            'mouth_open_ratio': round(mouth_open_ratio, 3),
        }

    def close(self):
        self.face_mesh.close()
