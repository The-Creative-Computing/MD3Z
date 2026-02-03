#!/usr/bin/env python3
"""
Complete DICOM to DICOMweb Static Converter
Generates full structure compatible with OHIF Viewer
"""

import os
import sys
import json
import gzip
import shutil
from pathlib import Path
from collections import defaultdict
import pydicom
from pydicom.encaps import decode_data_sequence
import numpy as np
from PIL import Image
import io

def to_json_compatible(value):
    """Convert DICOM value to JSON-compatible type"""
    if value is None:
        return None
    elif isinstance(value, bytes):
        return value.decode('utf-8', errors='ignore')
    elif hasattr(value, 'isoformat'):
        return value.isoformat()
    elif isinstance(value, (pydicom.uid.UID, pydicom.valuerep.PersonName)):
        return str(value)
    elif isinstance(value, (int, float, str, bool)):
        return value
    elif isinstance(value, list):
        return [to_json_compatible(v) for v in value]
    else:
        return str(value)

def extract_metadata(ds):
    """Extract DICOM metadata as JSON-compatible dict"""
    metadata = {}
    for elem in ds:
        if elem.VR == 'SQ':
            continue  # Skip sequences for simplicity
        
        tag = f"{elem.tag.group:04X}{elem.tag.elem:04X}"
        
        try:
            if elem.VM == 0:
                value = None
            elif elem.VM == 1:
                value = to_json_compatible(elem.value)
            else:
                value = [to_json_compatible(v) for v in elem.value]
            
            metadata[tag] = {
                "vr": elem.VR,
                "Value": [value] if not isinstance(value, list) else value
            }
        except:
            pass
    
    return metadata

def extract_pixel_data_as_png(ds):
    """Extract pixel data and convert to PNG"""
    try:
        # Get pixel array
        pixel_array = ds.pixel_array
        
        # Normalize to 8-bit
        pixel_array = pixel_array.astype(float)
        
        # Apply windowing if available
        if hasattr(ds, 'WindowCenter') and hasattr(ds, 'WindowWidth'):
            center = float(ds.WindowCenter[0] if isinstance(ds.WindowCenter, list) else ds.WindowCenter)
            width = float(ds.WindowWidth[0] if isinstance(ds.WindowWidth, list) else ds.WindowWidth)
            
            img_min = center - width / 2
            img_max = center + width / 2
            pixel_array = np.clip(pixel_array, img_min, img_max)
        
        # Normalize to 0-255
        pixel_array = ((pixel_array - pixel_array.min()) / (pixel_array.max() - pixel_array.min()) * 255).astype(np.uint8)
        
        # Convert to PIL Image
        img = Image.fromarray(pixel_array)
        
        # Convert to PNG bytes
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return buffer.getvalue()
    except Exception as e:
        print(f"  Warning: Could not extract pixel data: {e}")
        return None

def create_thumbnail(pixel_data_png, size=(128, 128)):
    """Create thumbnail from PNG data"""
    try:
        img = Image.open(io.BytesIO(pixel_data_png))
        img.thumbnail(size, Image.Resampling.LANCZOS)
        
        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        return buffer.getvalue()
    except Exception as e:
        print(f"  Warning: Could not create thumbnail: {e}")
        return None

