import json
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
METADATA_DIR = BASE_DIR / "storage"
METADATA_FILE = METADATA_DIR / "metadata.json"


def save_metadata(metadata):
    METADATA_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    with open(
        METADATA_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            metadata,
            file,
            indent=2,
            ensure_ascii=False
        )


def load_metadata():
    if not METADATA_FILE.exists():
        return []

    with open(
        METADATA_FILE,
        "r",
        encoding="utf-8"
    ) as file:
        return json.load(file)