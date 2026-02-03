#!/usr/bin/env python3
"""
Fix RODRIGUEZ ABREU study structure to match SALAS DUARTE format
"""

import os
import json
import gzip
import shutil
from pathlib import Path
import pydicom

# Paths
study_dir = Path("/Users/cesar/Library/CloudStorage/Dropbox/Projects/M3DZ/DICOM VIEWER/MD3Z/dicomweb-data/studies/1.76.380.18.15921314907711109008907519031149552719953362")
source_dicom_dir = Path("/Users/cesar/Library/CloudStorage/Dropbox/Projects/M3DZ/DICOM VIEWER/MD3Z/dicom-source/DICOM RODRIGUEZ ABREU_CESAR AUGUSTO_19950412_DICOM")

print("="*60)
print("🔧 Arreglando estructura de RODRIGUEZ ABREU")
print("="*60)

# Find one DICOM file to extract series metadata
print("\n1️⃣ Buscando archivo DICOM de referencia...")
sample_dicom = None
for file_path in source_dicom_dir.rglob('*'):
    if file_path.is_file() and 'DICOMDIR' not in str(file_path):
        try:
            ds = pydicom.dcmread(file_path, force=True)
            if hasattr(ds, 'SeriesInstanceUID'):
                sample_dicom = ds
                break
        except:
            pass

if not sample_dicom:
    print("❌ No se encontró archivo DICOM válido")
    exit(1)

print(f"✅ Archivo de referencia encontrado")

# Extract series info
study_uid = str(sample_dicom.StudyInstanceUID)
series_uid = str(sample_dicom.SeriesInstanceUID)

print(f"\n2️⃣ Información extraída:")
print(f"   Study UID: {study_uid[:30]}...")
print(f"   Series UID: {series_uid[:30]}...")

series_dir = study_dir / 'series' / series_uid

if not series_dir.exists():
    print(f"❌ No se encontró carpeta de series: {series_dir}")
    exit(1)

# 3. Create series-singleton.json.gz
print("\n3️⃣ Generando series-singleton.json.gz...")

series_singleton = [{
    "0020000D": {
        "vr": "UI",
        "Value": [study_uid]
    },
    "0020000E": {
        "vr": "UI",
        "Value": [series_uid]
    },
    "00080060": {
        "vr": "CS",
        "Value": [str(getattr(sample_dicom, 'Modality', 'CT'))]
    },
    "0008103E": {
        "vr": "LO",
        "Value": [str(getattr(sample_dicom, 'SeriesDescription', 'Series'))]
    },
    "00200011": {
        "vr": "IS",
        "Value": [int(getattr(sample_dicom, 'SeriesNumber', 1))]
    },
    "00080021": {
        "vr": "DA",
        "Value": [str(getattr(sample_dicom, 'SeriesDate', ''))]
    },
    "00080031": {
        "vr": "TM",
        "Value": [str(getattr(sample_dicom, 'SeriesTime', ''))]
    },
    "00080005": {
        "vr": "CS",
        "Value": ["ISO_IR 192"]
    }
}]

series_singleton_file = series_dir / 'series-singleton.json.gz'
with gzip.open(series_singleton_file, 'wt') as f:
    json.dump(series_singleton, f, separators=(',', ':'))

print(f"✅ Creado: series-singleton.json.gz")

# 4. Create series thumbnail (copy from first instance)
print("\n4️⃣ Creando thumbnail de la serie...")

instances_dir = series_dir / 'instances'
first_instance_dir = None

# Find first instance with thumbnail
for instance_dir in sorted(instances_dir.iterdir()):
    if instance_dir.is_dir():
        thumbnail_path = instance_dir / 'thumbnail'
        if thumbnail_path.exists():
            first_instance_dir = instance_dir
            break

if first_instance_dir:
    source_thumbnail = first_instance_dir / 'thumbnail'
    dest_thumbnail = series_dir / 'thumbnail'
    
    shutil.copy2(source_thumbnail, dest_thumbnail)
    print(f"✅ Creado: thumbnail")
else:
    print("⚠️  No se encontró thumbnail en instancias")

# 5. Verify metadata.gz size and optimize if needed
print("\n5️⃣ Verificando metadata.gz...")

metadata_file = series_dir / 'metadata.gz'
metadata_size_mb = metadata_file.stat().st_size / (1024 * 1024)

print(f"   Tamaño actual: {metadata_size_mb:.1f} MB")

if metadata_size_mb > 10:
    print("⚠️  El archivo metadata.gz es muy grande (>10 MB)")
    print("   Esto puede causar problemas de carga")
    print("   Considerando optimización...")
    
    # Load and check metadata
    with gzip.open(metadata_file, 'rt') as f:
        metadata_list = json.load(f)
    
    print(f"   Contiene {len(metadata_list)} instancias")
    
    # If too large, we might need to split or reduce
    # For now, just report
    if len(metadata_list) > 500:
        print("   ⚠️  Demasiadas instancias para un solo metadata.gz")
        print("   OHIF puede tener problemas cargando esto")

print("\n" + "="*60)
print("✅ ESTRUCTURA CORREGIDA")
print("="*60)
print("\nArchivos creados:")
print(f"  ✓ {series_singleton_file}")
print(f"  ✓ {series_dir / 'thumbnail'}")
print("\nAhora reinicia el servidor para probar.")
