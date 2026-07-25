import os
os.environ['TF_USE_LEGACY_KERAS'] = '1'
import numpy as np
import tensorflow as tf
from tf_keras.preprocessing.image import ImageDataGenerator
from tf_keras.callbacks import EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
from tf_keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tf_keras.models import Model
from tf_keras.applications import EfficientNetB3
from tf_keras.optimizers import Adam
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime

# Configuration
DATASET_PATH = 'dataset'
MODEL_SAVE_PATH = 'model/final_emotion_model.keras'
TRAIN_PATH = os.path.join(DATASET_PATH, 'train')
VAL_PATH = os.path.join(DATASET_PATH, 'validation')
TEST_PATH = os.path.join(DATASET_PATH, 'test')

IMG_SIZE = (300, 300)  # EfficientNet-B3 input size
BATCH_SIZE = 32
EPOCHS = 50
LEARNING_RATE = 0.001
NUM_CLASSES = 7

EMOTIONS = ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted']

def create_data_generators():
    """Create training, validation, and test data generators"""
    
    # Data augmentation for training
    train_datagen = ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        horizontal_flip=True,
        zoom_range=0.2,
        shear_range=0.2,
        fill_mode='nearest'
    )
    
    # Only rescaling for validation and test
    val_datagen = ImageDataGenerator(rescale=1./255)
    test_datagen = ImageDataGenerator(rescale=1./255)
    
    # Load data
    train_generator = train_datagen.flow_from_directory(
        TRAIN_PATH,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=EMOTIONS,
        shuffle=True
    )
    
    val_generator = val_datagen.flow_from_directory(
        VAL_PATH,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=EMOTIONS,
        shuffle=False
    )
    
    test_generator = test_datagen.flow_from_directory(
        TEST_PATH,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        classes=EMOTIONS,
        shuffle=False
    )
    
    return train_generator, val_generator, test_generator

def build_model():
    """Build EfficientNet-B3 model for emotion classification"""

    # Load pre-trained EfficientNet-B3
    base_model = EfficientNetB3(
        weights='imagenet',
        include_top=False,
        input_shape=(300, 300, 3)
    )

    # Freeze base model layers initially
    for layer in base_model.layers:
        layer.trainable = False

    # Add custom classification head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(512, activation='relu')(x)
    x = Dropout(0.5)(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.3)(x)
    predictions = Dense(NUM_CLASSES, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)

    return model, base_model

def train_model(model, train_generator, val_generator):
    """Train the emotion classification model"""
    
    # Callbacks
    early_stopping = EarlyStopping(
        monitor='val_loss',
        patience=10,
        restore_best_weights=True,
        verbose=1
    )
    
    model_checkpoint = ModelCheckpoint(
        MODEL_SAVE_PATH,
        monitor='val_accuracy',
        save_best_only=True,
        verbose=1
    )
    
    reduce_lr = ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.2,
        patience=5,
        min_lr=1e-6,
        verbose=1
    )
    
    # Compile model
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Train model
    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=val_generator,
        callbacks=[early_stopping, model_checkpoint, reduce_lr],
        verbose=1
    )
    
    return history

def fine_tune_model(model, base_model, train_generator, val_generator):
    """Fine-tune the model by unfreezing some layers"""
    
    # Unfreeze last 20 layers
    for layer in base_model.layers[-20:]:
        layer.trainable = True
    
    # Recompile with lower learning rate
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE/10),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Fine-tune
    history_fine = model.fit(
        train_generator,
        epochs=20,
        validation_data=val_generator,
        callbacks=[
            EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True),
            ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, min_lr=1e-7)
        ],
        verbose=1
    )
    
    return history_fine

def evaluate_model(model, test_generator):
    """Evaluate the model on test set"""
    
    # Load best model
    model.load_weights(MODEL_SAVE_PATH)
    
    # Evaluate
    test_loss, test_accuracy = model.evaluate(test_generator, verbose=1)
    print(f"\nTest Accuracy: {test_accuracy:.4f}")
    print(f"Test Loss: {test_loss:.4f}")
    
    # Predictions
    test_generator.reset()
    y_pred = model.predict(test_generator)
    y_pred_classes = np.argmax(y_pred, axis=1)
    y_true = test_generator.classes
    
    # Classification report
    print("\nClassification Report:")
    print(classification_report(y_true, y_pred_classes, target_names=EMOTIONS))
    
    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred_classes)
    plt.figure(figsize=(10, 8))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', xticklabels=EMOTIONS, yticklabels=EMOTIONS)
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.savefig('model/confusion_matrix.png')
    plt.close()
    
    return test_accuracy

def plot_training_history(history):
    """Plot training history"""
    
    plt.figure(figsize=(12, 4))
    
    # Plot accuracy
    plt.subplot(1, 2, 1)
    plt.plot(history.history['accuracy'], label='Training Accuracy')
    plt.plot(history.history['val_accuracy'], label='Validation Accuracy')
    plt.title('Training and Validation Accuracy')
    plt.xlabel('Epoch')
    plt.ylabel('Accuracy')
    plt.legend()
    
    # Plot loss
    plt.subplot(1, 2, 2)
    plt.plot(history.history['loss'], label='Training Loss')
    plt.plot(history.history['val_loss'], label='Validation Loss')
    plt.title('Training and Validation Loss')
    plt.xlabel('Epoch')
    plt.ylabel('Loss')
    plt.legend()
    
    plt.tight_layout()
    plt.savefig('model/training_history.png')
    plt.close()

def main():
    """Main training pipeline"""
    
    print("=" * 50)
    print("Emotion Detection Model Training")
    print("=" * 50)
    
    # Check if dataset exists
    if not os.path.exists(DATASET_PATH):
        print(f"\nError: Dataset folder '{DATASET_PATH}' not found!")
        print("Please create the dataset folder structure first.")
        print("See DATASET_SETUP.md for instructions.")
        return
    
    # Create model directory
    os.makedirs('model', exist_ok=True)
    
    # Create data generators
    print("\nCreating data generators...")
    train_generator, val_generator, test_generator = create_data_generators()
    print(f"Training samples: {train_generator.samples}")
    print(f"Validation samples: {val_generator.samples}")
    print(f"Test samples: {test_generator.samples}")
    
    # Build model
    print("\nBuilding EfficientNet-B0 model...")
    model, base_model = build_model()
    model.summary()
    
    # Train model
    print("\nStarting training...")
    history = train_model(model, train_generator, val_generator)
    
    # Fine-tune
    print("\nFine-tuning model...")
    history_fine = fine_tune_model(model, base_model, train_generator, val_generator)
    
    # Plot training history
    print("\nPlotting training history...")
    plot_training_history(history_fine)
    
    # Evaluate model
    print("\nEvaluating model...")
    test_accuracy = evaluate_model(model, test_generator)
    
    # Save final model
    print(f"\nModel saved to: {MODEL_SAVE_PATH}")
    print(f"Final Test Accuracy: {test_accuracy:.4f}")
    print("\nTraining completed successfully!")

if __name__ == '__main__':
    main()
