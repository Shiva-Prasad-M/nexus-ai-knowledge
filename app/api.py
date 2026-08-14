from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.document_loader import extract_pages_from_pdf
from app.chunker import split_pages_into_chunks
from app.embeddings import create_embeddings
from app.vector_store import (
    create_vector_store,
    save_vector_store,
    load_vector_store,
)
from app.metadata_store import (
    save_metadata,
    load_metadata,
)
from app.retriever import retrieve_chunks
from app.llm import generate_answer


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="AI Document Q&A Assistant",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DIRECTORIES
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent
DOCUMENT_DIR = BASE_DIR / "documents"

DOCUMENT_DIR.mkdir(
    parents=True,
    exist_ok=True,
)


# ============================================================
# REQUEST MODELS
# ============================================================

class QuestionRequest(BaseModel):
    question: str


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "AI Document Q&A Assistant",
    }


# ============================================================
# UPLOAD DOCUMENT
# ============================================================

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
):

    # Validate file - filename may be None if no file is sent
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No file selected.",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    # Generate unique document ID
    document_id = str(uuid4())

    # Store PDF as:
    # documents/<document_id>_<original_filename>.pdf
    safe_filename = f"{document_id}_{file.filename}"

    file_path = DOCUMENT_DIR / safe_filename

    # Read uploaded file
    contents = await file.read()

    # Save PDF
    with open(file_path, "wb") as output_file:
        output_file.write(contents)

    try:

        # ====================================================
        # EXTRACT TEXT
        # ====================================================

        pages = extract_pages_from_pdf(
            file_path
        )

        if not pages:
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF.",
            )

        # ====================================================
        # CHUNK DOCUMENT
        # ====================================================

        chunks = split_pages_into_chunks(
            pages
        )

        if not chunks:
            raise HTTPException(
                status_code=400,
                detail="No text chunks could be created from the PDF.",
            )

        # ====================================================
        # CREATE EMBEDDINGS
        # ====================================================

        texts = [
            chunk["text"]
            for chunk in chunks
        ]

        embeddings = create_embeddings(
            texts
        )

        # ====================================================
        # LOAD EXISTING FAISS INDEX
        # ====================================================

        existing_index = load_vector_store()

        if existing_index is None:

            # First document
            index = create_vector_store(
                embeddings
            )

            starting_index = 0

        else:

            # Existing documents
            index = existing_index

            starting_index = index.ntotal

            embeddings = embeddings.astype(
                "float32"
            )

            index.add(
                embeddings
            )

        # ====================================================
        # LOAD METADATA
        # ====================================================

        metadata = load_metadata()

        # ====================================================
        # ADD DOCUMENT METADATA
        # ====================================================

        for position, chunk in enumerate(chunks):

            metadata.append(
                {
                    "vector_index": starting_index + position,
                    "document_id": document_id,
                    "filename": file.filename,
                    "page_number": chunk["page_number"],
                    "chunk_id": position,
                    "text": chunk["text"],
                }
            )

        # ====================================================
        # SAVE VECTOR STORE + METADATA
        # ====================================================

        save_vector_store(
            index
        )

        save_metadata(
            metadata
        )

        # ====================================================
        # RESPONSE
        # ====================================================

        return {
            "message": "Document indexed successfully",
            "document_id": document_id,
            "filename": file.filename,
            "pages": len(pages),
            "chunks": len(chunks),
        }

    except HTTPException:
        # Delete uploaded PDF if processing fails
        if file_path.exists():
            file_path.unlink()

        raise

    except Exception as error:

        # Delete uploaded PDF if processing fails
        if file_path.exists():
            file_path.unlink()

        print(
            "DOCUMENT PROCESSING ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to process and index the document.",
        )


# ============================================================
# ASK QUESTION
# ============================================================

