#!/usr/bin/env python3
# =============================================================================
# COMPANY: VAGUELY VANITY LLC / VENTURE VISION UBUNTU (VVU)
# MODULE: vvu-modelarts-obs-uploader.py
# DESCRIPTION: Automates uploading localized Gqeberha leak detection datasets
#              (YOLO images, annotations, and SCADA telemetry logs) to Huawei
#              Cloud Object Storage Service (OBS) for ModelArts training.
# =============================================================================

import os
import sys
import argparse
from pathlib import Path

# Try to import the Huawei Cloud OBS SDK
try:
    from obs import ObsClient
except ImportError:
    print("[-] Warning: 'esdk-obs-python' (Huawei Cloud OBS SDK) not found locally.")
    print("    To install on your local workstation, run: pip install esdk-obs-python")
    ObsClient = None

def load_env_variables():
    """Fallback parser to read local .env variables if available."""
    env_vars = {}
    env_path = Path(".env")
    if env_path.exists():
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip().strip('"').strip("'")
    return env_vars

def main():
    print("======================================================================")
    print("      VENTURE VISION UBUNTU (VVU) - MODELARTS OBS DATASET UPLOADER    ")
    print("======================================================================")

    # Initialize parser
    parser = argparse.ArgumentParser(
        description="Upload Gqeberha leak datasets to Huawei Cloud OBS for ModelArts training."
    )
    parser.add_argument("--src", type=str, default="./20_Clients", help="Path to local dataset directory")
    parser.add_argument("--bucket", type=str, help="Huawei Cloud OBS Bucket name")
    parser.add_argument("--prefix", type=str, default="gqeberha-leak-v1", help="OBS directory prefix path")
    parser.add_argument("--ak", type=str, help="Huawei Cloud Access Key (AK)")
    parser.add_argument("--sk", type=str, help="Huawei Cloud Secret Key (SK)")
    parser.add_argument("--server", type=str, default="obs.af-south-1.myhuaweicloud.com", help="OBS Endpoint Server")
    
    args = parser.parse_args()

    # Fallback to .env configurations if command-line args are missing
    env = load_env_variables()
    ak = args.ak or env.get("HUAWEI_ACCESS_KEY") or env.get("HUAWEI_AK")
    sk = args.sk or env.get("HUAWEI_SECRET_KEY") or env.get("HUAWEI_SK")
    bucket_name = args.bucket or env.get("HUAWEI_OBS_BUCKET")
    server = args.server or env.get("HUAWEI_OBS_ENDPOINT") or "obs.af-south-1.myhuaweicloud.com"

    if not ak or not sk:
        print("[-] Error: Missing Huawei Cloud Access Credentials (AK/SK).")
        print("    Please set HUAWEI_ACCESS_KEY and HUAWEI_SECRET_KEY in your .env file or pass them as arguments.")
        sys.exit(1)

    if not bucket_name:
        print("[-] Error: Missing target OBS Bucket Name.")
        print("    Please set HUAWEI_OBS_BUCKET in your .env file or pass --bucket.")
        sys.exit(1)

    if ObsClient is None:
        print("[-] Execution halted: Please install the 'esdk-obs-python' library on your local workstation.")
        sys.exit(1)

    src_path = Path(args.src)
    if not src_path.exists():
        print(f"[-] Error: Source directory does not exist: {src_path}")
        sys.exit(1)

    # Initialize Huawei Cloud ObsClient
    print(f"[+] Initializing ObsClient targeting server: {server}")
    try:
        obs_client = ObsClient(access_key_id=ak, secret_access_key=sk, server=server)
    except Exception as e:
        print(f"[-] Failed to initialize ObsClient: {e}")
        sys.exit(1)

    # Walk through the local dataset directory
    print(f"[+] Scanning directory: {src_path}")
    files_to_upload = []
    
    # Supported file structures for ModelArts (YOLO images, annotations, and system CSV/JSON logs)
    valid_extensions = {".jpg", ".jpeg", ".png", ".txt", ".json", ".xml", ".csv", ".md"}
    
    for root, _, files in os.walk(src_path):
        for file in files:
            file_path = Path(root) / file
            if file_path.suffix.lower() in valid_extensions:
                files_to_upload.append(file_path)

    total_files = len(files_to_upload)
    if total_files == 0:
        print("[-] No valid dataset files (images, annotations, or metadata logs) found to upload.")
        sys.exit(0)

    print(f"[+] Found {total_files} files ready to sync. Starting batch transfer...")

    uploaded_count = 0
    failed_count = 0

    for idx, local_file in enumerate(files_to_upload, 1):
        # Calculate relative path to preserve directory structure in OBS
        relative_path = local_file.relative_to(src_path)
        obs_key = f"{args.prefix}/{relative_path.as_posix()}"

        print(f"    [{idx}/{total_files}] Uploading: {local_file.name} -> obs://{bucket_name}/{obs_key}")
        
        try:
            # Perform single file upload
            resp = obs_client.putFile(bucketName=bucket_name, objectKey=obs_key, file_path=str(local_file))
            
            # Check response status code (200 is successful)
            if resp.status < 300:
                uploaded_count += 1
            else:
                print(f"    [!] Failed to upload {local_file.name}. Status: {resp.status}, Error Code: {resp.errorCode}")
                failed_count += 1
        except Exception as e:
            print(f"    [!] Exception occurred during upload of {local_file.name}: {e}")
            failed_count += 1

    print("\n======================================================================")
    print("                       DATASET TRANSFER SUMMARY                       ")
    print("======================================================================")
    print(f"  Target OBS Bucket    : {bucket_name}")
    print(f"  Directory Prefix     : {args.prefix}")
    print(f"  Successfully Synced  : {uploaded_count} / {total_files} files")
    print(f"  Failed Uploads       : {failed_count} files")
    print("----------------------------------------------------------------------")
    if failed_count == 0:
        print("[SUCCESS] Dataset sync completed flawlessly! Your files are ready in OBS.")
        print("          You can now initiate an ExeML or custom training pipeline in ModelArts.")
    else:
        print("[WARNING] Transfer completed with some errors. Please check network logs.")
    print("======================================================================")

    # Close ObsClient connection
    obs_client.close()

if __name__ == "__main__":
    main()
```
