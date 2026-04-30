from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import re

class UserOut(BaseModel):
    id: str = Field(..., pattern=r"^[a-zA-Z0-9\-]+$")
    name: str
    age: int = Field(..., ge=0, le=120)
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    verification_status: str
    liveness_status: Optional[str] = "pending"
    face_image_path: Optional[str] = None
    id_file_path: Optional[str] = None
    trust_score: int = Field(75, ge=0, le=100)

    class Config:
        from_attributes = True


class RegisterResponse(BaseModel):
    user_id: str
    message: str


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    user_id: str
    message: str
    name: str


class UploadFaceResponse(BaseModel):
    message: str
    face_image_path: str


class LivenessSignals(BaseModel):
    face: bool
    blink: bool
    movement: bool
    frame: bool


class LivenessResponse(BaseModel):
    liveness: bool
    confidence: float
    message: str
    verification_status: Optional[str] = None
    liveness_status: Optional[str] = None
    trust_score: Optional[int] = Field(None, ge=0, le=100)
    risk: Optional[str] = None
    signals: Optional[LivenessSignals] = None
    video_path: Optional[str] = None

class ShareTokenRequest(BaseModel):
    user_id: str = Field(..., pattern=r"^[a-zA-Z0-9\-]+$")
    fields: List[str]

class ShareTokenResponse(BaseModel):
    token: str
    expiry: str

class VerifyTokenRequest(BaseModel):
    token: str
    expected_name: Optional[str] = None
    expected_mobile: Optional[str] = None
    expected_email: Optional[str] = None
    expected_address: Optional[str] = None
