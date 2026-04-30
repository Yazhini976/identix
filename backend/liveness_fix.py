@app.post("/liveness-check", response_model=LivenessResponse)
async def liveness_check(
    user_id: str = Form(...),
    video: UploadFile = File(...),
    face_detected: str = Form("1"),
    blink_detected: str = Form("1"),
    movement_detected: str = Form("1"),
    frame_variation: str = Form("1"),
):
    """
    Analyse a captured webcam video for multi-signal liveness.
    Uses OpenCV to perform REAL analysis on the uploaded video biometric.
    """
    # 0. Initialize variables with defaults
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
    is_simulation = False
    is_deepfake = False
    df_confidence = 0.0
    record_hash = "none"
    total_trust = 0
    video_path = None
    trust_score_pct = 0

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
                    raise HTTPException(status_code=404, detail="User not found.")
                
                total_trust = row["trust_score"]

                # 2. Perform REAL Video Analysis
                analysis = _analyse_video_liveness(video_path)
                
                # 2b. Perform Deepfake Detection
                df_result = deepfake_check(video_path)
                is_deepfake = df_result.get("deepfake", False)
                df_confidence = df_result.get("confidence", 0.0)

                # Helper to safely parse frontend flags
                def to_bool(val):
                    if isinstance(val, bool): return val
                    if val is None or val == "": return True
                    s = str(val).lower().strip()
                    if s in ("1", "true", "yes", "on"): return True
                    if s in ("0", "false", "no", "off"): return False
                    return True

                f_face = to_bool(face_detected)
                f_blink = to_bool(blink_detected)
                f_move = to_bool(movement_detected)
                f_frame = to_bool(frame_variation)

                # Signals
                real_face = analysis["face"] and f_face
                real_blink = analysis["blink"] and f_blink
                real_move = analysis["movement"] and f_move
                real_frame = analysis["frame"] and f_frame

                is_simulation = not all([f_face, f_blink, f_move, f_frame])

                if not real_face:
                    detail_msg = "Simulation: Face not detected" if not f_face else "Face not detected in frame"
                    raise HTTPException(status_code=400, detail=detail_msg)

                # 3. Compute Trust Score
                score_val = (
                    (0.30 * (1.0 if real_blink else 0.0)) +
                    (0.25 * (1.0 if real_move else 0.0)) +
                    (0.25 * (1.0 if real_frame else 0.0)) +
                    (0.20 * (1.0 if real_face else 0.0))
                )

                final_confidence = score_val
                trust_score_pct = int(score_val * 100)

                # 4. Determine Risk and Liveness (USER-SPECIFIED LOGIC)
                is_live = analysis["face"] and real_blink and real_move
                
                if analysis.get("screen_detected") or analysis.get("moire_detected"):
                    is_live = False
                if is_deepfake:
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
                hash_input = f"{user_id}{timestamp}{trust_score_pct}"
                record_hash = hashlib.sha256(hash_input.encode()).hexdigest()

                cursor.execute(
                    "INSERT INTO verification_records (user_id, timestamp, trust_score, confidence, record_hash) VALUES (%s, %s, %s, %s, %s)",
                    (user_id, timestamp, trust_score_pct, round(float(final_confidence), 2), record_hash),
                )
                conn.commit()
                cursor.execute("SELECT trust_score FROM users WHERE id = %s", (user_id,))
                total_trust = cursor.fetchone()["trust_score"]

    except Exception as e:
        print(f"CRITICAL ERROR in liveness_check: {str(e)}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException): raise e

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
