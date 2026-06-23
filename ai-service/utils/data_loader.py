"""
Data loading utilities for training emotion detection models.
Supports loading preprocessed numpy arrays and creating data generators.
"""

import numpy as np
from pathlib import Path
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical

EMOTIONS = ['Angry', 'Disgusted', 'Fearful', 'Happy', 'Neutral', 'Sad', 'Surprised']
NUM_CLASSES = len(EMOTIONS)


def get_preprocessed_data_path(dataset_name=None):
    """
    Get path to preprocessed data directory.
    
    Args:
        dataset_name: Optional dataset name (e.g., 'fer2013', 'affectnet', 'ck+', 'raf-db')
                    If None, returns the default combined path
    
    Returns:
        Path: Path to preprocessed data directory
    """
    base_path = Path(__file__).resolve().parent.parent / 'saved_models'
    if dataset_name:
        return base_path / f'preprocessed_{dataset_name.lower()}'
    return base_path / 'preprocessed'


def load_preprocessed_data(dataset_name=None):
    """
    Load preprocessed X and y arrays from disk.
    
    Args:
        dataset_name: Optional dataset name to load (e.g., 'fer2013', 'affectnet', 'ck+', 'raf-db')
                    If None, loads from default combined path
    
    Returns:
        tuple: (X, y) where X is images and y is labels
    """
    data_path = get_preprocessed_data_path(dataset_name)
    x_path = data_path / 'X.npy'
    y_path = data_path / 'y.npy'
    
    if not x_path.exists() or not y_path.exists():
        raise FileNotFoundError(
            f"Preprocessed data not found at {data_path}. "
            "Run preprocessing script first."
        )
    
    X = np.load(x_path)
    y = np.load(y_path)
    
    dataset_str = f" ({dataset_name})" if dataset_name else ""
    print(f"Loaded {len(X)} samples from {data_path}{dataset_str}")
    return X, y


def prepare_train_test_split(X, y, test_size=0.2, random_state=42, stratify=True):
    """
    Split data into train and test sets.
    
    Args:
        X: Image data array
        y: Label array
        test_size: Proportion of data for testing
        random_state: Random seed for reproducibility
        stratify: Whether to stratify the split
        
    Returns:
        tuple: (X_train, X_test, y_train, y_test)
    """
    split_params = {'test_size': test_size, 'random_state': random_state}
    if stratify:
        split_params['stratify'] = y
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, **split_params)
    
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")
    return X_train, X_test, y_train, y_test


def one_hot_encode_labels(y, num_classes=NUM_CLASSES):
    """
    Convert integer labels to one-hot encoded vectors.
    
    Args:
        y: Label array (integers)
        num_classes: Number of emotion classes
        
    Returns:
        numpy array: One-hot encoded labels
    """
    return to_categorical(y, num_classes=num_classes)


def get_data_splits(test_size=0.2, val_size=0.1, random_state=42, dataset_name=None, max_samples=None):
    """
    Load preprocessed data and return train/val/test splits.
    
    Args:
        test_size: Proportion of data for testing
        val_size: Proportion of training data for validation
        random_state: Random seed for reproducibility
        dataset_name: Optional dataset name to load (e.g., 'fer2013', 'affectnet', 'ck+', 'raf-db')
        max_samples: Optional limit on total samples to use (for memory constraints)
    
    Returns:
        dict: Dictionary containing X_train, X_val, X_test, y_train, y_val, y_test
              (all labels are one-hot encoded)
    """
    # Load preprocessed data
    X, y = load_preprocessed_data(dataset_name)
    
    # Limit samples if specified
    if max_samples and len(X) > max_samples:
        print(f"Limiting to {max_samples} samples (from {len(X)})")
        indices = np.random.choice(len(X), max_samples, replace=False)
        X = X[indices]
        y = y[indices]
    
    # Split into train and test
    X_train, X_test, y_train, y_test = prepare_train_test_split(
        X, y, test_size=test_size, random_state=random_state
    )
    
    # Split train into train and validation
    if val_size > 0:
        X_train, X_val, y_train, y_val = prepare_train_test_split(
            X_train, y_train, test_size=val_size, random_state=random_state
        )
        # One-hot encode all labels
        y_train = one_hot_encode_labels(y_train)
        y_val = one_hot_encode_labels(y_val)
        y_test = one_hot_encode_labels(y_test)
        
        return {
            'X_train': X_train,
            'X_val': X_val,
            'X_test': X_test,
            'y_train': y_train,
            'y_val': y_val,
            'y_test': y_test,
        }
    else:
        # One-hot encode labels
        y_train = one_hot_encode_labels(y_train)
        y_test = one_hot_encode_labels(y_test)
        
        return {
            'X_train': X_train,
            'X_val': None,
            'X_test': X_test,
            'y_train': y_train,
            'y_val': None,
            'y_test': y_test,
        }


