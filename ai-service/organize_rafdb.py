import os
import shutil
import pandas as pd
from sklearn.model_selection import train_test_split
import random

# RAF-DB label mapping to our emotion names
RAFDB_LABELS = {
    1: 'surprised',
    2: 'fearful', 
    3: 'disgusted',
    4: 'happy',
    5: 'sad',
    6: 'angry',
    7: 'neutral'
}

# Configuration
SOURCE_DIR = 'model/DATASET'
TARGET_DIR = 'dataset'
TRAIN_SPLIT = 0.8
VAL_SPLIT = 0.1
TEST_SPLIT = 0.1

def organize_rafdb():
    """Organize RAF-DB dataset into train/validation/test folders"""
    
    print("=" * 50)
    print("Organizing RAF-DB Dataset")
    print("=" * 50)
    
    # Create target directories
    emotions = list(RAFDB_LABELS.values())
    
    for split in ['train', 'validation', 'test']:
        for emotion in emotions:
            os.makedirs(os.path.join(TARGET_DIR, split, emotion), exist_ok=True)
    
    print(f"Created target directories in {TARGET_DIR}")
    
    # Process training data
    print("\nProcessing training data...")
    train_csv = os.path.join(SOURCE_DIR, 'train_labels.csv')
    
    if os.path.exists(train_csv):
        df_train = pd.read_csv(train_csv)
        
        # Split into train and validation
        train_data, val_data = train_test_split(
            df_train, 
            test_size=VAL_SPLIT + TEST_SPLIT,
            random_state=42,
            stratify=df_train['label']
        )
        
        # Further split validation and test
        val_data, test_data = train_test_split(
            val_data,
            test_size=TEST_SPLIT / (VAL_SPLIT + TEST_SPLIT),
            random_state=42,
            stratify=val_data['label']
        )
        
        # Copy training images
        print(f"Copying {len(train_data)} training images...")
        for _, row in train_data.iterrows():
            label = int(row['label'])
            image_name = row['image']
            emotion = RAFDB_LABELS[label]
            
            # Source path (RAF-DB structure)
            src_path = os.path.join(SOURCE_DIR, 'train', str(label), image_name)
            
            # Target path
            dst_path = os.path.join(TARGET_DIR, 'train', emotion, image_name)
            
            if os.path.exists(src_path):
                shutil.copy2(src_path, dst_path)
            else:
                print(f"Warning: {src_path} not found")
        
        # Copy validation images
        print(f"Copying {len(val_data)} validation images...")
        for _, row in val_data.iterrows():
            label = int(row['label'])
            image_name = row['image']
            emotion = RAFDB_LABELS[label]
            
            src_path = os.path.join(SOURCE_DIR, 'train', str(label), image_name)
            dst_path = os.path.join(TARGET_DIR, 'validation', emotion, image_name)
            
            if os.path.exists(src_path):
                shutil.copy2(src_path, dst_path)
            else:
                print(f"Warning: {src_path} not found")
        
        # Copy test images
        print(f"Copying {len(test_data)} test images...")
        for _, row in test_data.iterrows():
            label = int(row['label'])
            image_name = row['image']
            emotion = RAFDB_LABELS[label]
            
            src_path = os.path.join(SOURCE_DIR, 'train', str(label), image_name)
            dst_path = os.path.join(TARGET_DIR, 'test', emotion, image_name)
            
            if os.path.exists(src_path):
                shutil.copy2(src_path, dst_path)
            else:
                print(f"Warning: {src_path} not found")
    
    # Process test data from original test set
    print("\nProcessing original test data...")
    test_csv = os.path.join(SOURCE_DIR, 'test_labels.csv')
    
    if os.path.exists(test_csv):
        df_test = pd.read_csv(test_csv)
        
        print(f"Copying {len(df_test)} test images...")
        for _, row in df_test.iterrows():
            label = int(row['label'])
            image_name = row['image']
            emotion = RAFDB_LABELS[label]
            
            src_path = os.path.join(SOURCE_DIR, 'test', str(label), image_name)
            dst_path = os.path.join(TARGET_DIR, 'test', emotion, image_name)
            
            if os.path.exists(src_path):
                shutil.copy2(src_path, dst_path)
            else:
                print(f"Warning: {src_path} not found")
    
    # Print statistics
    print("\n" + "=" * 50)
    print("Dataset Statistics")
    print("=" * 50)
    
    for split in ['train', 'validation', 'test']:
        print(f"\n{split.upper()}:")
        split_path = os.path.join(TARGET_DIR, split)
        total = 0
        for emotion in emotions:
            emotion_path = os.path.join(split_path, emotion)
            if os.path.exists(emotion_path):
                count = len(os.listdir(emotion_path))
                print(f"  {emotion}: {count}")
                total += count
        print(f"  Total: {total}")
    
    print("\n" + "=" * 50)
    print("Dataset organization completed!")
    print(f"Dataset saved to: {TARGET_DIR}")
    print("=" * 50)

if __name__ == '__main__':
    organize_rafdb()
