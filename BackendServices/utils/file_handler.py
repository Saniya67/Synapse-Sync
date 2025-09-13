import os
from fastapi import UploadFile

def save_file(file: UploadFile, upload_dir: str) -> str:
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as f:
        f.write(file.file.read())
    return file_path
