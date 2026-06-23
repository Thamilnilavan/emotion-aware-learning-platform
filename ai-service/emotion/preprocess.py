"""
Image preprocessing for emotion detection
"""

import cv2
import numpy as np
from typing import Optional, Tuple
import config


def preprocess_image(image: np.ndarray, target_size: Tuple[int, int] = config.INPUT_SHAPE[:2]) -> np.ndarray:
    """
    Preprocess image for emotion detection model.
    
    Args:
        image: Input image (BGR or RGB)
        target_size: Target size (height, width)
        
    Returns:
        Preprocessed image array
    """
    # Convert to grayscale if needed
    if len(image.shape) == 3 and image.shape[2] == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Resize to target size
    image = cv2.resize(image, target_size)
    
    # Normalize to [0, 1]
    image = image.astype('float32') / 255.0
    
    # Add channel dimension if needed
    if len(image.shape) == 2:
        image = np.expand_dims(image, axis=-1)
    
    # Add batch dimension
    image = np.expand_dims(image, axis=0)
    
    return image


def decode_base64_image(base64_string: str) -> np.ndarray:
    """
    Decode base64 encoded image string to numpy array.
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        Image as numpy array (BGR format)
    """
    import base64
    
    # Remove data URL prefix if present
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    # Decode base64
    image_bytes = base64.b64decode(base64_string)
    
    # Convert to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    
    # Decode image
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    return image


def face_detection_preprocess(image: np.ndarray) -> np.ndarray:
    """
    Preprocess image for face detection.
    
    Args:
        image: Input image
        
    Returns:
        Preprocessed image
    """
    # Convert to RGB if BGR
    if len(image.shape) == 3 and image.shape[2] == 3:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    return image


def align_face(image: np.ndarray, landmarks: np.ndarray) -> np.ndarray:
    """
    Align face based on eye landmarks.
    
    Args:
        image: Input image
        landmarks: Facial landmarks
        
    Returns:
        Aligned face image
    """
    # Simple alignment based on eye centers
    left_eye = landmarks[36:42].mean(axis=0).astype(int)
    right_eye = landmarks[42:48].mean(axis=0).astype(int)
    
    # Compute angle
    dy = right_eye[1] - left_eye[1]
    dx = right_eye[0] - left_eye[0]
    angle = np.degrees(np.arctan2(dy, dx))
    
    # Rotate image
    center = tuple((np.array(image.shape[1::-1]) / 2).astype(int))
    rotation_matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    aligned = cv2.warpAffine(image, rotation_matrix, image.shape[1::-1], flags=cv2.INTER_CUBIC)
    
    return aligned


def extract_face_region(image: np.ndarray, bbox: Tuple[int, int, int, int], padding: int = 20) -> np.ndarray:
    """
    Extract face region from image with padding.
    
    Args:
        image: Input image
        bbox: Bounding box (x, y, w, h)
        padding: Padding around face
        
    Returns:
        Face region
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
