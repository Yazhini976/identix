import os
import shutil
import hashlib
import numpy as np
import cv2
import jwt
import logging
import re
from datetime import datetime, timedelta
from fastapi import FastAPI, Form, File, UploadFile, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List
import uuid
from cryptography.fernet import Fernet

from database import init_db, get_db
from psycopg2.extras import RealDictCursor
from deepfake import deepfake_check

# --- LOGGING SETUP ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("identix-security")

# --- ENCRYPTION & JWT SETUP ---
ENCRYPTION_KEY = Fernet.generate_key()
CIPHER_SUITE = Fernet(ENCRYPTION_KEY)
JWT_SECRET_KEY = "identix_super_secret_key_change_me_in_prod" # In prod, use env var
JWT_ALGORITHM = "HS256"

# --- RATE LIMITING ---
RATE_LIMIT_STORE = {} # {ip: [timestamps]}
MAX_REQUESTS_PER_MINUTE = 15

async def rate_limit(request: Request):
    client_ip = request.client.host
    now = datetime.now()
    if client_ip not in RATE_LIMIT_STORE:
        RATE_LIMIT_STORE[client_ip] = []
    
    # Clean old timestamps
    RATE_LIMIT_STORE[client_ip] = [t for t in RATE_LIMIT_STORE[client_ip] if now - t < timedelta(minutes=1)]
    
    if len(RATE_LIMIT_STORE[client_ip]) >= MAX_REQUESTS_PER_MINUTE:
        logger.warning(f"Rate limit exceeded for IP: {client_ip}")
        raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")
    
    RATE_LIMIT_STORE[client_ip].append(now)

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = FastAPI(title="Digital Identity System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOADS_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Initialise DB on startup
init_db()

# ---------------------------------------------------------------------------
# Pydantic models (Strict Validation)
# ---------------------------------------------------------------------------
class UserOut(BaseModel):
    id: str = Field(..., pattern=r"^[a-zA-Z0-9\-]+$")
    name: str
    age: int = Field(..., ge=0, le=120)
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    address: Optional[str] = None
    verification_status: str
    face_image_path: Optional[str] = None
    id_file_path: Optional[str] = None
    liveness_status: str
    trust_score: int = Field(..., ge=0, le=100)

class RegisterResponse(BaseModel):
    id: str
    message: str

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    user_id: str
    message: str
    name: str

class LivenessSignals(BaseModel):
    face: bool
    blink: bool
    movement: bool
    frame: bool

class LivenessResponse(BaseModel):
    liveness: bool
    confidence: float
    message: str
    reason: Optional[str] = None
    verification_status: Optional[str] = None
    liveness_status: str
    trust_score: int = Field(..., ge=0, le=100)
    risk: str
    signals: LivenessSignals
    video_path: Optional[str] = None
    record_hash: Optional[str] = None
    is_simulation: bool = False
    deepfake: bool = False
    deepfake_confidence: float = 0.0

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

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _save_file(upload: UploadFile, dest_dir: str, filename: str) -> str:
    os.makedirs(dest_dir, exist_ok=True)
    dest = os.path.join(dest_dir, filename)
    with open(dest, "wb") as f:
        shutil.copyfileobj(upload.file, f)
    return dest


def _detect_screen_edges(frame) -> bool:
    """Detects if there are strong rectangular edges indicating a phone screen."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # Use a bilateral filter to preserve edges while removing noise
    blurred = cv2.bilateralFilter(gray, 9, 75, 75)
    edges = cv2.Canny(blurred, 30, 100)
    
    # Dilate edges to connect segments
    kernel = np.ones((3,3), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)
    
    # Find contours
    contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    height, width = frame.shape[:2]
    frame_area = height * width
    
    for cnt in contours:
        # Approximate the contour
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.03 * peri, True)
        
        # If it has 4 corners, it's a rectangle
        if len(approx) == 4:
            area = cv2.contourArea(approx) / frame_area
            # Check for aspect ratio common to phones (roughly 16:9 or 19:9)
            x, y, w, h = cv2.boundingRect(approx)
            aspect_ratio = float(w)/(h + 1e-6)
            # Stricter area (12%) and aspect ratio (phone-like)
            if area > 0.12 and (0.4 < aspect_ratio < 0.8 or 1.2 < aspect_ratio < 2.2):
                print(f"DEBUG: Screen rectangle detected (area={area:.2f}, AR={aspect_ratio:.2f})")
                return True
    
    # Fallback to Hough Lines - looking for strong parallel lines
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=70, minLineLength=120, maxLineGap=20)
    if lines is not None:
        horizontal = 0
        vertical = 0
        for line in lines:
            x1, y1, x2, y2 = line[0]
            if abs(y1 - y2) < 20: horizontal += 1
            if abs(x1 - x2) < 20: vertical += 1
        
        # Screens often show several long parallel lines from borders
        if horizontal >= 2 and vertical >= 2:
            print(f"DEBUG: Screen edges detected via Hough lines (H={horizontal}, V={vertical})")
            return True
            
    return False


def _detect_moire(gray_frame) -> bool:
    """Detects high-frequency periodic patterns (Moiré) typical of digital screens."""
    # Frequency analysis via FFT
    f = np.fft.fft2(gray_frame)
    fshift = np.fft.fftshift(f)
    magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-9)
    
    rows, cols = gray_frame.shape
    crow, ccol = rows // 2, cols // 2
    
    # Screens show strong energy in high-frequency bands (outer regions of FFT)
    q_rows, q_cols = rows // 6, cols // 6
    
    # Sample high frequency energy from the four corners (extreme high frequencies)
    top_left = np.mean(magnitude_spectrum[0:q_rows, 0:q_cols])
    top_right = np.mean(magnitude_spectrum[0:q_rows, cols-q_cols:])
    bot_left = np.mean(magnitude_spectrum[rows-q_rows:, 0:q_cols])
    bot_right = np.mean(magnitude_spectrum[rows-q_rows:, cols-q_cols:])
    
    avg_hf_energy = (top_left + top_right + bot_left + bot_right) / 4
    
    # Also check for peak energy in the high frequency bands
    max_hf_energy = np.max([
        np.max(magnitude_spectrum[0:q_rows, :]),
        np.max(magnitude_spectrum[rows-q_rows:, :]),
        np.max(magnitude_spectrum[:, 0:q_cols]),
        np.max(magnitude_spectrum[:, cols-q_cols:])
    ])
    
    # Real skin is stochastic and smooth, low HF energy
    # Screens are periodic grids, high HF energy. Relaxed significantly to 145/210.
    if avg_hf_energy > 145 or max_hf_energy > 210:
        print(f"DEBUG: Moire detected (avg_hf={avg_hf_energy:.1f}, max_hf={max_hf_energy:.1f})")
        return True
    return False


def _analyse_video_liveness(video_path: str) -> dict:
    """
    Real video analysis using OpenCV to detect liveness signals:
    - Movement detection (frame-to-frame difference)
    - Frame variation (pixel variance + consecutive similarity)
    - Face detection (using Haar Cascades)
    - Blink detection (detecting temporal 'V' shape in pixel change)
    """
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {
            "face": False, "blink": False, "movement": False, "frame": False, 
            "confidence": 0.0, "reason": "Could not open video biometric"
        }

    frames = []
    frames_raw = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        # Resize for faster processing
        small = cv2.resize(frame, (320, 240))
        gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)
        frames.append(gray)
        frames_raw.append(small)
        if len(frames) > 180: # Process up to ~6 seconds
            break

    cap.release()

    if len(frames) < 20:
        return {
            "face": False, "blink": False, "movement": False, "frame": False, 
            "confidence": 0.0, "reason": "Insufficient biometric data captured"
        }

    # 1. Face Detection
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    face_hits = 0
    indices = np.linspace(0, len(frames) - 1, 15, dtype=int)
    for i in indices:
        faces = face_cascade.detectMultiScale(frames[i], 1.1, 5) # Increased neighbors
        if len(faces) > 0:
            face_hits += 1
    
    face_detected = face_hits >= 8 # Increased requirement from 5 to 8
    
    if not face_detected:
        print(f"DEBUG: Face detection failed (hits={face_hits}/15)")
        return {
            "face": False, "blink": False, "movement": False, "frame": False, 
            "confidence": 0.0, "reason": "Face not detected reliably in feed"
        }

    # 2. Movement & Blink Detection
    diffs = []
    identical_frames = 0
    for i in range(1, len(frames)):
        diff = cv2.absdiff(frames[i], frames[i-1])
        diff_score = np.mean(diff)
        diffs.append(diff_score)
        if diff_score < 0.12: 
            identical_frames += 1

    avg_diff = np.mean(diffs) if diffs else 0
    max_diff = np.max(diffs) if diffs else 0
    std_diff = np.std(diffs) if diffs else 0
    
    # 3. Screen & Moiré Detection (Require multiple hits to avoid noise)
    screen_hits = 0
    moire_hits = 0
    for i in range(0, len(frames_raw), 10): 
        if _detect_screen_edges(frames_raw[i]):
            screen_hits += 1
        if _detect_moire(frames[i]):
            moire_hits += 1

    screen_detected = screen_hits >= 2
    moire_detected = moire_hits >= 2

    # Movement Threshold: Lowered to 0.3 to catch even subtle head movement.
    movement_detected = 0.3 < avg_diff < 5.0
    
    # 4. Stricter Temporal Blink Detection
    blink_detected = False
    if len(diffs) > 15:
        # Look for a significant peak compared to a wider neighborhood
        for i in range(5, len(diffs) - 5):
            neighborhood = diffs[i-5:i] + diffs[i+1:i+6]
            local_avg = np.mean(neighborhood)
            # A blink spike should be distinct from local noise. Relaxed significantly to 1.8/2.4.
            if diffs[i] > (local_avg + 1.8) and diffs[i] > 2.4:
                # Also verify it's a spike (neighbors are lower)
                if diffs[i] > diffs[i-1] and diffs[i] > diffs[i+1]:
                    blink_detected = True
                    break
    
    # 5. Frame Variation & Blurriness
    is_static = identical_frames > (len(frames) * 0.40)
    variances = [cv2.Laplacian(f, cv2.CV_64F).var() for f in frames[::10]]
    avg_lap_var = np.mean(variances) if variances else 0
    
    # Stricter unnatural texture bounds
    is_unnatural = avg_lap_var < 25 or avg_lap_var > 500

    # 6. Rigid Movement Detection (Photo-on-mobile check)
    is_rigid = False
    if len(frames) > 10:
        diff_vars = []
        for i in range(1, len(frames), 5):
            d = cv2.absdiff(frames[i], frames[i-1])
            diff_vars.append(np.std(d))
        
        avg_diff_var = np.mean(diff_vars) if diff_vars else 10
        # Very low variance means uniform global movement (rigid photo)
        if avg_diff_var < 0.25: # Lowered threshold again
            is_rigid = True
            print(f"DEBUG: Rigid movement detected (avg_var={avg_diff_var:.3f})")

    # Rigid movement is now a warning/signal but not a hard liveness killer 
    # to avoid false positives from shaky hands.
    frame_variation = (not is_static) and (not is_unnatural) and (not screen_detected) and (not moire_detected)

    print(f"DEBUG: Signals: face={face_detected}, blink={blink_detected}, movement={movement_detected}, frame={frame_variation}, avg_diff={avg_diff:.2f}, avg_lap={avg_lap_var:.1f}, screen={screen_detected}, moire={moire_detected}, rigid={is_rigid}")

    reasons = []
    if not blink_detected: reasons.append("- No natural blink detected")
    if is_static: reasons.append("- Static frame (photo spoof risk)")
    if is_unnatural: reasons.append("- Unnatural texture/blur (reproduction risk)")
    if not movement_detected: reasons.append("- Lack of natural micro-movement")
    if screen_detected: reasons.append("- Digital screen border detected")
    if moire_detected: reasons.append("- Moiré pattern detected")
    if is_rigid: reasons.append("- Rigid movement detected (reproduction attack)")
    
    reason_str = "\n".join(reasons) if reasons else None

    # Confidence calculation (Very Strict weighting)
    conf = (
        (0.10 if face_detected else 0) +
        (0.20 if movement_detected else 0) +
        (0.30 if frame_variation else 0) +
        (0.40 if blink_detected else 0)
    )

    return {
        "face": face_detected,
        "blink": blink_detected,
        "movement": movement_detected,
        "frame": frame_variation,
        "screen_detected": screen_detected,
        "moire_detected": moire_detected,
        "confidence": min(conf, 1.0),
        "reason": reason_str
    }


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.post("/register", response_model=RegisterResponse)
async def register(
    name: str = Form(...),
    age: int = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    phone: str = Form(...),
    dob: str = Form(...),
    address: str = Form(...),
):
    """Register a new user and return their generated ID."""
    user_id = str(uuid.uuid4())[:8]
    with get_db() as conn:
        with conn.cursor() as cursor:
            # Check if email already exists
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email already registered.")
            
            cursor.execute(
                """
                INSERT INTO users (id, name, age, email, password, phone, dob, address) 
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id, name, age, email, password, phone, dob, address),
            )
        conn.commit()
    return RegisterResponse(id=user_id, message=f"User {name} registered successfully.")


