import os
import csv
from collections import Counter
from pathlib import Path

EMOTIONS = ['Angry', 'Disgusted', 'Fearful', 'Happy', 'Neutral', 'Sad', 'Surprised']

IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.gif'}

FER2013_FOLDER_MAP = {
    'angry': 'Angry',
    'disgust': 'Disgusted',
    'fear': 'Fearful',
    'happy': 'Happy',
    'neutral': 'Neutral',
    'sad': 'Sad',
    'surprise': 'Surprised',
}

CK_EMOTION_MAP = {
    '0': 'Angry',
    '1': 'Disgusted',
    '2': 'Fearful',
    '3': 'Happy',
    '4': 'Sad',
    '5': 'Surprised',
    '6': 'Neutral',
    '7': 'Disgusted',
}

RAF_LABEL_MAP = {
    1: 'Surprised',
    2: 'Fearful',
    3: 'Disgusted',
    4: 'Happy',
    5: 'Sad',
    6: 'Angry',
    7: 'Neutral',
}

AFFECTNET_FOLDER_MAP = {
    'anger': 'Angry',
    'contempt': 'Disgusted',
    'disgust': 'Disgusted',
    'fear': 'Fearful',
    'happy': 'Happy',
    'neutral': 'Neutral',
    'sad': 'Sad',
    'surprise': 'Surprised',
}


def _datasets_root():
    return Path(__file__).resolve().parent.parent / 'datasets'


def _count_images(directory):
    count = 0
    if not directory.exists():
        return 0
    for root, _, files in os.walk(directory):
        for f in files:
            if Path(f).suffix.lower() in IMAGE_EXTENSIONS:
                count += 1
    return count


def _check_fer2013(root):
    path = root / 'FER2013'
    result = {
        'name': 'FER2013',
        'path': str(path),
        'available': path.exists(),
        'format': 'folder',
        'status': 'missing',
        'total_samples': 0,
        'train_samples': 0,
        'test_samples': 0,
        'emotion_distribution': {},
        'issues': [],
    }

    if not path.exists():
        result['issues'].append('Directory not found')
        return result

    zip_path = root / 'FER2013.zip'
    result['zip_present'] = zip_path.exists()

    emotion_dist = Counter()
    for split in ('train', 'test'):
        split_path = path / split
        if not split_path.exists():
            result['issues'].append(f'Missing {split}/ folder')
            continue
        split_count = 0
        for emo_folder in split_path.iterdir():
            if not emo_folder.is_dir():
                continue
            mapped = FER2013_FOLDER_MAP.get(emo_folder.name.lower())
            if not mapped:
                result['issues'].append(f'Unknown emotion folder: {emo_folder.name}')
                continue
            n = sum(
                1 for f in emo_folder.iterdir()
                if f.suffix.lower() in IMAGE_EXTENSIONS
            )
            split_count += n
            emotion_dist[mapped] += n
        if split == 'train':
            result['train_samples'] = split_count
        else:
            result['test_samples'] = split_count

    result['total_samples'] = result['train_samples'] + result['test_samples']
    result['emotion_distribution'] = dict(emotion_dist)

    if result['total_samples'] == 0:
        result['issues'].append('No images found — extract FER2013.zip if needed')
    elif result['total_samples'] < 1000:
        result['issues'].append('Very few images — dataset may be incomplete')

    result['status'] = 'ready' if result['total_samples'] > 0 and not result['issues'] else (
        'partial' if result['total_samples'] > 0 else 'missing'
    )
    return result


