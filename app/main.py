"""Entry point for the AI Document Q&A Assistant.

The FastAPI application is defined in :mod:`app.api`.

Running the server:

    uvicorn app.main:app --reload

or

    uvicorn app.api:app --reload

Both resolve to the same application instance.
"""

from app.api import app

__all__ = ["app"]