def combine_datasets(dataset_names, max_per_class=None):
    """
    Combine multiple preprocessed datasets into one.
    
    Args:
        dataset_names: List of dataset names to combine (e.g., ['fer2013', 'affectnet'])
        max_per_class: Optional limit on samples per class per dataset
    
    Returns:
        tuple: (X_combined, y_combined)
    """
    all_X, all_y = [], []
    
    for name in dataset_names:
        try:
            X, y = load_preprocessed_data(name)
            if max_per_class:
                # Limit samples per class
                unique_labels = np.unique(y)
                X_subset, y_subset = [], []
                for label in unique_labels:
                    indices = np.where(y == label)[0]
                    if len(indices) > max_per_class:
                        indices = np.random.choice(indices, max_per_class, replace=False)
                    X_subset.extend(X[indices])
                    y_subset.extend(y[indices])
                X = np.array(X_subset)
                y = np.array(y_subset)
            all_X.append(X)
            all_y.append(y)
            print(f"Added {len(X)} samples from {name}")
        except FileNotFoundError:
            print(f"Warning: Dataset {name} not found, skipping")
    
    if not all_X:
        raise ValueError("No datasets found to combine")
    
    X_combined = np.concatenate(all_X, axis=0)
    y_combined = np.concatenate(all_y, axis=0)
    
    print(f"Combined total: {len(X_combined)} samples")
    return X_combined, y_combined


def get_class_distribution(y):
    """
    Get distribution of classes in label array.
    
    Args:
        y: Label array (can be integers or one-hot encoded)
        
    Returns:
        dict: Class distribution as {emotion: count}
    """
    # Convert one-hot to integers if needed
    if len(y.shape) > 1 and y.shape[1] > 1:
        y = np.argmax(y, axis=1)
    
    unique, counts = np.unique(y, return_counts=True)
    distribution = {}
    for idx, count in zip(unique, counts):
        if idx < len(EMOTIONS):
            distribution[EMOTIONS[idx]] = int(count)
    
    return distribution


if __name__ == '__main__':
    # Test the data loader
    print("Testing data loader...")
    
    try:
        # Test loading individual datasets
        print("\n--- Testing individual dataset loading ---")
        for dataset in ['fer2013', 'affectnet', 'ck+', 'raf-db']:
            try:
                X, y = load_preprocessed_data(dataset)
                print(f"{dataset}: {len(X)} samples")
            except FileNotFoundError:
                print(f"{dataset}: Not found")
        
        # Test combining datasets with limit
        print("\n--- Testing dataset combination ---")
        X_combined, y_combined = combine_datasets(['fer2013', 'affectnet'], max_per_class=1000)
        print(f"Combined shape: X={X_combined.shape}, y={y_combined.shape}")
        
        # Test data splits with combined data
        print("\n--- Testing data splits ---")
        splits = get_data_splits(test_size=0.2, val_size=0.1, dataset_name='fer2013')
        
        print("\nData splits:")
        for key, value in splits.items():
            if value is not None:
                print(f"  {key}: {value.shape}")
        
        # Check class distributions
        print("\nClass distribution in training set:")
        train_dist = get_class_distribution(splits['y_train'])
        for emotion, count in train_dist.items():
            print(f"  {emotion}: {count}")
        
        print("\nData loader test completed successfully!")
        
    except Exception as e:
        print(f"Error testing data loader: {e}")
        import traceback
        traceback.print_exc()
