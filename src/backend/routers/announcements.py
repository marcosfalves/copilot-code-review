"""Announcement management endpoints."""

from datetime import date
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ..database import announcements_collection, teachers_collection

router = APIRouter(
    prefix="/announcements",
    tags=["announcements"]
)


class AnnouncementPayload(BaseModel):
    """Input payload for creating or updating announcements."""

    message: str = Field(..., min_length=1, max_length=500)
    start_date: Optional[date] = None
    expires_at: date


def _require_authenticated_teacher(teacher_username: Optional[str]) -> None:
    """Validate teacher session based on username parameter."""
    if not teacher_username:
        raise HTTPException(status_code=401, detail="Authentication required")

    teacher = teachers_collection.find_one({"_id": teacher_username})
    if not teacher:
        raise HTTPException(status_code=401, detail="Invalid teacher credentials")


def _validate_dates(start_date: Optional[date], expires_at: date) -> None:
    """Ensure business rules for announcement dates are respected."""
    if start_date and expires_at < start_date:
        raise HTTPException(
            status_code=400,
            detail="Expiration date must be greater than or equal to start date"
        )


def _serialize_announcement(document: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB document into API response format."""
    return {
        "id": str(document["_id"]),
        "message": document["message"],
        "start_date": document.get("start_date"),
        "expires_at": document["expires_at"],
        "created_at": document.get("created_at")
    }


@router.get("", response_model=List[Dict[str, Any]])
@router.get("/", response_model=List[Dict[str, Any]])
def get_all_announcements(
    teacher_username: Optional[str] = Query(None)
) -> List[Dict[str, Any]]:
    """List all announcements (active, scheduled and expired). Requires authentication."""
    _require_authenticated_teacher(teacher_username)

    announcements = announcements_collection.find().sort("created_at", -1)
    return [_serialize_announcement(doc) for doc in announcements]


@router.get("/active", response_model=List[Dict[str, Any]])
def get_active_announcements() -> List[Dict[str, Any]]:
    """List currently active announcements for public display."""
    today = date.today().isoformat()

    query = {
        "expires_at": {"$gte": today},
        "$or": [
            {"start_date": None},
            {"start_date": {"$exists": False}},
            {"start_date": {"$lte": today}}
        ]
    }

    announcements = announcements_collection.find(query).sort("created_at", -1)
    return [_serialize_announcement(doc) for doc in announcements]


@router.post("", response_model=Dict[str, Any])
def create_announcement(
    payload: AnnouncementPayload,
    teacher_username: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Create a new announcement. Requires authentication."""
    _require_authenticated_teacher(teacher_username)
    _validate_dates(payload.start_date, payload.expires_at)

    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Announcement message is required")

    announcement = {
        "message": message,
        "start_date": payload.start_date.isoformat() if payload.start_date else None,
        "expires_at": payload.expires_at.isoformat(),
        "created_at": date.today().isoformat()
    }

    inserted = announcements_collection.insert_one(announcement)
    created = announcements_collection.find_one({"_id": inserted.inserted_id})

    if not created:
        raise HTTPException(status_code=500, detail="Failed to create announcement")

    return _serialize_announcement(created)


@router.put("/{announcement_id}", response_model=Dict[str, Any])
def update_announcement(
    announcement_id: str,
    payload: AnnouncementPayload,
    teacher_username: Optional[str] = Query(None)
) -> Dict[str, Any]:
    """Update an existing announcement. Requires authentication."""
    _require_authenticated_teacher(teacher_username)
    _validate_dates(payload.start_date, payload.expires_at)

    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Announcement message is required")

    try:
        object_id = ObjectId(announcement_id)
    except InvalidId as error:
        raise HTTPException(status_code=400, detail="Invalid announcement id") from error

    update_result = announcements_collection.update_one(
        {"_id": object_id},
        {
            "$set": {
                "message": message,
                "start_date": payload.start_date.isoformat() if payload.start_date else None,
                "expires_at": payload.expires_at.isoformat()
            }
        }
    )

    if update_result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    updated = announcements_collection.find_one({"_id": object_id})
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update announcement")

    return _serialize_announcement(updated)


@router.delete("/{announcement_id}", response_model=Dict[str, str])
def delete_announcement(
    announcement_id: str,
    teacher_username: Optional[str] = Query(None)
) -> Dict[str, str]:
    """Delete an announcement. Requires authentication."""
    _require_authenticated_teacher(teacher_username)

    try:
        object_id = ObjectId(announcement_id)
    except InvalidId as error:
        raise HTTPException(status_code=400, detail="Invalid announcement id") from error

    deletion = announcements_collection.delete_one({"_id": object_id})
    if deletion.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")

    return {"message": "Announcement deleted"}
