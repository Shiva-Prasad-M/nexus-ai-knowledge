import numpy as np

from app.embeddings import model


def retrieve_chunks(
    question,
    index,
    chunks,
    top_k=3
):
    question_embedding = model.encode(
        [question]
    )

    question_embedding = np.array(
        question_embedding
    ).astype("float32")

    # FAISS returns -1 for missing indices when
    # top_k exceeds the number of vectors in the index,
    # so we must clamp top_k to the available count.
    safe_top_k = min(
        top_k,
        index.ntotal
    )

    if safe_top_k <= 0:
        return []

    distances, indices = index.search(
        question_embedding,
        safe_top_k
    )

    results = []

    for distance, index_position in zip(
        distances[0],
        indices[0]
    ):

        # Skip invalid / out-of-range FAISS results
        if index_position < 0:
            continue

        if index_position >= len(chunks):
            continue

        results.append({
            "text": chunks[index_position]["text"],
            "page_number": chunks[index_position]["page_number"],
            "filename": chunks[index_position]["filename"],
            "distance": float(distance)
        })

    return results