"""
Image utility functions
"""

import cv2
import numpy as np
import base64
from typing import Optional, Tuple


def decode_base64_image(base64_string: str) -> Optional[np.ndarray]:
    """
    Decode base64 encoded image string to numpy array.
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        Image as numpy array (BGR format) or None
    """
    try:
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
    except Exception as e:
        print(f"Error decoding base64 image: {e}")
        return None


def encode_base64_image(image: np.ndarray, format: str = 'jpeg') -> str:
    """
    Encode numpy array image to base64 string.
    
    Args:
        image: Image as numpy array
        format: Image format (jpeg, png)
        
    Returns:
        Base64 encoded image string
    """
    try:
        # Encode image
        _, buffer = cv2.imencode(f'.{format}', image)
        
        # Convert to base64
        image_bytes = buffer.tobytes()
        base64_string = base64.b64encode(image_bytes).decode('utf-8')
        
        return base64_string
    except Exception as e:
        print(f"Error encoding base64 image: {e}")
        return ''


def resize_image(image: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
    """
    Resize image to target size.
    
    Args:
        image: Input image
        target_size: Target size (width, height)
        
    Returns:
        Resized image
    """
    return cv2.resize(image, target_size)


def normalize_image(image: np.ndarray) -> np.ndarray:
    """
    Normalize image to [0, 1] range.
    
    Args:
        image: Input image
        
    Returns:
        Normalized image
    """
    return image.astype('float32') / 255.0


def convert_color(image: np.ndarray, conversion: int = cv2.COLOR_BGR2RGB) -> np.ndarray:
    """
    Convert image color space.
    
    Args:
        image: Input image
        conversion: OpenCV color conversion code
        
    Returns:
        Converted image
    """
    return cv2.cvtColor(image, conversion)


def crop_face(image: np.ndarray, bbox: Tuple[int, int, int, int], padding: int = 20) -> np.ndarray:
    """
    Crop face region from image.
    
    Args:
        image: Input image
        bbox: Bounding box (x, y, w, h)
        padding: Padding around face
        
    Returns:
        Cropped face region
    """
    x, y, w, h = bbox
    
    # Add padding
    x = max(0, x - padding)
    y = max(0, y - padding)
    w = min(image.shape[1] - x, w + 2 * padding)
    h = min(image.shape[0] - y, h + 2 * padding)
    
    # Crop
    face = image[y:y+h, x:x+w]
    
    return face


def apply_gaussian_blur(image: np.ndarray, kernel_size: Tuple[int, int] = (5, 5)) -> np.ndarray:
    """
    Apply Gaussian blur to image.
    
    Args:
        image: Input image
        kernel_size: Kernel size
        
    Returns:
        Blurred image
    """
    return cv2.GaussianBlur(image, kernel_size, 0)


def detect_edges(image: np.ndarray, threshold1: int = 100, threshold2: int = 200) -> np.ndarray:
    """
    Detect edges using Canny edge detection.
    
    Args:
        image: Input image (grayscale)
        threshold1: Lower threshold
        threshold2: Upper threshold
        
    Returns:
        Edge image
    """
    return cv2.Canny(image, threshold1, threshold2)
