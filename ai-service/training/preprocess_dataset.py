"""
Preprocess emotion datasets into unified numpy arrays for training.
Supports: FER2013 (folders), CK+ (pixel CSV), RAF-DB (folders + labels), AffectNet (folders).
"""

import os
import csv
import argparse
import numpy as np
from pathlib import Path
from collections import Counter

import cv2

EMOTIONS = ['Angry', 'Disgusted', 'Fearful', 'Happy', 'Neutral', 'Sad', 'Surprised']
EMOTION_TO_IDX = {e: i for i, e in enumerate(EMOTIONS)}
IMG_SIZE = 96

FER2013_FOLDER_MAP = {
    'angry': 'Angry', 'disgust': 'Disgusted', 'fear': 'Fearful',
    'happy': 'Happy', 'neutral': 'Neutral', 'sad': 'Sad', 'surprise': 'Surprised',
}

CK_EMOTION_MAP = {
    '0': 'Angry', '1': 'Disgusted', '2': 'Fearful', '3': 'Happy',
    '4': 'Sad', '5': 'Surprised', '6': 'Neutral', '7': 'Disgusted',
}

RAF_LABEL_MAP = {1: 'Surprised', 2: 'Fearful', 3: 'Disgusted', 4: 'Happy',
                 5: 'Sad', 6: 'Angry', 7: 'Neutral'}

AFFECTNET_FOLDER_MAP = {
    'anger': 'Angry', 'contempt': 'Disgusted', 'disgust': 'Disgusted',
    'fear': 'Fearful', 'happy': 'Happy', 'neutral': 'Neutral',
    'sad': 'Sad', 'surprise': 'Surprised',
}

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp'}


def datasets_root():
    return Path(__file__).resolve().parent.parent / 'datasets'


def load_image(path):
    img = cv2.imread(str(path))
    if img is None:
        return None
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    resized = cv2.resize(gray, (IMG_SIZE, IMG_SIZE))
    rgb = cv2.cvtColor(resized, cv2.COLOR_GRAY2RGB)
    return rgb.astype('float32') / 255.0


def load_pixels(pixel_str):
    pixels = np.array(pixel_str.strip().split(), dtype=np.uint8)
    if pixels.size != 48 * 48:
        return None
    img = pixels.reshape(48, 48)
    resized = cv2.resize(img, (IMG_SIZE, IMG_SIZE))
    rgb = cv2.cvtColor(resized, cv2.COLOR_GRAY2RGB)
    return rgb.astype('float32') / 255.0


def collect_fer2013(root, max_per_class=None):
    X, y = [], []
    for split in ('train', 'test'):
        split_path = root / 'FER2013' / split
        if not split_path.exists():
            continue
        for emo_dir in split_path.iterdir():
            if not emo_dir.is_dir():
                continue
            label_name = FER2013_FOLDER_MAP.get(emo_dir.name.lower())
            if not label_name:
                continue
            label = EMOTION_TO_IDX[label_name]
            files = [f for f in emo_dir.iterdir() if f.suffix.lower() in IMAGE_EXTENSIONS]
            if max_per_class:
                files = files[:max_per_class]
            for f in files:
                arr = load_image(f)
                if arr is not None:
                    X.append(arr)
                    y.append(label)
    return X, y


