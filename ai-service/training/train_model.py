"""
Training script for emotion detection model.
Uses preprocessed datasets to train a CNN model for facial emotion recognition.
"""

import argparse
import numpy as np
from pathlib import Path
import json
from datetime import datetime

import tensorflow as tf
from tensorflow.keras import layers, models, callbacks
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau

import sys
sys.path.append(str(Path(__file__).parent.parent))
from utils.data_loader import get_data_splits, combine_datasets, EMOTIONS, NUM_CLASSES
from utils.data_generator import get_train_val_generators, get_test_generator

def build_cnn_model(input_shape=(96, 96, 3), num_classes=NUM_CLASSES):
    """
    Build a CNN model for emotion detection.
    
    Args:
        input_shape: Input image shape (height, width, channels)
        num_classes: Number of emotion classes
        
    Returns:
        Compiled Keras model
    """
    model = models.Sequential([
        # First convolutional block
        layers.Conv2D(32, (3, 3), activation='relu', padding='same', input_shape=input_shape),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Second convolutional block
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Third convolutional block
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Fourth convolutional block
        layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Flatten and dense layers
        layers.Flatten(),
        layers.Dense(512, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(num_classes, activation='softmax')
    ])
    
    model.compile(
        optimizer=Adam(learning_rate=0.001),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model


def train_model(dataset_name='fer2013', epochs=50, batch_size=32, learning_rate=0.001, max_samples=None):
    """
    Train emotion detection model.
    
    Args:
        dataset_name: Dataset to use for training
        epochs: Number of training epochs
        batch_size: Training batch size
        learning_rate: Learning rate for optimizer
        max_samples: Optional limit on total samples to use (for memory constraints)
        
    Returns:
        Trained model and training history
    """
    print(f"Loading data from {dataset_name}...")
    
    # Use data generator if max_samples is not specified (full dataset)
    if max_samples is None:
        print("Using data generator for full dataset (memory-efficient)")
        train_gen, val_gen, num_train, num_val = get_train_val_generators(
            dataset_name, batch_size=batch_size, val_split=0.1
        )
        test_gen, num_test = get_test_generator(dataset_name, batch_size=batch_size)
        
        print(f"Training samples: {num_train}")
        print(f"Validation samples: {num_val}")
        print(f"Test samples: {num_test}")
        
        # Get input shape from first batch
        x_batch, _ = train_gen[0]
        input_shape = x_batch.shape[1:]
        
        # Build model
        print("Building model...")
        model = build_cnn_model(input_shape=input_shape, num_classes=NUM_CLASSES)
        model.summary()
        
        # Create output directory
        output_dir = Path(__file__).parent.parent / 'saved_models' / 'emotion_detector'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Callbacks
        checkpoint_path = output_dir / 'best_model.keras'
        callbacks_list = [
            ModelCheckpoint(
                str(checkpoint_path),
                monitor='val_accuracy',
                save_best_only=True,
                mode='max',
                verbose=1
            ),
            EarlyStopping(
                monitor='val_accuracy',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            )
        ]
        
        # Train model with generators
        print(f"\nTraining model for {epochs} epochs...")
        history = model.fit(
            train_gen,
            validation_data=val_gen,
            epochs=epochs,
            callbacks=callbacks_list,
            verbose=1
        )
        
        # Evaluate on test set
        print("\nEvaluating on test set...")
        test_loss, test_accuracy = model.evaluate(test_gen, verbose=0)
        print(f"Test accuracy: {test_accuracy:.4f}")
        print(f"Test loss: {test_loss:.4f}")
        
    else:
        # Use limited samples with in-memory loading
        print(f"Using limited samples: {max_samples}")
        splits = get_data_splits(
            test_size=0.2, 
            val_size=0.1, 
            random_state=42,
            dataset_name=dataset_name,
            max_samples=max_samples
        )
        
        X_train = splits['X_train']
        X_val = splits['X_val']
        X_test = splits['X_test']
        y_train = splits['y_train']
        y_val = splits['y_val']
        y_test = splits['y_test']
        
        print(f"Training samples: {len(X_train)}")
        print(f"Validation samples: {len(X_val)}")
        print(f"Test samples: {len(X_test)}")
        
        # Build model
        print("Building model...")
        model = build_cnn_model(input_shape=X_train.shape[1:], num_classes=NUM_CLASSES)
        model.summary()
        
        # Create output directory
        output_dir = Path(__file__).parent.parent / 'saved_models' / 'emotion_detector'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Callbacks
        checkpoint_path = output_dir / 'best_model.keras'
        callbacks_list = [
            ModelCheckpoint(
                str(checkpoint_path),
                monitor='val_accuracy',
                save_best_only=True,
                mode='max',
                verbose=1
            ),
            EarlyStopping(
                monitor='val_accuracy',
                patience=10,
                restore_best_weights=True,
                verbose=1
            ),
            ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=5,
                min_lr=1e-7,
                verbose=1
            )
        ]
        
        # Train model
        print(f"\nTraining model for {epochs} epochs...")
        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            callbacks=callbacks_list,
            verbose=1
        )
        
        # Evaluate on test set
        print("\nEvaluating on test set...")
        test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
        print(f"Test accuracy: {test_accuracy:.4f}")
        print(f"Test loss: {test_loss:.4f}")
    
    # Save final model
    final_model_path = output_dir / 'final_model.keras'
    model.save(final_model_path)
    print(f"Saved final model to {final_model_path}")
    
    # Save training history
    history_path = output_dir / 'training_history.json'
    history_dict = {key: [float(x) for x in value] for key, value in history.history.items()}
    with open(history_path, 'w') as f:
        json.dump(history_dict, f, indent=2)
    print(f"Saved training history to {history_path}")
    
    # Save model metadata
    metadata = {
        'dataset': dataset_name,
        'epochs_trained': len(history.history['loss']),
        'test_accuracy': float(test_accuracy),
        'test_loss': float(test_loss),
        'input_shape': list(input_shape if max_samples is None else X_train.shape[1:]),
        'num_classes': NUM_CLASSES,
        'emotions': EMOTIONS,
        'training_date': datetime.now().isoformat(),
        'used_data_generator': max_samples is None
    }
    metadata_path = output_dir / 'model_metadata.json'
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved model metadata to {metadata_path}")
    
    return model, history


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train emotion detection model')
    parser.add_argument('--dataset', default='fer2013',
                        help='Dataset to use (fer2013, affectnet, ck+, raf-db)')
    parser.add_argument('--epochs', type=int, default=50,
                        help='Number of training epochs')
    parser.add_argument('--batch-size', type=int, default=32,
                        help='Training batch size')
    parser.add_argument('--learning-rate', type=float, default=0.001,
                        help='Learning rate')
    parser.add_argument('--max-samples', type=int, default=None,
                        help='Limit total samples to use (for memory constraints)')
    args = parser.parse_args()
    
    print("=" * 60)
    print("Emotion Detection Model Training")
    print("=" * 60)
    
    try:
        model, history = train_model(
            dataset_name=args.dataset,
            epochs=args.epochs,
            batch_size=args.batch_size,
            learning_rate=args.learning_rate,
            max_samples=args.max_samples
        )
        
        print("\n" + "=" * 60)
        print("Training completed successfully!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nError during training: {e}")
        import traceback
        traceback.print_exc()
