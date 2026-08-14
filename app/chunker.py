def split_pages_into_chunks(
    pages,
    chunk_size=500,
    overlap=50
):
    if chunk_size <= 0:
        raise ValueError(
            "chunk_size must be a positive integer."
        )

    if overlap < 0 or overlap >= chunk_size:
        raise ValueError(
            "overlap must be >= 0 and < chunk_size "
            "to guarantee forward progress."
        )

    chunks = []

    for page in pages:
        text = page["text"]
        page_number = page["page_number"]

        start = 0

        while start < len(text):
            end = start + chunk_size

            chunk_text = text[start:end].strip()

            if chunk_text:
                chunks.append({
                    "text": chunk_text,
                    "page_number": page_number
                })

            start += chunk_size - overlap

    return chunks