@app.post("/login", response_model=LoginResponse, dependencies=[Depends(rate_limit)])
async def login(req: LoginRequest):
    """Authenticate a user and return their ID and name."""
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(
                "SELECT id, name FROM users WHERE email = %s AND password = %s",
                (req.email, req.password),
            )
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=401, detail="Invalid email or password.")
            
    return LoginResponse(
        user_id=user["id"],
        message="Login successful",
        name=user["name"]
    )


@app.post("/upload-face/{user_id}", dependencies=[Depends(rate_limit)])
async def upload_face(user_id: str, file: UploadFile = File(...)):
    """Upload a face image for the given user."""
    # Alphanumeric validation
    if not re.match(r"^[a-zA-Z0-9\-]+$", user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id format.")
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="User not found.")
            ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
            filename = f"{user_id}_face{ext}"
            path = _save_file(file, UPLOADS_DIR, filename)
            cursor.execute("UPDATE users SET face_image_path = %s WHERE id = %s", (path, user_id))
        conn.commit()
    return {"message": "Face image uploaded.", "path": path}


@app.post("/upload-id/{user_id}", dependencies=[Depends(rate_limit)])
async def upload_id(user_id: str, file: UploadFile = File(...)):
    """Upload an ID document for the given user."""
    # Alphanumeric validation
    if not re.match(r"^[a-zA-Z0-9\-]+$", user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id format.")
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT id FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="User not found.")
            ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
            filename = f"{user_id}_id{ext}"
            path = _save_file(file, UPLOADS_DIR, filename)
            cursor.execute(
                "UPDATE users SET id_file_path = %s, verification_status = 'pending' WHERE id = %s",
                (path, user_id),
            )
        conn.commit()
    return {"message": "ID document uploaded.", "path": path}


