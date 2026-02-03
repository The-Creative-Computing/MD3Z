#!/usr/bin/env python3
"""
Optimize metadata.gz by keeping only essential DICOM tags
"""

import json
import gzip
from pathlib import Path

# Essential tags that OHIF needs
ESSENTIAL_TAGS = {
    '00080018',  # SOPInstanceUID
    '0020000D',  # StudyInstanceUID
    '0020000E',  # SeriesInstanceUID
    '00080016',  # SOPClassUID
    '00080060',  # Modality
    '00200013',  # InstanceNumber
    '00200032',  # ImagePositionPatient
    '00200037',  # ImageOrientationPatient
    '00280010',  # Rows
    '00280011',  # Columns
    '00280030',  # PixelSpacing
    '00280100',  # BitsAllocated
    '00280101',  # BitsStored
    '00280102',  # HighBit
    '00280103',  # PixelRepresentation
    '00281050',  # WindowCenter
    '00281051',  # WindowWidth
    '00281052',  # RescaleIntercept
    '00281053',  # RescaleSlope
    '00180050',  # SliceThickness
    '00200012',  # AcquisitionNumber
}

series_dir = Path("/Users/cesar/Library/CloudStorage/Dropbox/Projects/M3DZ/DICOM VIEWER/MD3Z/dicomweb-data/studies/1.76.380.18.15921314907711109008907519031149552719953362/series/1.76.380.18.18.1251013153001021.739.92.11")

metadata_file = series_dir / 'metadata.gz'
backup_file = series_dir / 'metadata_original.gz'

print("="*60)
print("🔧 Optimizando metadata.gz")
print("="*60)

print(f"\n1️⃣ Cargando metadata original...")
with gzip.open(metadata_file, 'rt') as f:
    original_metadata = json.load(f)

original_size_mb = metadata_file.stat().st_size / (1024 * 1024)
print(f"   Tamaño original: {original_size_mb:.1f} MB")
print(f"   Instancias: {len(original_metadata)}")

print(f"\n2️⃣ Creando backup...")
import shutil
shutil.copy2(metadata_file, backup_file)
print(f"   ✅ Backup creado: metadata_original.gz")

print(f"\n3️⃣ Optimizando metadatos...")
optimized_metadata = []

for instance_meta in original_metadata:
    # Keep only essential tags
    filtered_meta = {}
    for tag, data in instance_meta.items():
        if tag in ESSENTIAL_TAGS:
            filtered_meta[tag] = data
    
    optimized_metadata.append(filtered_meta)

print(f"   Tags originales por instancia: ~{len(original_metadata[0]) if original_metadata else 0}")
print(f"   Tags optimizados por instancia: ~{len(optimized_metadata[0]) if optimized_metadata else 0}")

print(f"\n4️⃣ Guardando metadata optimizado...")
with gzip.open(metadata_file, 'wt') as f:
    json.dump(optimized_metadata, f, separators=(',', ':'))

new_size_mb = metadata_file.stat().st_size / (1024 * 1024)
reduction_pct = ((original_size_mb - new_size_mb) / original_size_mb) * 100

print(f"   ✅ Guardado")
print(f"\n📊 Resultados:")
print(f"   Tamaño original: {original_size_mb:.1f} MB")
print(f"   Tamaño optimizado: {new_size_mb:.1f} MB")
print(f"   Reducción: {reduction_pct:.1f}%")

if new_size_mb > 5:
    print(f"\n⚠️  Aún es grande (>{new_size_mb:.1f} MB)")
    print(f"   OHIF puede tardar en cargar")
else:
    print(f"\n✅ Tamaño aceptable")

print("\n" + "="*60)
print("✅ OPTIMIZACIÓN COMPLETADA")
print("="*60)