def convert_study(source_dir, output_dir):
    """Convert DICOM files to DICOMweb static structure"""
    
    source_path = Path(source_dir)
    output_path = Path(output_dir)
    
    # Find all DICOM files
    print("🔍 Buscando archivos DICOM...")
    dicom_files = []
    for file_path in source_path.rglob('*'):
        if file_path.is_file() and 'DICOMDIR' not in str(file_path):
            try:
                # Try to read as DICOM
                ds = pydicom.dcmread(file_path, stop_before_pixels=True, force=True)
                if hasattr(ds, 'StudyInstanceUID'):
                    dicom_files.append(file_path)
            except:
                pass
    
    print(f"✅ Encontrados {len(dicom_files)} archivos DICOM")
    
    if not dicom_files:
        print("❌ No se encontraron archivos DICOM válidos")
        return
    
    # Group by Study and Series
    studies = defaultdict(lambda: defaultdict(list))
    
    print("📊 Agrupando por estudio y serie...")
    for i, file_path in enumerate(dicom_files):
        try:
            ds = pydicom.dcmread(file_path, force=True)
            
            study_uid = ds.StudyInstanceUID
            series_uid = ds.SeriesInstanceUID
            instance_uid = ds.SOPInstanceUID
            
            studies[study_uid][series_uid].append({
                'path': file_path,
                'instance_uid': instance_uid,
                'ds': ds
            })
            
            if (i + 1) % 50 == 0:
                print(f"  Procesados {i + 1}/{len(dicom_files)} archivos...")
        except Exception as e:
            print(f"  Warning: Error leyendo {file_path}: {e}")
    
    print(f"✅ Encontrados {len(studies)} estudios")
    
    # Process each study
    for study_uid, series_dict in studies.items():
        print(f"\n📁 Procesando estudio: {study_uid[:20]}...")
        
        study_dir = output_path / 'studies' / study_uid
        study_dir.mkdir(parents=True, exist_ok=True)
        
        study_metadata_list = []
        
        # Process each series
        for series_uid, instances in series_dict.items():
            print(f"  📂 Serie: {series_uid[:20]}... ({len(instances)} imágenes)")
            
            series_dir = study_dir / 'series' / series_uid
            series_dir.mkdir(parents=True, exist_ok=True)
            
            instances_dir = series_dir / 'instances'
            instances_dir.mkdir(parents=True, exist_ok=True)
            
            series_metadata_list = []
            instance_index_list = []
            
            # Process each instance
            for idx, instance_data in enumerate(instances):
                instance_uid = instance_data['instance_uid']
                ds = instance_data['ds']
                
                if (idx + 1) % 20 == 0:
                    print(f"    Procesando imagen {idx + 1}/{len(instances)}...")
                
                # Extract metadata
                metadata = extract_metadata(ds)
                series_metadata_list.append(metadata)
                
                # Create instance directory
                instance_dir = instances_dir / instance_uid
                instance_dir.mkdir(parents=True, exist_ok=True)
                
                # Extract and save pixel data as frame
                pixel_data_png = extract_pixel_data_as_png(ds)
                if pixel_data_png:
                    frames_dir = instance_dir / 'frames'
                    frames_dir.mkdir(exist_ok=True)
                    
                    frame_file = frames_dir / '1'
                    frame_file.write_bytes(pixel_data_png)
                    
                    # Create thumbnail
                    thumbnail_data = create_thumbnail(pixel_data_png)
                    if thumbnail_data:
                        thumbnail_file = instance_dir / 'thumbnail'
                        thumbnail_file.write_bytes(thumbnail_data)
                
                # Add to instance index
                instance_index_list.append({
                    "00080018": {"vr": "UI", "Value": [instance_uid]},
                })
            
            # Save series metadata
            metadata_file = series_dir / 'metadata'
            with gzip.open(str(metadata_file) + '.gz', 'wt') as f:
                json.dump(series_metadata_list, f, separators=(',', ':'))
            
            # Save instances index
            instances_index_file = instances_dir / 'index.json'
            with gzip.open(str(instances_index_file) + '.gz', 'wt') as f:
                json.dump(instance_index_list, f, separators=(',', ':'))
            
            # Add first instance metadata to study metadata
            if series_metadata_list:
                study_metadata_list.append(series_metadata_list[0])
            
            print(f"    ✅ Serie completada")
        
        # Save study index
        study_index_file = output_path / 'studies' / 'index.json'
        
        # Create study list entry
        first_ds = list(series_dict.values())[0][0]['ds']
        study_entry = {
            "0020000D": {"vr": "UI", "Value": [study_uid]},
            "00100010": {"vr": "PN", "Value": [{"Alphabetic": str(getattr(first_ds, 'PatientName', 'Unknown'))}]},
            "00100020": {"vr": "LO", "Value": [str(getattr(first_ds, 'PatientID', ''))]},
            "00080020": {"vr": "DA", "Value": [str(getattr(first_ds, 'StudyDate', ''))]},
            "00080030": {"vr": "TM", "Value": [str(getattr(first_ds, 'StudyTime', ''))]},
            "00080050": {"vr": "SH", "Value": [str(getattr(first_ds, 'AccessionNumber', ''))]},
            "00080060": {"vr": "CS", "Value": [str(getattr(first_ds, 'Modality', ''))]},
            "00081030": {"vr": "LO", "Value": [str(getattr(first_ds, 'StudyDescription', ''))]},
        }
        
        # Load existing index or create new
        existing_studies = []
        if study_index_file.exists():
            try:
                with open(study_index_file, 'r') as f:
                    existing_studies = json.load(f)
            except:
                pass
        
        # Remove duplicate if exists
        existing_studies = [s for s in existing_studies if s.get("0020000D", {}).get("Value", [None])[0] != study_uid]
        
        # Add current study
        existing_studies.append(study_entry)
        
        # Save index
        with open(study_index_file, 'w') as f:
            json.dump(existing_studies, f, indent=2)
        
        # Save compressed version
        with gzip.open(str(study_index_file) + '.gz', 'wt') as f:
            json.dump(existing_studies, f, separators=(',', ':'))
        
        print(f"✅ Estudio completado: {study_uid[:20]}...")

if __name__ == "__main__":
    print("="*60)
    print("🏥 DICOM to DICOMweb Converter - Complete Edition")
    print("="*60)
    
    source_dir = "/Users/cesar/Library/CloudStorage/Dropbox/Projects/M3DZ/DICOM VIEWER/MD3Z/dicom-source/DICOM RODRIGUEZ ABREU_CESAR AUGUSTO_19950412_DICOM"
    output_dir = "/Users/cesar/Library/CloudStorage/Dropbox/Projects/M3DZ/DICOM VIEWER/MD3Z/dicomweb-data"
    
    print(f"\n📂 Directorio origen: {source_dir}")
    print(f"📂 Directorio destino: {output_dir}")
    print()
    
    try:
        convert_study(source_dir, output_dir)
        print("\n" + "="*60)
        print("✅ CONVERSIÓN COMPLETADA")
        print("="*60)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