@app.post("/liveness-check", response_model=LivenessResponse, dependencies=[Depends(rate_limit)])
async def liveness_check(
    user_id: str = Form(...),
    video: UploadFile = File(...),
):
    """
    Analyse a captured webcam video for multi-signal liveness.
    HARDENED: Now ignores frontend-provided signals and relies ONLY on server-side analysis.
    """
    # Validate user_id alphanumeric
    if not re.match(r"^[a-zA-Z0-9\-]+$", user_id):
        logger.warning(f"Security Alert: Malformed user_id in liveness-check: {user_id}")
        raise HTTPException(status_code=400, detail="Invalid user_id format.")

    # 0. Initialize variables
    is_live = False
    final_confidence = 0.0
    msg = "Verification failed"
    final_reason = "Internal processing error"
    v_status = None
    l_status = "failed"
    risk_level = "HIGH"
    real_face = False
    real_blink = False
    real_move = False
    real_frame = False
    is_simulation = False # Deprecated but kept for schema compatibility
    is_deepfake = False
    df_confidence = 0.0
    record_hash = "none"
    total_trust = 0
    video_path = None

    try:
        # 1. Save the video
        ext = os.path.splitext(video.filename)[1] if video.filename else ".webm"
        video_filename = f"{user_id}_liveness_{int(datetime.now().timestamp())}{ext}"
        video_path = _save_file(video, UPLOADS_DIR, video_filename)

        with get_db() as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT id, name, trust_score FROM users WHERE id = %s", (user_id,))
                row = cursor.fetchone()
                if not row:
                    logger.warning(f"Security Alert: Attempted liveness check for non-existent user: {user_id}")
                    raise HTTPException(status_code=404, detail="User not found.")
                
                total_trust = row["trust_score"]

                # 2. Perform REAL Video Analysis (SERVER-SIDE ONLY)
                analysis = _analyse_video_liveness(video_path)
                
                # 2b. Perform Deepfake Detection
                df_result = deepfake_check(video_path)
                is_deepfake = df_result.get("deepfake", False)
                df_confidence = df_result.get("confidence", 0.0)

                # Signals (HARDENED: No longer uses frontend flags)
                real_face = analysis["face"]
                real_blink = analysis["blink"]
                real_move = analysis["movement"]
                real_frame = analysis["frame"]

                if not real_face:
                    logger.info(f"Liveness failed: Face not detected for user {user_id}")
                    raise HTTPException(status_code=400, detail="Face not detected in frame. Please ensure your face is visible.")

                # 3. Compute Trust Score
                score_val = (
                    (0.30 * (1.0 if real_blink else 0.0)) +
                    (0.25 * (1.0 if real_move else 0.0)) +
                    (0.25 * (1.0 if real_frame else 0.0)) +
                    (0.20 * (1.0 if real_face else 0.0))
                )

                final_confidence = score_val
                trust_score_pct = int(score_val * 100)

                # 4. Determine Risk and Liveness
                is_live = real_face and real_blink and real_move and real_frame
                
                if analysis.get("screen_detected") or analysis.get("moire_detected"):
                    logger.warning(f"Security Alert: Screen/Moire detected for user {user_id}")
                    is_live = False
                if is_deepfake:
                    logger.warning(f"Security Alert: Deepfake detected for user {user_id}")
                    is_live = False

                # Combine reasons
                reasons = []
                if analysis.get("reason"): reasons.append(analysis["reason"])
                if not real_blink: reasons.append("- No blink detected")
                if not real_move: reasons.append("- No head movement detected")
                if is_deepfake: reasons.append("- Synthetic patterns detected (Deepfake risk)")
                final_reason = "\n".join(reasons) if reasons else "Liveness signals inconsistent"

                # Risk level
                if is_live: risk_level = "LOW"
                elif is_deepfake: risk_level = "CRITICAL"
                elif not real_blink or not real_move: risk_level = "HIGH"
                else: risk_level = "MEDIUM"

                if is_live:
                    cursor.execute("UPDATE users SET verification_status = 'verified', liveness_status = 'passed', trust_score = LEAST(trust_score + 15, 100) WHERE id = %s", (user_id,))
                    msg = "Identity Verified. Behavioral biometric signals (Blink/Movement) confirmed."
                    v_status, l_status = "verified", "passed"
                    logger.info(f"User {user_id} verified successfully via liveness check.")
                elif is_deepfake:
                    cursor.execute("UPDATE users SET liveness_status = 'failed', trust_score = GREATEST(trust_score - 50, 10) WHERE id = %s", (user_id,))
                    msg = "Deepfake suspected: Synthetic patterns detected"
                    v_status, l_status = None, "failed"
                    is_live = False
                else:
                    cursor.execute("UPDATE users SET liveness_status = 'failed', trust_score = GREATEST(trust_score - 40, 20) WHERE id = %s", (user_id,))
                    msg = "Spoof Detected: Missing life signals or screen detected"
                    v_status, l_status = None, "failed"

                timestamp = datetime.now().isoformat()
                
                # Audit record with encryption
                audit_data = f"USER:{user_id}|TIME:{timestamp}|TRUST:{trust_score_pct}|SCORE:{round(float(final_confidence), 2)}"
                encrypted_record = CIPHER_SUITE.encrypt(audit_data.encode()).decode()
                record_hash = encrypted_record

                cursor.execute(
                    "INSERT INTO verification_records (user_id, timestamp, trust_score, confidence, record_hash) VALUES (%s, %s, %s, %s, %s)",
                    (user_id, timestamp, trust_score_pct, round(float(final_confidence), 2), record_hash),
                )
                conn.commit()
                cursor.execute("SELECT trust_score FROM users WHERE id = %s", (user_id,))
                total_trust = cursor.fetchone()["trust_score"]

    except Exception as e:
        logger.error(f"CRITICAL ERROR in liveness_check: {str(e)}")
        if isinstance(e, HTTPException): raise e
        raise HTTPException(status_code=500, detail="Internal server error during liveness check.")

    return LivenessResponse(
        liveness=is_live,
        confidence=round(float(final_confidence), 3),
        message=msg,
        reason=final_reason,
        verification_status=v_status,
        liveness_status=l_status,
        trust_score=total_trust,
        risk=risk_level,
        signals=LivenessSignals(
            face=real_face,
            blink=real_blink,
            movement=real_move,
            frame=real_frame,
        ),
        video_path=video_path,
        record_hash=record_hash,
        is_simulation=is_simulation,
        deepfake=is_deepfake,
        deepfake_confidence=df_confidence,
    )


