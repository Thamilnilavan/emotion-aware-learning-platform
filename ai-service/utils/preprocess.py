"""
Image preprocessing for emotion recognition model
"""

import cv2
import numpy as np
from PIL import Image
from config import Config
from .mediapipe_detector import FaceDetector


class ImagePreprocessor:
    """Image preprocessing for emotion recognition"""
    
    def __init__(self):
        """Initialize preprocessor with face detector"""
        self.face_detector = FaceDetector()
        self.target_size = Config.MODEL_INPUT_SIZE
    
    def preprocess_image(self, image):
        """
        Preprocess image for emotion prediction
        
        Args:
            image: Input image (numpy array, PIL Image, or base64 string)
            
        Returns:
            Preprocessed image tensor ready for model inference
        """
        # Convert to numpy array if needed
        if isinstance(image, str):
            # Assume base64 string
            import base64
            import io
            image_data = base64.b64decode(image)
            image = Image.open(io.BytesIO(image_data))
            image = np.array(image)
        elif isinstance(image, Image.Image):
            image = np.array(image)
        
        # Detect faces
        faces = self.face_detector.detect_faces(image)
        
        if not faces:
            return None, False
        
        # Extract the first face (highest confidence)
        face = max(faces, key=lambda x: x['confidence'])
        bbox = face['bbox']
        
        # Extract face region
        face_image = self.face_detector.extract_face(image, bbox, padding=30)
        
        # Resize to target size
        face_image = cv2.resize(face_image, self.target_size)
        
        # Convert to RGB if needed
        if len(face_image.shape) == 3 and face_image.shape[2] == 4:
            face_image = cv2.cvtColor(face_image, cv2.COLOR_RGBA2RGB)
        elif len(face_image.shape) == 2:
            face_image = cv2.cvtColor(face_image, cv2.COLOR_GRAY2RGB)
        elif len(face_image.shape) == 3 and face_image.shape[2] == 3:
            # Check if BGR, convert to RGB
            face_image = cv2.cvtColor(face_image, cv2.COLOR_BGR2RGB)
        
        # Normalize to [0, 1]
        face_image = face_image.astype(np.float32) / 255.0
        
        # Add batch dimension
        face_image = np.expand_dims(face_image, axis=0)
        
        return face_image, True
    
    def preprocess_batch(self, images):
        """
        Preprocess multiple images for batch prediction
        
        Args:
            images: List of input images
            
        Returns:
            List of preprocessed image tensors
        """
        preprocessed = []
        valid_images = []
        
        for image in images:
            preprocessed_img, is_valid = self.preprocess_image(image)
            if is_valid:
                preprocessed.append(preprocessed_img)
                valid_images.append(True)
            else:
                preprocessed.append(None)
                valid_images.append(False)
        
        return preprocessed, valid_images
    
    def decode_base64_image(self, base64_string):
        """
        Decode base64 string to image
        
        Args:
            base64_string: Base64 encoded image string
            
        Returns:
            PIL Image
        """
        import base64
        import io
        
        # Remove data URL prefix if present
        if base64_string.startswith('data:image'):
            base64_string = base64_string.split(',')[1]
        
        # Decode
        image_data = base64.b64decode(base64_string)
        image = Image.open(io.BytesIO(image_data))
        
        return image
    
    def encode_image_to_base64(self, image):
        """
        Encode image to base64 string
        
        Args:
            image: PIL Image or numpy array
            
        Returns:
            Base64 encoded string
        """
        import base64
        import io
        
        if isinstance(image, np.ndarray):
            image = Image.fromarray(image)
        
        buffered = io.BytesIO()
        image.save(buffered, format="JPEG")
        img_str = base64.b64encode(buffered.getvalue()).decode()
        
        return img_str
    
    def cleanup(self):
        """Clean up resources"""
        self.face_detector.cleanup()
