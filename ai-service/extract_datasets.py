"""
Extract dataset zip files in the datasets folder.
"""
import zipfile
from pathlib import Path

def extract_all():
    datasets_root = Path(__file__).parent / 'datasets'
    
    print(f"Looking for datasets in: {datasets_root}")
    print(f"Datasets root exists: {datasets_root.exists()}")
    
    # Datasets where zip is inside the folder
    datasets_to_extract = [
        ('FER2013/FER2013.zip', 'FER2013'),
        ('AffectNet/AffectNet.zip', 'AffectNet'),
        ('CK+/CK+.zip', 'CK+'),
        ('RAF-DB/RAF-DB.zip', 'RAF-DB'),
    ]
    
    for zip_relative, extract_to in datasets_to_extract:
        zip_path = datasets_root / zip_relative
        extract_path = datasets_root / extract_to
        
        print(f"\nChecking {zip_relative}:")
        print(f"  Zip path: {zip_path}")
        print(f"  Exists: {zip_path.exists()}")
        
        if not zip_path.exists():
            print(f"  Skipping {zip_relative} - not found")
            continue
            
        print(f"  Extracting {zip_relative}...")
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(extract_path)
            print(f"  -> Extracted to {extract_path}")
        except Exception as e:
            print(f"  -> Error: {e}")

if __name__ == '__main__':
    extract_all()