@app.get("/user/{user_id}", response_model=UserOut, dependencies=[Depends(rate_limit)])
async def get_user(user_id: str):
    # Alphanumeric validation
    if not re.match(r"^[a-zA-Z0-9\-]+$", user_id):
        raise HTTPException(status_code=400, detail="Invalid user_id format.")
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="User not found.")

    return UserOut(**dict(row))


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/deepfake-check")
async def deepfake_check_endpoint():
    """Endpoint for manual deepfake checks."""
    return deepfake_check()


# ---------------------------------------------------------------------------
# Selective Sharing Endpoints
# ---------------------------------------------------------------------------

@app.post("/generate-share-token", response_model=ShareTokenResponse, dependencies=[Depends(rate_limit)])
async def generate_share_token(req: ShareTokenRequest):
    """Generate a secure signed JWT for selective identity sharing."""
    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Check if user exists AND is verified (ENFORCEMENT)
            cursor.execute("SELECT id, verification_status FROM users WHERE id = %s", (req.user_id,))
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User not found.")
            
            if user["verification_status"] != "verified":
                logger.warning(f"Security Alert: User {req.user_id} tried to generate token without verification.")
                raise HTTPException(status_code=403, detail="User must be fully verified before sharing identity.")
            
            # Generate JWT
            expiry = datetime.utcnow() + timedelta(minutes=5)
            payload = {
                "user_id": req.user_id,
                "fields": req.fields,
                "exp": expiry
            }
            token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
            
            # Still store in DB for audit trail, but the token itself is the source of truth
            fields_str = ",".join(req.fields)
            cursor.execute(
                "INSERT INTO sharing_tokens (token, user_id, fields, expiry) VALUES (%s, %s, %s, %s)",
                (token, req.user_id, fields_str, expiry)
            )
        conn.commit()

    return ShareTokenResponse(token=token, expiry=expiry.isoformat())


