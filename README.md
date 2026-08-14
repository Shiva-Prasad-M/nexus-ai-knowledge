# Nexus — AI Knowledge Assistant

Nexus is a personal AI knowledge assistant that allows users to upload PDF documents, search their content using natural language, and ask questions based on the information inside them.

Instead of manually reading through multiple documents, Nexus processes uploaded PDFs, extracts and chunks their content, generates embeddings, retrieves the most relevant information, and uses an LLM to generate answers with source references.

## Why I Built This

I wanted to build something beyond a basic chatbot that could actually work with real documents.

The core idea is simple:

> **Upload documents → Index content → Ask questions → Retrieve relevant context → Generate grounded answers**

Building Nexus helped me understand how a practical **Retrieval-Augmented Generation (RAG)** system works, including:

- PDF document processing
- Text extraction
- Document chunking
- Embedding generation
- Vector similarity search
- Metadata management
- Context retrieval
- LLM-based answer generation
- Source attribution
- Document lifecycle management

---

## Features

### Document Management

- Upload PDF documents through the web interface
- Validate uploaded files
- Extract text and page information
- Split documents into smaller chunks
- Generate vector embeddings
- Store document metadata
- View indexed documents and statistics
- Delete uploaded documents
- Rebuild the vector index after document deletion

### AI Question Answering

- Ask questions using natural language
- Search across uploaded documents
- Retrieve the most relevant document chunks
- Generate answers using retrieved context
- Display source documents
- Display source page numbers
- Support questions across multiple documents

### Knowledge Dashboard

The React frontend provides a clean knowledge workspace where users can:

- View indexed document count
- View document statistics
- Upload new PDF documents
- Ask questions through the AI interface
- View generated answers
- View source documents and pages
- Delete documents
- Monitor recent AI activity

---

## How It Works

Nexus follows a **Retrieval-Augmented Generation (RAG)** pipeline.

```text
                    PDF Upload
                        │
                        ▼
                Extract PDF Text
                        │
                        ▼
                Split into Chunks
                        │
                        ▼
               Generate Embeddings
                        │
                        ▼
                  FAISS Index
                        │
                        │
                        ▼
User Question ──► Generate Query Embedding
                        │
                        ▼
                 Similarity Search
                        │
                        ▼
                 Relevant Chunks
                        │
                        ▼
               Retrieved Context
                        │
                        ▼
                       LLM
                        │
                        ▼
                Generated Answer
                        │
                        ▼
                 Answer + Sources

Project Structure
nexus-ai-knowledge/
│
├── app/
│   ├── api.py
│   ├── chunker.py
│   ├── document_loader.py
│   ├── embeddings.py
│   ├── llm.py
│   ├── metadata_store.py
│   ├── retriever.py
│   └── vector_store.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── api.js
│   ├── package.json
│   └── ...
│
├── documents/
│   └── # Local uploaded PDF files
│
├── storage/
│   └── # Generated vector index and metadata files
│
├── .gitignore
├── requirements.txt
└── README.md

### API Endpoints

| Method | Endpoint                   | Description                            |
| ------ | -------------------------- | -------------------------------------- |
| GET    | `/`                        | Backend health check                   |
| POST   | `/documents/upload`        | Upload and index a PDF                 |
| GET    | `/documents`               | Get indexed documents                  |
| DELETE | `/documents/{document_id}` | Delete a document                      |
| POST   | `/chat`                    | Ask a question about indexed documents |

Running the Project Locally
1. Clone the Repository
git clone https://github.com/Shiva-Prasad-M/nexus-ai-knowledge.git
cd nexus-ai-knowledge
2. Create a Python Virtual Environment

Windows:

python -m venv venv

Activate it:

.\venv\Scripts\Activate.ps1

If PowerShell blocks script execution:

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

Then activate:

.\venv\Scripts\Activate.ps1
3. Install Backend Dependencies
pip install -r requirements.txt
4. Start the Backend

From the project root:

python -m uvicorn app.api:app --reload

The backend will run at:

http://127.0.0.1:8000
5. Install Frontend Dependencies

Open another terminal:

cd frontend
npm install
6. Start the Frontend
npx vite

The frontend will run at:

http://localhost:5173

Open the frontend in your browser:

http://localhost:5173
Example Usage
Upload a Document

Upload a PDF such as:

Resume.pdf

Nexus extracts the content, creates chunks, generates embeddings, and indexes the document.

Ask a Question

For example:

What are my technical skills?

Nexus retrieves the most relevant sections of the uploaded document and generates an answer.

Source Attribution

The response also includes the relevant source document and page number, making it easier to verify where the answer came from.

Key Engineering Concepts
1. Document Chunking

Large documents are divided into smaller chunks before embedding.

This improves retrieval because the system can identify specific sections instead of searching an entire document as one large piece of text.

2. Embeddings

Each text chunk is converted into a numerical vector representation.

Semantically similar content produces vectors that are closer together in vector space.

3. Vector Search

FAISS is used to perform similarity searches over document embeddings.

For example:

Question:
"What programming languages do I know?"


        ↓


Query Embedding


        ↓


FAISS Similarity Search


        ↓


Relevant Resume Chunks


        ↓


LLM Context


        ↓


Answer
4. Retrieval-Augmented Generation

Instead of asking the LLM to answer entirely from its own knowledge, Nexus first retrieves relevant information from the user's documents.

The retrieved information is then provided as context to the LLM.

This helps produce answers that are grounded in the uploaded documents.

5. Source Attribution

Nexus keeps document metadata alongside the indexed chunks.

This allows the application to associate retrieved content with:

Filename
Page number
Document ID
Chunk information

The frontend can then display the sources used to generate the answer.

What I Learned

Building Nexus gave me practical experience with:

Building REST APIs using FastAPI
Building a React frontend with Vite
Connecting a React frontend with a Python backend
Handling PDF uploads
Processing unstructured documents
Designing a document chunking pipeline
Working with embeddings
Implementing vector similarity search
Building a basic RAG pipeline
Integrating an LLM
Managing document metadata
Handling document deletion and index rebuilding
Implementing CORS between frontend and backend
Designing a user-facing AI dashboard
Future Improvements

Some improvements I would like to add:

Support for DOCX and TXT files
Streaming AI responses
Conversation history
Multiple knowledge spaces
Improved chunking strategies
Hybrid keyword + semantic search
Better citation formatting
Authentication and user accounts
Cloud-based document storage
Persistent vector database
Document preview
Advanced document comparison
Deployment with a production database and cloud infrastructure
Project Status

Status: Completed MVP

The current version supports:

PDF upload
PDF processing
Chunking
Embedding generation
Vector indexing
Semantic retrieval
RAG-based question answering
Source attribution
Document listing
Document deletion
React dashboard

Author
Meda Shiva Prasad

Computer Science & Engineering Graduate

GitHub:
https://github.com/Shiva-Prasad-M

License

This project is intended for learning, experimentation, and portfolio purposes.


One correction before you commit: **don't claim "Vector Database" in the architecture if you're actually using FAISS as a local vector index.** Calling it **FAISS Index** is more technically accurate and won't make you look like you're throwing buzzwords into the README.

