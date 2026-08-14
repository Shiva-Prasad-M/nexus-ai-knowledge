import faiss
import numpy as np
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
VECTOR_STORE_DIR = BASE_DIR / "storage" / "vector_store"
INDEX_FILE = VECTOR_STORE_DIR / "index.faiss"


def create_vector_store(embeddings):
    embeddings = np.array(embeddings).astype("float32")

    if embeddings.ndim != 2:
        raise ValueError(
            "Embeddings must be a 2D array "
            "with shape (n_vectors, dimension)."
        )

    dimension = embeddings.shape[1]

    index = faiss.IndexFlatL2(dimension)

    index.add(embeddings)

    return index


def save_vector_store(index):
    VECTOR_STORE_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    faiss.write_index(
        index,
        str(INDEX_FILE)
    )


def load_vector_store():
    if not INDEX_FILE.exists():
        return None

    return faiss.read_index(
        str(INDEX_FILE)
    )