@app.post("/verify-token", dependencies=[Depends(rate_limit)])
async def verify_token(req: VerifyTokenRequest):
    """Verify a sharing token signature and return ONLY the requested fields."""
    try:
        # 1. Decode and verify JWT signature
        payload = jwt.decode(req.token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        user_id = payload["user_id"]
        requested_fields = payload["fields"]
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired.")
    except jwt.InvalidTokenError:
        logger.warning(f"Security Alert: Invalid token signature detected.")
        raise HTTPException(status_code=401, detail="Invalid token signature.")
    except Exception as e:
        logger.error(f"Token verification error: {str(e)}")
        raise HTTPException(status_code=400, detail="Malformed token.")

    with get_db() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cursor:
            # Get user data
            cursor.execute(
                "SELECT name, age, email, phone, dob, address, verification_status FROM users WHERE id = %s",
                (user_id,)
            )
            user = cursor.fetchone()
            if not user:
                raise HTTPException(status_code=404, detail="User data no longer exists.")

            if user["verification_status"] != "verified":
                 raise HTTPException(status_code=403, detail="User identity is no longer verified.")

            # Filter response based on requested fields
            data = {}
            for field_raw in requested_fields:
                if ":" in field_raw:
                    field, mode = field_raw.split(":", 1)
                else:
                    field, mode = field_raw, "disclose" # Default to disclose for backward compatibility if no mode

                if field == "age":
                    data["age"] = {"above_18": user["age"] >= 18}
                
                elif field == "status":
                    data["identity"] = {"verified": user["verification_status"] == "verified"}
                
                elif field == "name":
                    if mode == "verify" and req.expected_name:
                        # Match logic: case-insensitive, stripped
                        is_match = user["name"].strip().lower() == req.expected_name.strip().lower()
                        data["name_match"] = is_match
                    elif mode == "disclose":
                        data["name"] = user["name"]
                    else:
                        # Fallback for name if no expected_name provided in verify mode
                        data["name_verified"] = True

                elif field == "email":
                    if mode == "verify":
                        data["email_verified"] = True
                        if req.expected_email:
                            is_match = user["email"].strip().lower() == req.expected_email.strip().lower()
                            data["email_match"] = is_match
                    elif mode == "mask":
                        email = user["email"]
                        if email and "@" in email:
                            prefix, domain = email.split("@", 1)
                            masked = prefix[:2] + "***" + "@" + domain
                            data["email_masked"] = masked
                        else:
                            data["email_masked"] = email
                    elif mode == "disclose":
                        data["email"] = user["email"]

                elif field == "phone":
                    if mode == "verify":
                        data["mobile_verified"] = True
                        if req.expected_mobile:
                            # Strip non-digits for comparison
                            u_phone = "".join(filter(str.isdigit, user["phone"]))
                            e_phone = "".join(filter(str.isdigit, req.expected_mobile))
                            data["mobile_match"] = u_phone == e_phone
                    elif mode == "mask":
                        phone = user["phone"]
                        if phone and len(phone) >= 4:
                            masked = phone[:2] + "******" + phone[-2:]
                            data["mobile_masked"] = masked
                        else:
                            data["mobile_masked"] = phone
                    elif mode == "disclose":
                        data["mobile"] = user["phone"]

                elif field == "dob":
                    data["dob"] = user["dob"]

                elif field == "address":
                    if mode == "verify":
                        data["address_verified"] = True
                        if req.expected_address:
                            is_match = req.expected_address.strip().lower() in user["address"].strip().lower()
                            data["address_match"] = is_match
                    elif mode == "mask":
                        addr = user["address"]
                        # Simple mask: keep first part of address
                        parts = addr.split(",")
                        if len(parts) > 1:
                            data["address_masked"] = f"{parts[0]}, {parts[-1].strip()}"
                        else:
                            data["address_masked"] = addr[:10] + "..."
                    elif mode == "disclose":
                        data["address"] = user["address"]

            # Metadata for frontend display
            human_scope = []
            for f_raw in requested_fields:
                if ":" in f_raw:
                    f, m = f_raw.split(":", 1)
                else:
                    f, m = f_raw, "disclose"

                if f == "age": human_scope.append("Age Verification (18+)")
                elif f == "status": human_scope.append("Identity Status")
                elif f == "name":
                    if m == "verify": human_scope.append("Name Verification")
                    else: human_scope.append("Legal Name (Disclosure)")
                elif f == "email":
                    if m == "verify": human_scope.append("Email Verification")
                    elif m == "mask": human_scope.append("Email (Masked)")
                    else: human_scope.append("Email Address (Disclosure)")
                elif f == "phone":
                    if m == "verify": human_scope.append("Mobile Verification")
                    elif m == "mask": human_scope.append("Mobile (Masked)")
                    else: human_scope.append("Mobile Number (Disclosure)")
                elif f == "address":
                    if m == "verify": human_scope.append("Address Verification")
                    elif m == "mask": human_scope.append("Address (Masked)")
                    else: human_scope.append("Permanent Address (Disclosure)")
                else: human_scope.append(f.capitalize())

            return {
                "data": data,
                "metadata": {
                    "expiry": datetime.utcfromtimestamp(payload["exp"]).isoformat(),
                    "scope": human_scope,
                    "status": "Active"
                }
            }
