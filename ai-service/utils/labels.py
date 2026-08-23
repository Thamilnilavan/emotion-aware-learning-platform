"""
Emotion labels mapping for the emotion detection model
"""

# Emotion class labels (RAF-DB dataset)
EMOTION_LABELS = {
    # This order must exactly match EMOTIONS passed to
    # flow_from_directory(classes=EMOTIONS) in train_model.py.
    0: 'Happy',
    1: 'Sad',
    2: 'Angry',
    3: 'Neutral',
    4: 'Surprised',
    5: 'Fearful',
    6: 'Disgusted'
}

# Reverse mapping for prediction
LABEL_TO_CLASS = {v: k for k, v in EMOTION_LABELS.items()}

# Emotion colors for UI display
EMOTION_COLORS = {
    'Surprised': '#FF6B6B',
    'Fearful': '#4ECDC4',
    'Disgusted': '#45B7D1',
    'Happy': '#FFD93D',
    'Sad': '#6C5CE7',
    'Angry': '#E17055',
    'Neutral': '#95A5A6'
}

# Emotion descriptions
EMOTION_DESCRIPTIONS = {
    'Surprised': 'Expression of sudden discovery or realization',
    'Fearful': 'Expression of fear or anxiety',
    'Disgusted': 'Expression of strong dislike or repulsion',
    'Happy': 'Expression of pleasure or contentment',
    'Sad': 'Expression of sorrow or unhappiness',
    'Angry': 'Expression of strong displeasure or hostility',
    'Neutral': 'Expression without strong emotion'
}

def get_emotion_label(class_id):
    """Get emotion label from class ID"""
    return EMOTION_LABELS.get(class_id, 'Unknown')

def get_emotion_color(emotion):
    """Get color for emotion display"""
    return EMOTION_COLORS.get(emotion, '#95A5A6')

def get_emotion_description(emotion):
    """Get description for emotion"""
    return EMOTION_DESCRIPTIONS.get(emotion, '')
