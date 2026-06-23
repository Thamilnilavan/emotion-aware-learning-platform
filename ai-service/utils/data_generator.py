"""
Data generator for training on large datasets without memory issues.
Loads data in batches from preprocessed numpy arrays.
"""

import numpy as np
from pathlib import Path
from tensorflow.keras.utils import Sequence

class EmotionDataGenerator(Sequence):
    """
    Data generator for emotion detection training.
    Loads data in batches from preprocessed numpy files.
    """
    
    def __init__(self, x_path, y_path, batch_size=32, shuffle=True):
        """
        Initialize the data generator.
        
        Args:
            x_path: Path to X.npy file
            y_path: Path to y.npy file  
            batch_size: Batch size for training
            shuffle: Whether to shuffle data after each epoch
        """
        self.x_path = Path(x_path)
        self.y_path = Path(y_path)
        self.batch_size = batch_size
        self.shuffle = shuffle
        
        # Load data metadata
        self.X = np.load(self.x_path)
        self.y = np.load(self.y_path)
        self.num_samples = len(self.X)
        
        # Convert labels to one-hot encoding
        from tensorflow.keras.utils import to_categorical
        self.y = to_categorical(self.y, num_classes=7)
        
        self.indices = np.arange(self.num_samples)
        if self.shuffle:
            np.random.shuffle(self.indices)
    
    def __len__(self):
        """Number of batches per epoch."""
        return int(np.ceil(self.num_samples / self.batch_size))
    
    def __getitem__(self, idx):
        """Get one batch of data."""
        batch_indices = self.indices[idx * self.batch_size:(idx + 1) * self.batch_size]
        batch_x = self.X[batch_indices]
        batch_y = self.y[batch_indices]
        return batch_x, batch_y
    
    def on_epoch_end(self):
        """Shuffle data after each epoch."""
        if self.shuffle:
            np.random.shuffle(self.indices)


def get_train_val_generators(dataset_name='fer2013', batch_size=32, val_split=0.1):
    """
    Create training and validation data generators.
    
    Args:
        dataset_name: Name of dataset to use
        batch_size: Batch size for training
        val_split: Proportion of data for validation
        
    Returns:
        tuple: (train_generator, val_generator, num_train_samples, num_val_samples)
    """
    # Get paths
    base_path = Path(__file__).resolve().parent.parent / 'saved_models'
    data_path = base_path / f'preprocessed_{dataset_name.lower()}'
    x_path = data_path / 'X.npy'
    y_path = data_path / 'y.npy'
    
    if not x_path.exists() or not y_path.exists():
        raise FileNotFoundError(f"Preprocessed data not found at {data_path}")
    
    # Load all data to split
    X = np.load(x_path)
    y = np.load(y_path)
    num_samples = len(X)
    
    print(f"Loaded {num_samples} samples from {dataset_name}")
    
    # Split indices for train/val
    from sklearn.model_selection import train_test_split
    indices = np.arange(num_samples)
    train_indices, val_indices = train_test_split(
        indices, test_size=val_split, random_state=42, stratify=y
    )
    
    # Save split data temporarily for generators
    train_x_path = data_path / 'X_train_temp.npy'
    train_y_path = data_path / 'y_train_temp.npy'
    val_x_path = data_path / 'X_val_temp.npy'
    val_y_path = data_path / 'y_val_temp.npy'
    
    np.save(train_x_path, X[train_indices])
    np.save(train_y_path, y[train_indices])
    np.save(val_x_path, X[val_indices])
    np.save(val_y_path, y[val_indices])
    
    # Create generators
    train_generator = EmotionDataGenerator(train_x_path, train_y_path, batch_size, shuffle=True)
    val_generator = EmotionDataGenerator(val_x_path, val_y_path, batch_size, shuffle=False)
    
    print(f"Train samples: {len(train_indices)}, Val samples: {len(val_indices)}")
    
    return train_generator, val_generator, len(train_indices), len(val_indices)


def get_test_generator(dataset_name='fer2013', batch_size=32):
    """
    Create test data generator.
    
    Args:
        dataset_name: Name of dataset to use
        batch_size: Batch size for testing
        
    Returns:
        tuple: (test_generator, num_test_samples)
    """
    # Get paths
    base_path = Path(__file__).resolve().parent.parent / 'saved_models'
    data_path = base_path / f'preprocessed_{dataset_name.lower()}'
    x_path = data_path / 'X.npy'
    y_path = data_path / 'y.npy'
    
    if not x_path.exists() or not y_path.exists():
        raise FileNotFoundError(f"Preprocessed data not found at {data_path}")
    
    # Load all data to split
    X = np.load(x_path)
    y = np.load(y_path)
    num_samples = len(X)
    
    # Use 20% for testing
    from sklearn.model_selection import train_test_split
    indices = np.arange(num_samples)
    _, test_indices = train_test_split(
        indices, test_size=0.2, random_state=42, stratify=y
    )
    
    # Save test data temporarily
    test_x_path = data_path / 'X_test_temp.npy'
    test_y_path = data_path / 'y_test_temp.npy'
    
    np.save(test_x_path, X[test_indices])
    np.save(test_y_path, y[test_indices])
    
    # Create generator
    test_generator = EmotionDataGenerator(test_x_path, test_y_path, batch_size, shuffle=False)
    
    print(f"Test samples: {len(test_indices)}")
    
    return test_generator, len(test_indices)


if __name__ == '__main__':
    # Test the data generator
    print("Testing data generator...")
    
    try:
        train_gen, val_gen, num_train, num_val = get_train_val_generators('fer2013', batch_size=32)
        print(f"\nTrain generator batches: {len(train_gen)}")
        print(f"Val generator batches: {len(val_gen)}")
        
        # Test getting a batch
        x_batch, y_batch = train_gen[0]
        print(f"\nBatch shape: X={x_batch.shape}, y={y_batch.shape}")
        
        print("\nData generator test completed successfully!")
        
    except Exception as e:
        print(f"Error testing data generator: {e}")
        import traceback
        traceback.print_exc()
