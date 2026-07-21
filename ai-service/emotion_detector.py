import os
import cv2
import numpy as np

class EmotionDetector:
    def __init__(self, model_path, confidence_threshold=0.55):
        self.model_path = model_path
        self.confidence_threshold = confidence_threshold
        self.emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
        self.demo_mode = True
        self.model = None
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        self.load_model()
        
    def load_model(self):
        if os.path.exists(self.model_path):
            try:
                import tensorflow as tf
                self.model = tf.keras.models.load_model(self.model_path)
                self.demo_mode = False
            except Exception as e:
                print(f"Error loading model: {e}")
                self.demo_mode = True
        else:
            self.demo_mode = True
            
    def detect(self, frame):
        if self.demo_mode:
            return "Neutral", 1.0
            
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
            return "Neutral", 1.0
            
        for (x, y, w, h) in faces:
            face = frame[y:y+h, x:x+w]
            face = cv2.resize(face, (96, 96)) # Assuming MobileNetV2 uses 96x96
            face = np.expand_dims(face, axis=0) / 255.0
            
            predictions = self.model.predict(face)[0]
            max_idx = np.argmax(predictions)
            confidence = predictions[max_idx]
            
            if confidence >= self.confidence_threshold:
                return self.emotions[max_idx], confidence
            else:
                return "Neutral", confidence
                
        return "Neutral", 1.0