def _check_ckplus(root):
    path = root / 'CK+'
    csv_path = path / 'ckextended.csv'
    result = {
        'name': 'CK+',
        'path': str(path),
        'available': path.exists(),
        'format': 'csv_pixels',
        'status': 'missing',
        'total_samples': 0,
        'train_samples': 0,
        'test_samples': 0,
        'emotion_distribution': {},
        'issues': [],
    }

    if not path.exists():
        result['issues'].append('Directory not found')
        return result

    result['zip_present'] = (root / 'CK+.zip').exists()

    if not csv_path.exists():
        result['issues'].append('ckextended.csv not found')
        return result

    emotion_dist = Counter()
    usage_dist = Counter()
    try:
        with open(csv_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                emo_id = str(row.get('emotion', '')).strip()
                mapped = CK_EMOTION_MAP.get(emo_id, 'Neutral')
                emotion_dist[mapped] += 1
                usage = str(row.get('Usage', 'Training')).strip()
                usage_dist[usage] += 1
                if 'pixels' not in row or not row['pixels'].strip():
                    result['issues'].append('Row missing pixel data')
                    break
    except Exception as e:
        result['issues'].append(f'Failed to read CSV: {e}')
        return result

    result['total_samples'] = sum(emotion_dist.values())
    result['train_samples'] = usage_dist.get('Training', 0) + usage_dist.get('train', 0)
    result['test_samples'] = usage_dist.get('PublicTest', 0) + usage_dist.get('PrivateTest', 0)
    result['emotion_distribution'] = dict(emotion_dist)
    result['note'] = 'Pixel-based CSV only (no image files) — used directly for training'

    image_count = _count_images(path)
    if image_count == 0:
        result['issues'].append('No image files (expected — CK+ provided as pixel CSV)')

    result['status'] = 'ready' if result['total_samples'] > 0 else 'missing'
    return result


def _check_raf_db(root):
    path = root / 'RAF-DB'
    result = {
        'name': 'RAF-DB',
        'path': str(path),
        'available': path.exists(),
        'format': 'folder_with_labels_csv',
        'status': 'missing',
        'total_samples': 0,
        'train_samples': 0,
        'test_samples': 0,
        'emotion_distribution': {},
        'issues': [],
    }

    if not path.exists():
        result['issues'].append('Directory not found')
        return result

    result['zip_present'] = (root / 'RAF-DB.zip').exists()

    emotion_dist = Counter()
    for split, label_file in [('train', 'train_labels.csv'), ('test', 'test_labels.csv')]:
        labels_path = path / label_file
        images_path = path / split
        if not labels_path.exists():
            result['issues'].append(f'Missing {label_file}')
            continue
        if not images_path.exists():
            result['issues'].append(f'Missing {split}/ folder')
            continue

        count = 0
        with open(labels_path, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    label = int(row.get('label', row.get('Label', 0)))
                except (TypeError, ValueError):
                    continue
                mapped = RAF_LABEL_MAP.get(label)
                if mapped:
                    emotion_dist[mapped] += 1
                    count += 1
        if split == 'train':
            result['train_samples'] = count
        else:
            result['test_samples'] = count

    result['total_samples'] = result['train_samples'] + result['test_samples']
    result['emotion_distribution'] = dict(emotion_dist)
    result['image_count'] = _count_images(path)

    if result['image_count'] == 0:
        result['issues'].append('No images found — extract RAF-DB.zip if needed')
    elif abs(result['image_count'] - result['total_samples']) > 100:
        result['issues'].append(
            f'Label count ({result["total_samples"]}) differs from image count ({result["image_count"]})'
        )

    result['status'] = 'ready' if result['total_samples'] > 0 and result['image_count'] > 0 else (
        'partial' if result['total_samples'] > 0 or result['image_count'] > 0 else 'missing'
    )
    return result


def _check_affectnet(root):
    path = root / 'AffectNet'
    result = {
        'name': 'AffectNet',
        'path': str(path),
        'available': path.exists(),
        'format': 'folder',
        'status': 'missing',
        'total_samples': 0,
        'train_samples': 0,
        'test_samples': 0,
        'emotion_distribution': {},
        'issues': [],
    }

    if not path.exists():
        result['issues'].append('Directory not found')
        return result

    result['zip_present'] = (root / 'AffectNet.zip').exists()
    result['labels_csv_present'] = (path / 'labels.csv').exists()

    emotion_dist = Counter()
    for split in ('Train', 'Test'):
        split_path = path / split
        if not split_path.exists():
            alt = path / split.lower()
            split_path = alt if alt.exists() else split_path
        if not split_path.exists():
            result['issues'].append(f'Missing {split}/ folder')
            continue
        split_count = 0
        for emo_folder in split_path.iterdir():
            if not emo_folder.is_dir():
                continue
            mapped = AFFECTNET_FOLDER_MAP.get(emo_folder.name.lower())
            if not mapped:
                result['issues'].append(f'Unknown emotion folder: {emo_folder.name}')
                continue
            n = sum(
                1 for f in emo_folder.iterdir()
                if f.suffix.lower() in IMAGE_EXTENSIONS
            )
            split_count += n
            emotion_dist[mapped] += n
        if split in ('Train',):
            result['train_samples'] = split_count
        else:
            result['test_samples'] = split_count

    result['total_samples'] = result['train_samples'] + result['test_samples']
    result['emotion_distribution'] = dict(emotion_dist)

    if result['total_samples'] == 0:
        result['issues'].append('No images found — extract AffectNet.zip if needed')

    result['status'] = 'ready' if result['total_samples'] > 0 else 'missing'
    return result


def check_all_datasets():
    root = _datasets_root()
    datasets = [
        _check_fer2013(root),
        _check_affectnet(root),
        _check_ckplus(root),
        _check_raf_db(root),
    ]

    total_samples = sum(d['total_samples'] for d in datasets)
    ready_count = sum(1 for d in datasets if d['status'] == 'ready')
    partial_count = sum(1 for d in datasets if d['status'] == 'partial')

    return {
        'datasets_root': str(root),
        'summary': {
            'total_datasets': len(datasets),
            'ready': ready_count,
            'partial': partial_count,
            'missing': len(datasets) - ready_count - partial_count,
            'total_samples': total_samples,
            'target_emotions': EMOTIONS,
        },
        'datasets': datasets,
    }


if __name__ == '__main__':
    import json
    print(json.dumps(check_all_datasets(), indent=2))
