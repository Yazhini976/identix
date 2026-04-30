import cv2
import numpy as np

def deepfake_check(video_path: str = None) -> dict:
    """
    Enhanced deepfake detection module.
    Uses frequency analysis and Laplacian variance to detect 
    unnatural synthetic artifacts or screen reproduction signatures.
    """
    if not video_path:
        return {"deepfake": False, "confidence": 0.0}

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        return {"deepfake": False, "confidence": 0.0}

    variances = []
    moire_detected = False
    
    frame_count = 0
    while frame_count < 30:
        ret, frame = cap.read()
        if not ret:
            break
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        variances.append(cv2.Laplacian(gray, cv2.CV_64F).var())
        
        # Frequency analysis for Moiré detection
        # (Sample every 5 frames for better temporal coverage)
        if frame_count % 5 == 0:
            f = np.fft.fft2(gray)
            fshift = np.fft.fftshift(f)
            magnitude_spectrum = 20 * np.log(np.abs(fshift) + 1e-9)
            
            rows, cols = gray.shape
            # Search a larger high-frequency band
            # Digital screens have periodic grids that create spikes in outer FFT regions
            h_region = magnitude_spectrum[0:rows//3, 0:cols//3]
            v_region = magnitude_spectrum[rows*2//3:, cols*2//3:]
            
            # Relaxed threshold from 155 to 175 to avoid false positives
            if np.max(h_region) > 175 or np.max(v_region) > 175:
                moire_detected = True
        
        frame_count += 1
    
    cap.release()

    if not variances:
        return {"deepfake": False, "confidence": 0.0}

    avg_var = np.mean(variances)
    
    # Heuristic: Deepfakes or screen photos often have either 
    # extreme smoothness (low variance < 12) or unnatural noise (very high variance > 600)
    # OR they show Moiré patterns.
    is_suspicious = avg_var < 12 or avg_var > 600 or moire_detected
    
    # Calculate confidence based on severity
    if moire_detected:
        confidence = 0.98
    elif is_suspicious:
        confidence = 0.90
    else:
        confidence = 0.10

    return {
        "deepfake": is_suspicious,
        "confidence": confidence,
        "message": "Screen reproduction or synthetic patterns detected" if is_suspicious else "No synthetic patterns detected",
        "moire_detected": moire_detected,
        "avg_variance": round(float(avg_var), 2)
    }
