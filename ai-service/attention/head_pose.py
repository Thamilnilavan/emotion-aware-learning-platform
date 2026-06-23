"""
Head pose estimation using MediaPipe face mesh landmarks
"""

import numpy as np
import cv2
from typing import Tuple, Optional
from .face_mesh import get_face_mesh_detector
import config


class HeadPoseEstimator:
    """Head pose estimation using face mesh landmarks"""
    
    # Face mesh landmark indices for head pose
    NOSE_TIP = 1
    CHIN = 152
    LEFT_EYE = 33
    RIGHT_EYE = 263
    LEFT_MOUTH = 61
    RIGHT_MOUTH = 291
    
    def __init__(self):
        """Initialize head pose estimator"""
        self.face_mesh_detector = get_face_mesh_detector()
    
    def get_pose_landmarks(self, landmarks: np.ndarray) -> dict:
        """
        Get key landmarks for head pose estimation.
        
        Args:
            landmarks: Face mesh landmarks (468, 2)
            
        Returns:
            Dictionary with key landmark coordinates
        """
        return {
            'nose': landmarks[self.NOSE_TIP],
            'chin': landmarks[self.CHIN],
            'leftEye': landmarks[self.LEFT_EYE],
            'rightEye': landmarks[self.RIGHT_EYE],
            'leftMouth': landmarks[self.LEFT_MOUTH],
            'rightMouth': landmarks[self.RIGHT_MOUTH]
        }
    
    def calculate_yaw_pitch_roll(self, landmarks: np.ndarray) -> Tuple[float, float, float]:
        """
        Calculate head pose angles (yaw, pitch, roll) in degrees.
        
        Args:
            landmarks: Face mesh landmarks (468, 2)
            
        Returns:
            Tuple of (yaw, pitch, roll) in degrees
        """
        pose_landmarks = self.get_pose_landmarks(landmarks)
        
        # Calculate yaw (left-right rotation)
        left_eye = pose_landmarks['leftEye']
        right_eye = pose_landmarks['rightEye']
        dx = right_eye[0] - left_eye[0]
        dy = right_eye[1] - left_eye[1]
        yaw = np.degrees(np.arctan2(dy, dx)) - 90
        
        # Calculate pitch (up-down rotation)
        nose = pose_landmarks['nose']
        chin = pose_landmarks['chin']
        eye_center = (left_eye + right_eye) / 2
        mouth_center = (pose_landmarks['leftMouth'] + pose_landmarks['rightMouth']) / 2
        
        # Vertical distance ratios
        nose_eye_dist = np.linalg.norm(nose - eye_center)
        chin_mouth_dist = np.linalg.norm(chin - mouth_center)
        pitch = np.degrees(np.arctan2(nose_eye_dist, chin_mouth_dist) - 0.5)
        
        # Calculate roll (tilt rotation)
        left_mouth = pose_landmarks['leftMouth']
        right_mouth = pose_landmarks['rightMouth']
        dx_m = right_mouth[0] - left_mouth[0]
        dy_m = right_mouth[1] - left_mouth[1]
        roll = np.degrees(np.arctan2(dy_m, dx_m)) - 90
        
        return yaw, pitch, roll
    
    def is_looking_forward(self, yaw: float, pitch: float, roll: float) -> bool:
        """
        Check if user is looking forward.
        
        Args:
            yaw: Yaw angle in degrees
            pitch: Pitch angle in degrees
            roll: Roll angle in degrees
            
        Returns:
            True if looking forward
        """
        threshold = config.HEAD_POSE_THRESHOLD
        return (
            abs(yaw) < threshold and
            abs(pitch) < threshold and
            abs(roll) < threshold
        )
    
    def estimate_head_pose(self, image: np.ndarray) -> dict:
        """
        Estimate head pose from image.
        
        Args:
            image: Input image
            
        Returns:
            Head pose estimation results
        """
        landmarks = self.face_mesh_detector.get_landmarks_468(image)
        
        if landmarks is None:
            return {
                'faceDetected': False,
                'yaw': 0.0,
                'pitch': 0.0,
                'roll': 0.0,
                'lookingForward': False
            }
        
        yaw, pitch, roll = self.calculate_yaw_pitch_roll(landmarks)
        looking_forward = self.is_looking_forward(yaw, pitch, roll)
        
        return {
            'faceDetected': True,
            'yaw': float(yaw),
            'pitch': float(pitch),
            'roll': float(roll),
            'lookingForward': looking_forward
        }


# Global estimator instance
_estimator = None


def get_head_pose_estimator() -> HeadPoseEstimator:
    """Get or create global head pose estimator"""
    global _estimator
    if _estimator is None:
        _estimator = HeadPoseEstimator()
    return _estimator