@app.post("/chat")
async def chat(
    request: QuestionRequest,
):

    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty.",
        )

    try:

        # ====================================================
        # LOAD VECTOR STORE
        # ====================================================

        index = load_vector_store()

        if index is None or index.ntotal == 0:
            raise HTTPException(
                status_code=400,
                detail="No documents have been indexed yet.",
            )

        # ====================================================
        # LOAD METADATA
        # ====================================================

        metadata = load_metadata()

        if not metadata:
            raise HTTPException(
                status_code=400,
                detail="No document metadata found.",
            )

        # ====================================================
        # RETRIEVE RELEVANT CHUNKS
        # ====================================================

        results = retrieve_chunks(
            question,
            index,
            metadata,
            top_k=5,
        )

        if not results:
            return {
                "answer": (
                    "I couldn't find relevant information "
                    "in the uploaded documents."
                ),
                "sources": [],
            }

        # ====================================================
        # BUILD CONTEXT
        # ====================================================

        context_parts = []

        sources = []

        for result in results:

            context_parts.append(
                result["text"]
            )

            sources.append(
                {
                    "filename": result.get(
                        "filename",
                        "Document",
                    ),
                    "page": result.get(
                        "page_number",
                    ),
                    "distance": result.get(
                        "distance",
                    ),
                }
            )

        context = "\n\n".join(
            context_parts
        )

        # ====================================================
        # GENERATE AI ANSWER
        # ====================================================

        answer = generate_answer(
            question,
            context,
        )

        return {
            "answer": answer,
            "sources": sources,
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "CHAT ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to generate an answer.",
        )


# ============================================================
# GET DOCUMENTS
# ============================================================

@app.get("/documents")
def get_documents():

    try:

        metadata = load_metadata()

        documents = {}

        for item in metadata:

            document_id = item["document_id"]

            if document_id not in documents:

                documents[document_id] = {
                    "document_id": document_id,
                    "filename": item["filename"],
                    "pages": set(),
                    "chunks": 0,
                }

            documents[document_id]["pages"].add(
                item["page_number"]
            )

            documents[document_id]["chunks"] += 1

        result = []

        for document in documents.values():

            result.append(
                {
                    "document_id": document[
                        "document_id"
                    ],
                    "filename": document[
                        "filename"
                    ],
                    "pages": len(
                        document["pages"]
                    ),
                    "chunks": document[
                        "chunks"
                    ],
                }
            )

        return {
            "documents": result,
            "total_documents": len(result),
        }

    except Exception as error:

        print(
            "GET DOCUMENTS ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to load documents.",
        )


# ============================================================
# DELETE DOCUMENT
# ============================================================

@app.delete("/documents/{document_id}")
def delete_document(
    document_id: str,
):

    try:

        # ====================================================
        # LOAD METADATA
        # ====================================================

        metadata = load_metadata()

        if not metadata:

            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        # ====================================================
        # FIND DOCUMENT
        # ====================================================

        document_items = [
            item
            for item in metadata
            if item["document_id"] == document_id
        ]

        if not document_items:

            raise HTTPException(
                status_code=404,
                detail="Document not found.",
            )

        # Original filename
        filename = document_items[0]["filename"]

        # ====================================================
        # REMOVE DOCUMENT FROM METADATA
        # ====================================================

        remaining_metadata = [
            item
            for item in metadata
            if item["document_id"] != document_id
        ]

        # ====================================================
        # DELETE PHYSICAL PDF
        # ====================================================

        deleted_file = False

        matching_files = list(
            DOCUMENT_DIR.glob(
                f"{document_id}_*.pdf"
            )
        )

        for file_path in matching_files:

            if file_path.exists():

                file_path.unlink()

                deleted_file = True

        # ====================================================
        # REBUILD VECTOR STORE
        # ====================================================

        if remaining_metadata:

            remaining_texts = [
                item["text"]
                for item in remaining_metadata
            ]

            embeddings = create_embeddings(
                remaining_texts
            )

            embeddings = embeddings.astype(
                "float32"
            )

            index = create_vector_store(
                embeddings
            )

            # Reassign vector indexes
            for position, item in enumerate(
                remaining_metadata
            ):
                item["vector_index"] = position

            save_vector_store(
                index
            )

        else:

            # =================================================
            # NO DOCUMENTS REMAIN
            # =================================================

            existing_index = load_vector_store()

            if existing_index is not None:

                existing_index.reset()

                save_vector_store(
                    existing_index
                )

        # ====================================================
        # SAVE UPDATED METADATA
        # ====================================================

        save_metadata(
            remaining_metadata
        )

        # ====================================================
        # RESPONSE
        # ====================================================

        return {
            "message": "Document deleted successfully",
            "document_id": document_id,
            "filename": filename,
            "file_deleted": deleted_file,
        }

    except HTTPException:
        raise

    except Exception as error:

        print(
            "DELETE DOCUMENT ERROR:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to delete document.",
        )