def collect_ckplus(root, max_per_class=None):
    X, y = [], []
    csv_path = root / 'CK+' / 'ckextended.csv'
    if not csv_path.exists():
        return X, y
    counts = Counter()
    with open(csv_path, newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            emo_id = str(row.get('emotion', '')).strip()
            label_name = CK_EMOTION_MAP.get(emo_id)
            if not label_name:
                continue
            label = EMOTION_TO_IDX[label_name]
            if max_per_class and counts[label] >= max_per_class:
                continue
            arr = load_pixels(row['pixels'])
            if arr is not None:
                X.append(arr)
                y.append(label)
                counts[label] += 1
    return X, y


def collect_raf_db(root, max_per_class=None):
    X, y = [], []
    for split, label_file in [('train', 'train_labels.csv'), ('test', 'test_labels.csv')]:
        labels_path = root / 'RAF-DB' / label_file
        images_path = root / 'RAF-DB' / split
        if not labels_path.exists() or not images_path.exists():
            continue
        counts = Counter()
        with open(labels_path, newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                img_name = row.get('image', row.get('Image', ''))
                try:
                    label_id = int(row.get('label', row.get('Label', 0)))
                except (TypeError, ValueError):
                    continue
                label_name = RAF_LABEL_MAP.get(label_id)
                if not label_name:
                    continue
                label = EMOTION_TO_IDX[label_name]
                if max_per_class and counts[label] >= max_per_class:
                    continue
                # RAF-DB images are in numbered subfolders (1-7)
                # Try direct path first, then search in subfolders
                img_path = images_path / img_name
                if not img_path.exists():
                    # Search in numbered subfolders
                    found = False
                    for i in range(1, 8):
                        subfolder_path = images_path / str(i) / img_name
                        if subfolder_path.exists():
                            img_path = subfolder_path
                            found = True
                            break
                    if not found:
                        continue
                arr = load_image(img_path)
                if arr is not None:
                    X.append(arr)
                    y.append(label)
                    counts[label] += 1
    return X, y


def collect_affectnet(root, max_per_class=None):
    X, y = [], []
    for split in ('Train', 'Test'):
        split_path = root / 'AffectNet' / split
        if not split_path.exists():
            split_path = root / 'AffectNet' / split.lower()
        if not split_path.exists():
            continue
        for emo_dir in split_path.iterdir():
            if not emo_dir.is_dir():
                continue
            label_name = AFFECTNET_FOLDER_MAP.get(emo_dir.name.lower())
            if not label_name:
                continue
            label = EMOTION_TO_IDX[label_name]
            files = [f for f in emo_dir.iterdir() if f.suffix.lower() in IMAGE_EXTENSIONS]
            if max_per_class:
                files = files[:max_per_class]
            for f in files:
                arr = load_image(f)
                if arr is not None:
                    X.append(arr)
                    y.append(label)
    return X, y


COLLECTORS = {
    'FER2013': collect_fer2013,
    'CK+': collect_ckplus,
    'RAF-DB': collect_raf_db,
    'AffectNet': collect_affectnet,
}


def preprocess(selected=None, max_per_class=None, output_dir=None):
    root = datasets_root()
    output_dir = Path(output_dir or root.parent / 'saved_models' / 'preprocessed')
    output_dir.mkdir(parents=True, exist_ok=True)

    selected = selected or list(COLLECTORS.keys())
    all_X, all_y = [], []

    for name in selected:
        if name not in COLLECTORS:
            print(f'Skipping unknown dataset: {name}')
            continue
        print(f'Processing {name}...')
        X, y = COLLECTORS[name](root, max_per_class=max_per_class)
        print(f'  -> {len(y)} samples')
        all_X.extend(X)
        all_y.extend(y)

    if not all_y:
        raise RuntimeError('No samples collected — run dataset check first')

    X_arr = np.array(all_X, dtype='float32')
    y_arr = np.array(all_y, dtype='int32')

    np.save(output_dir / 'X.npy', X_arr)
    np.save(output_dir / 'y.npy', y_arr)

    dist = Counter(y_arr.tolist())
    print(f'Saved {len(y_arr)} samples to {output_dir}')
    print('Class distribution:', {EMOTIONS[i]: dist[i] for i in sorted(dist)})
    return str(output_dir)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Preprocess emotion datasets')
    parser.add_argument('--datasets', nargs='+', default=None,
                        help='Datasets to include: FER2013 CK+ RAF-DB AffectNet')
    parser.add_argument('--max-per-class', type=int, default=None,
                        help='Limit samples per emotion class (for quick tests)')
    parser.add_argument('--output', default=None, help='Output directory')
    parser.add_argument('--separate', action='store_true',
                        help='Save each dataset separately instead of combining')
    args = parser.parse_args()
    
    if args.separate:
        # Process each dataset separately
        selected = args.datasets or list(COLLECTORS.keys())
        for name in selected:
            if name not in COLLECTORS:
                print(f'Skipping unknown dataset: {name}')
                continue
            print(f'\n{"="*50}')
            print(f'Processing {name} separately...')
            print(f'{"="*50}')
            try:
                output_dir = preprocess([name], args.max_per_class, args.output)
                # Rename output to include dataset name
                import shutil
                final_dir = Path(output_dir).parent / f'preprocessed_{name.lower()}'
                if final_dir.exists():
                    shutil.rmtree(final_dir)
                shutil.move(output_dir, final_dir)
                print(f'Saved {name} data to {final_dir}')
            except Exception as e:
                print(f'Error processing {name}: {e}')
    else:
        preprocess(args.datasets, args.max_per_class, args.output)
