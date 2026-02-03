#!/usr/bin/env python3
"""
Simple DICOM to DICOMweb converter using pydicom
Converts DICOM files to basic DICOMweb structure
"""

import os
import sys
import json
import shutil
from pathlib import Path
from collections import defaultdict

try:
    import pydicom
except ImportError:
    print("Error: pydicom not installed")
    print("Install with: pip3 install pydicom")
    sys.exit(1)

def find_dicom_files(directory):
    """Find all DICOM files in directory"""
    dicom_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith(('.dcm', '.dicom')) or not '.' in file:
                filepath = os.path.join(root, file)
                dicom_files.append(filepath)
    return dicom_files

def dicom_to_json(ds):
    """Convert DICOM dataset to JSON format"""
    result = {}
    for elem in ds:
        if elem.VR == 'SQ':
            # Skip sequences for now (complex)
            continue

        tag = f"{elem.tag.group:04X}{elem.tag.element:04X}"

        value_dict = {"vr": elem.VR}

        if elem.value is not None:
            if elem.VM > 1:
                value_dict["Value"] = [str(v) for v in elem.value]
            else:
                if elem.VR in ['PN']:
                    value_dict["Value"] = [{"Alphabetic": str(elem.value)}]
                else:
                    value_dict["Value"] = [str(elem.value)]

        result[tag] = value_dict

    return result

def convert_study(source_dir, output_dir):
    """Convert DICOM study to DICOMweb format"""

    print(f"\n🔍 Scanning: {source_dir}")
    dicom_files = find_dicom_files(source_dir)
    print(f"📊 Found {len(dicom_files)} DICOM files")

    if not dicom_files:
        print("❌ No DICOM files found")
        return False

    # Group by study
    studies = defaultdict(lambda: defaultdict(list))

    print("📖 Reading DICOM files...")
    for i, filepath in enumerate(dicom_files):
        try:
            ds = pydicom.dcmread(filepath, force=True)

            study_uid = str(ds.StudyInstanceUID)
            series_uid = str(ds.SeriesInstanceUID)

            studies[study_uid][series_uid].append((filepath, ds))

            if (i + 1) % 100 == 0:
                print(f"   Processed {i + 1}/{len(dicom_files)} files...")

        except Exception as e:
            print(f"⚠️  Error reading {os.path.basename(filepath)}: {e}")
            continue

    print(f"\n✅ Found {len(studies)} study(ies)")

    # Convert each study
    for study_uid, series_dict in studies.items():
        print(f"\n📁 Processing Study: {study_uid[:16]}...")

        study_dir = Path(output_dir) / "studies" / study_uid
        study_dir.mkdir(parents=True, exist_ok=True)

        # Create study-level metadata
        study_instances = []
        series_list = []

        for series_uid, instances in series_dict.items():
            print(f"   📋 Series: {series_uid[:16]}... ({len(instances)} instances)")

            series_dir = study_dir / "series" / series_uid
            series_dir.mkdir(parents=True, exist_ok=True)

            # Create series metadata
            series_metadata = []

            for filepath, ds in instances:
                # Convert to JSON
                metadata = dicom_to_json(ds)
                series_metadata.append(metadata)
                study_instances.append(metadata)

            # Write series metadata
            metadata_file = series_dir / "metadata.json"
            with open(metadata_file, 'w') as f:
                json.dump(series_metadata, f, indent=2)

            # Create series index
            if series_metadata:
                series_info = series_metadata[0].copy()
                series_info["0020000E"] = {"vr": "UI", "Value": [series_uid]}
                series_info["00201209"] = {"vr": "IS", "Value": [str(len(instances))]}
                series_list.append(series_info)

        # Write series index
        series_index_file = study_dir / "series" / "index.json"
        with open(series_index_file, 'w') as f:
            json.dump(series_list, f, indent=2)

        # Write study index
        if study_instances:
            study_info = study_instances[0].copy()
            study_info["0020000D"] = {"vr": "UI", "Value": [study_uid]}
            study_info["00201208"] = {"vr": "IS", "Value": [str(len(study_instances))]}
            study_info["00201206"] = {"vr": "IS", "Value": [str(len(series_dict))]}

            # Create studies index
            studies_index = Path(output_dir) / "studies" / "index.json"

            if studies_index.exists():
                with open(studies_index, 'r') as f:
                    existing = json.load(f)
            else:
                existing = []

            # Add this study
            existing = [s for s in existing if s.get("0020000D", {}).get("Value", [""])[0] != study_uid]
            existing.append(study_info)

            with open(studies_index, 'w') as f:
                json.dump(existing, f, indent=2)

        print(f"   ✅ Study converted")

    print(f"\n🎉 Conversion complete!")
    print(f"📂 Output: {output_dir}/studies/")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 convert-to-dicomweb-simple.py <source_dir> <output_dir>")
        sys.exit(1)

    source_dir = sys.argv[1]
    output_dir = sys.argv[2]

    if not os.path.exists(source_dir):
        print(f"Error: Source directory not found: {source_dir}")
        sys.exit(1)

    print("=" * 60)
    print("  M3DZ - DICOM to DICOMweb Converter")
    print("=" * 60)

    success = convert_study(source_dir, output_dir)
    sys.exit(0 if success else 1)
