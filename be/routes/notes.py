"""
Notes routes for internal note-taking functionality.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from models.database import get_db, User as DBUser, Note as DBNote
from schemas.models import Note, NoteCreate, NoteUpdate
from services.notes_service import NotesService
from utils.auth import get_current_active_user

router = APIRouter(
    prefix="/notes",
    tags=["notes"]
)

@router.post("/", response_model=Note)
async def create_note(
    note: NoteCreate,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Create a new note."""
    notes_service = NotesService(db, current_user.id)
    return notes_service.create_note(note)

@router.get("/", response_model=List[Note])
async def list_notes(
    limit: int = Query(20, description="Maximum number of notes to return"),
    pinned_only: bool = Query(False, description="Only return pinned notes"),
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """List user's notes."""
    notes_service = NotesService(db, current_user.id)
    return notes_service.get_notes(limit=limit, pinned_only=pinned_only)

@router.get("/{note_id}", response_model=Note)
async def get_note(
    note_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific note by ID."""
    notes_service = NotesService(db, current_user.id)
    note = notes_service.get_note_by_id(note_id)
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return note

@router.put("/{note_id}", response_model=Note)
async def update_note(
    note_id: int,
    note_data: NoteUpdate,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update an existing note."""
    notes_service = NotesService(db, current_user.id)
    updated_note = notes_service.update_note(note_id, note_data)
    
    if not updated_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return updated_note

@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a note."""
    notes_service = NotesService(db, current_user.id)
    success = notes_service.delete_note(note_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return {"message": "Note deleted successfully"}

@router.get("/search/{query}", response_model=List[Note])
async def search_notes(
    query: str,
    limit: int = Query(20, description="Maximum number of notes to return"),
    current_user: DBUser = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Search notes by title or content."""
    notes_service = NotesService(db, current_user.id)
    return notes_service.search_notes(query, limit=limit)
