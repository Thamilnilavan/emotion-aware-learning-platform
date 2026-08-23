"""
MediaPipe Face Detection for emotion recognition preprocessing
"""

import cv2
import mediapipe as mp
import numpy as np
from config import Config


import threading

class FaceDetector:
    """MediaPipe Face Detection for extracting faces from images"""
    
    def __init__(self):
        """Initialize MediaPipe Face Detection"""
        self.mp_face_detection = mp.solutions.face_detection
        self.face_detection = self.mp_face_detection.FaceDetection(
            model_selection=0,
            min_detection_confidence=Config.MEDIAPIPE_MIN_DETECTION_CONFIDENCE
        )
        self.mp_drawing = mp.solutions.drawing_utils
        self._lock = threading.Lock()
    
    def detect_faces(self, image):
        """
        Detect faces in an image
        
        Args:
            image: Input image (numpy array or PIL Image)
            
        Returns:
            List of detected face bounding boxes and landmarks
        """
        # Convert to numpy array if needed
        if not isinstance(image, np.ndarray):
            image = np.array(image)
        
        # The API decoder and training pipeline both use RGB. Treating this as
        # OpenCV BGR swaps red/blue channels and makes webcam inference differ
        # from RAF-DB evaluation images.
        image_rgb = np.ascontiguousarray(image)
        
        # Detect faces
        with self._lock:
            results = self.face_detection.process(image_rgb)
        
        faces = []
        if results.detections:
            for detection in results.detections:
                # Get bounding box
                bbox = self._get_bounding_box(detection, image.shape)
                
                # Get confidence score
                confidence = detection.score[0]
                
                faces.append({
                    'bbox': bbox,
                    'confidence': confidence,
                    'detection': detection
                })
        
        return faces
    
    def extract_face(self, image, bbox, padding_ratio=0.18):
        """
        Extract face region from image using bounding box
        
        Args:
            image: Input image
            bbox: Bounding box (x, y, width, height)
            padding_ratio: Proportional context around the face
            
        Returns:
            Cropped face image
        """
        x, y, w, h = bbox
        
        image_height, image_width = image.shape[:2]
        side = max(w, h) * (1 + 2 * padding_ratio)
        center_x = x + w / 2
        center_y = y + h / 2
        side = min(side, image_width, image_height)

        left = int(round(center_x - side / 2))
        top = int(round(center_y - side / 2))
        left = max(0, min(left, image_width - int(side)))
        top = max(0, min(top, image_height - int(side)))
        right = min(image_width, left + int(side))
        bottom = min(image_height, top + int(side))

        # A square crop avoids stretching expressions before 300x300 resize.
        face = image[top:bottom, left:right]
        
        return face
    
    def _get_bounding_box(self, detection, image_shape):
        """
        Convert MediaPipe detection to bounding box
        
        Args:
            detection: MediaPipe detection object
            image_shape: Image shape (height, width)
            
        Returns:
            Bounding box (x, y, width, height)
        """
        h, w = image_shape[:2]
        
        # Get relative coordinates
        bbox = detection.location_data.relative_bounding_box
        
        # Convert to absolute coordinates
        x = int(bbox.xmin * w)
        y = int(bbox.ymin * h)
        width = int(bbox.width * w)
        height = int(bbox.height * h)
        
        return (x, y, width, height)
    
    def draw_detections(self, image, faces):
        """
        Draw face detections on image
        
        Args:
            image: Input image
            faces: List of detected faces
            
        Returns:
            Image with drawn detections
        """
        image_copy = image.copy()
        
        for face in faces:
            bbox = face['bbox']
            x, y, w, h = bbox
            
            # Draw rectangle
            cv2.rectangle(image_copy, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Draw confidence
            confidence = face['confidence']
            cv2.putText(
                image_copy,
                f'Face: {confidence:.2f}',
                (x, y - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 255, 0),
                2
            )
        
        return image_copy
    
    def cleanup(self):
        """Clean up MediaPipe resources"""
        self.face_detection.close()
