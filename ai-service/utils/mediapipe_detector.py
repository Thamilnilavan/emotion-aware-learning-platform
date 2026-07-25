"""
MediaPipe Face Detection for emotion recognition preprocessing
"""

import cv2
import mediapipe as mp
import numpy as np
from config import Config


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
        
        # Convert BGR to RGB for MediaPipe
        if len(image.shape) == 3 and image.shape[2] == 3:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        else:
            image_rgb = image
        
        # Detect faces
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
    
    def extract_face(self, image, bbox, padding=20):
        """
        Extract face region from image using bounding box
        
        Args:
            image: Input image
            bbox: Bounding box (x, y, width, height)
            padding: Padding around the face
            
        Returns:
            Cropped face image
        """
        x, y, w, h = bbox
        
        # Add padding
        x = max(0, x - padding)
        y = max(0, y - padding)
        w = min(image.shape[1] - x, w + 2 * padding)
        h = min(image.shape[0] - y, h + 2 * padding)
        
        # Extract face
        face = image[y:y+h, x:x+w]
        
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
