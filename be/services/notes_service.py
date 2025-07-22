"""
Notes service for internal note-taking functionality.
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from models.notes import Note
from schemas.models import NoteCreate, NoteUpdate

class NotesService:
    """Service for managing user notes."""
    
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id
    
    def create_note(self, note_data: NoteCreate) -> Note:
        """Create a new note for the user."""
        db_note = Note(
            user_id=self.user_id,
            title=note_data.title,
            content=note_data.content,
            is_pinned=note_data.is_pinned
        )
        self.db.add(db_note)
        self.db.commit()
        self.db.refresh(db_note)
        return db_note
    
    def get_notes(self, limit: int = 20, pinned_only: bool = False) -> List[Note]:
        """Get user's notes, optionally filtered by pinned status."""
        query = self.db.query(Note).filter(Note.user_id == self.user_id)
        
        if pinned_only:
            query = query.filter(Note.is_pinned == True)
        
        # Order by pinned first, then by updated date
        query = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc())
        
        return query.limit(limit).all()
    
    def get_note_by_id(self, note_id: int) -> Optional[Note]:
        """Get a specific note by ID (only if it belongs to the user)."""
        return self.db.query(Note).filter(
            Note.id == note_id,
            Note.user_id == self.user_id
        ).first()
    
    def update_note(self, note_id: int, note_data: NoteUpdate) -> Optional[Note]:
        """Update an existing note."""
        db_note = self.get_note_by_id(note_id)
        if not db_note:
            return None
        
        # Update fields if provided
        if note_data.title is not None:
            db_note.title = note_data.title
        if note_data.content is not None:
            db_note.content = note_data.content
        if note_data.is_pinned is not None:
            db_note.is_pinned = note_data.is_pinned
        
        self.db.commit()
        self.db.refresh(db_note)
        return db_note
    
    def delete_note(self, note_id: int) -> bool:
        """Delete a note by ID."""
        db_note = self.get_note_by_id(note_id)
        if not db_note:
            return False
        
        self.db.delete(db_note)
        self.db.commit()
        return True
    
    def search_notes(self, query: str, limit: int = 20) -> List[Note]:
        """Search notes by title or content."""
        search_pattern = f"%{query}%"
        return self.db.query(Note).filter(
            Note.user_id == self.user_id,
            (Note.title.ilike(search_pattern) | Note.content.ilike(search_pattern))
        ).order_by(Note.updated_at.desc()).limit(limit).all()
