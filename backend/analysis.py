import sys
import os

# Disabling MediaPipe/CV2 globally to ensure Render deployment success
cv2 = None
np = None
mp = None
mp_pose = None
mp_drawing = None


def calculate_angle(a, b, c):
    """Calculate angle between three points."""
    a = np.array(a) # First
    b = np.array(b) # Mid
    c = np.array(c) # End
    
    radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
    angle = np.abs(radians*180.0/np.pi)
    
    if angle > 180.0:
        angle = 360-angle
        
    return angle


# Ideal Biomechanical Profiles (Angles in degrees)
# Note: These are estimated profiles. Can be fine-tuned with expert input.
IDEAL_TECHNIQUES = {
    # Serves & Smashes
    "serve": {"min_extension_angle": 165, "max_shoulder_tilt": 20, "key_feedback": "Full extension at contact"},
    "jump smash": {"min_extension_angle": 170, "max_shoulder_tilt": 25, "key_feedback": "Explosive jump and snap"},
    "kick smash": {"min_extension_angle": 160, "max_shoulder_tilt": 20, "key_feedback": "Brush up on the ball"},
    "slice smash": {"min_extension_angle": 160, "max_shoulder_tilt": 20, "key_feedback": "Carve around the ball"},
    
    # Overhead / High Shots
    "hook": {"min_extension_angle": 150, "max_shoulder_tilt": 15, "key_feedback": "Rotational power"},
    "high forehand dropshot": {"min_extension_angle": 120, "max_shoulder_tilt": 10, "key_feedback": "Soft hands, controlled descent"},
    "high backhand dropshot": {"min_extension_angle": 120, "max_shoulder_tilt": 10, "key_feedback": "Soft hands, controlled descent"},
    "high forehand lob": {"min_extension_angle": 150, "max_shoulder_tilt": 15, "key_feedback": "Follow through high"},
    "high backhand lob": {"min_extension_angle": 150, "max_shoulder_tilt": 15, "key_feedback": "Follow through high"},

    # Low / Defensive Shots
    "low forehand dropshot": {"min_extension_angle": 100, "max_shoulder_tilt": 10, "key_feedback": "Touch and finesse"},
    "low backhand dropshot": {"min_extension_angle": 100, "max_shoulder_tilt": 10, "key_feedback": "Touch and finesse"},
    "low forehand lob": {"min_extension_angle": 130, "max_shoulder_tilt": 15, "key_feedback": "Lift with legs"},
    "low backhand lob": {"min_extension_angle": 130, "max_shoulder_tilt": 15, "key_feedback": "Lift with legs"},
    
    # Blocks
    "forehand block": {"min_extension_angle": 110, "max_shoulder_tilt": 5, "key_feedback": "Stable racquet face"},
    "backhand block": {"min_extension_angle": 110, "max_shoulder_tilt": 5, "key_feedback": "Stable racquet face"},

    # Pushes
    "slice push": {"min_extension_angle": 140, "max_shoulder_tilt": 10, "key_feedback": "Push through the ball"},
    "kick push": {"min_extension_angle": 140, "max_shoulder_tilt": 10, "key_feedback": "Brush up for spin"},
    "flat push": {"min_extension_angle": 150, "max_shoulder_tilt": 10, "key_feedback": "Drive through the ball"},
    
    # Volleys
    "forehand volley": {
        "max_extension_angle": 160, # Arm should be slightly bent, not fully extended (< 180)
        "max_shoulder_tilt": 15,
        "max_wrist_distance": 0.3, # Normalized distance, hands close together
        "check_opposite_foot": "left", # For Right-handed player (default assumption)
        "key_feedback": "Keep arm bent and step in"
    },
    "backhand volley": {
        "max_extension_angle": 160,
        "max_shoulder_tilt": 15,
        "max_wrist_distance": 0.3,
        "check_opposite_foot": "right", # For functional opposite stepping
        "key_feedback": "Keep arm bent and step in"
    }
}

def analyze_video(video_path, output_dir, shot_type="serve", trim_start=0.0, trim_end=None):
    if cv2 is None or np is None:
        return {
            "score": 0, 
            "feedback": ["Server Error: Computer Vision libraries missing"], 
            "processed_video_url": "",
            "shot_type": shot_type
        }

    # First pass: Track wrist velocity to find shots
    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Seek to trim start
    if trim_start > 0:
        cap.set(cv2.CAP_PROP_POS_MSEC, trim_start * 1000)
    
    wrist_velocities = []
    prev_wrist = None
    frame_count = 0
    
    # Validating dependencies
    if mp_pose is None:
        print("Warning: MediaPipe not found. Returning mock analysis.")
        return {
            "score": 8.5,
            "feedback": ["Great extension (Mock)", "Stable shoulders (Mock)"],
            "processed_video_url": f"/processed/processed_{os.path.basename(video_path)}",
            "shot_type": shot_type,
            "keyframes": {},
            "criteria_breakdown": [{"name": "Mock Analysis", "status": "Met", "notes": "MediaPipe missing on server"}]
        }

    # Store landmarks for second pass to avoid re-processing if memory allows, 
    # but for video memory constraints, we will re-read or use a lightweight first pass.
    # To keep things robust, let's process landmarks in first pass and store relevant data.
    processed_frames_data = [] # List of dicts with landmarks
    
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # Check trim end
            current_time = cap.get(cv2.CAP_PROP_POS_MSEC) / 1000.0
            if trim_end is not None and current_time > trim_end:
                break
            
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            
            frame_data = {"landmarks": None, "wrist_vel": 0.0}
            
            if results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                frame_data["landmarks"] = landmarks
                
                # Wrist velocity tracking
                # Using max of either wrist to account for handedness/visibility
                wrist_l = np.array([landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y])
                wrist_r = np.array([landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y])
                
                curr_vel = 0.0
                if prev_wrist is not None:
                    # prev_wrist is (wrist_l, wrist_r)
                    dist_l = np.linalg.norm(wrist_l - prev_wrist[0])
                    dist_r = np.linalg.norm(wrist_r - prev_wrist[1])
                    curr_vel = max(dist_l, dist_r)
                
                frame_data["wrist_vel"] = curr_vel
                wrist_velocities.append(curr_vel)
                prev_wrist = (wrist_l, wrist_r)
            else:
                wrist_velocities.append(0.0)
            
            processed_frames_data.append(frame_data)
            frame_count += 1
            
    cap.release()
    
    # Identify Shots (Peaks)
    # Heuristic: Minimal distance between peaks = 1.5 seconds (fps * 1.5)
    # Min height = 20% of max observed velocity to filter noise
    if not wrist_velocities:
        return {"score": 0, "feedback": ["No movement detected"], "shot_type": shot_type}

    max_vel = np.max(wrist_velocities)
    peaks, _ = find_peaks(wrist_velocities, height=max_vel*0.2, distance=int(fps*1.5))
    
    # If no peaks found, fallback to using the max velocity frame as a single shot
    if len(peaks) == 0:
        peaks = [np.argmax(wrist_velocities)]

    # Limit to top 5 peaks if noisy, but user said "5 shots", so we expect distinct peaks.
    # If more than 8 peaks, maybe we take the 5 highest? Let's take up to 8 valid peaks.
    # Note: Sorting peaks by time is important.
    
    shot_windows = []
    window_padding = int(fps * 0.5) # +/- 0.5s around peak
    
    for peak_idx in peaks:
        start = max(0, peak_idx - window_padding)
        end = min(frame_count - 1, peak_idx + window_padding)
        shot_windows.append((start, end, peak_idx))

    # Second pass: Evaluation per shot
    ideal = IDEAL_TECHNIQUES.get(shot_type.lower(), IDEAL_TECHNIQUES["serve"])
    
    shot_scores = []
    accumulated_feedback = []
    
    # Criteria tracking
    # We will count how many shots 'failed' a specific check
    criteria_failures = {
        "Arm Extension": 0,
        "Shoulder Stability": 0,
        "Hands Together": 0,
        "Foot Position": 0
    }
    
    total_shots = len(shot_windows)
    
    for start, end, peak_idx in shot_windows:
        shot_frames_scores = []
        shot_feedback = set()
        
        # We also want to capture the status of each criteria for THIS shot
        # to see if it passes or fails overall for this shot.
        # Let's say a shot fails if it fails in > X% of frames in the window?
        # Or simpler: fails at the peak moment (contact)?
        # **Peak moment evaluation** is strongest for "Extension" and "Foot Position".
        # Stability should be checked throughout.
        
        # CHECK AT PEAK (Contact)
        peak_data = processed_frames_data[peak_idx]
        if peak_data["landmarks"]:
            landmarks = peak_data["landmarks"]
            
            # Setup calc vars
            shoulder_l = [landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y]
            elbow_l = [landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ELBOW.value].y]
            wrist_l = [landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.LEFT_WRIST.value].y]
            
            shoulder_r = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y]
            elbow_r = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y]
            wrist_r = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y]
            
            angle_l = calculate_angle(shoulder_l, elbow_l, wrist_l)
            angle_r = calculate_angle(shoulder_r, elbow_r, wrist_r)
            
            # 1. Extension Check (at Peak)
            max_extension = max(angle_l, angle_r)
            extension_failed = False
            
            if "min_extension_angle" in ideal:
                 if max_extension < ideal["min_extension_angle"]:
                     extension_failed = True
                     accumulated_feedback.append(ideal["key_feedback"])
            
            if "max_extension_angle" in ideal:
                 if max_extension > ideal["max_extension_angle"]:
                     extension_failed = True
                     accumulated_feedback.append("Avoid fully extending arm")
            
            if extension_failed:
                criteria_failures["Arm Extension"] += 1

            # 3. Hands Together (at Peak)
            if "max_wrist_distance" in ideal:
                wrist_dist = np.sqrt((wrist_l[0]-wrist_r[0])**2 + (wrist_l[1]-wrist_r[1])**2)
                if wrist_dist > ideal["max_wrist_distance"]:
                    criteria_failures["Hands Together"] += 1
                    accumulated_feedback.append("Keep hands closer together")
            
            # 4. Foot Position (at Peak)
            if "check_opposite_foot" in ideal:
                ankle_l = [landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.LEFT_ANKLE.value].y]
                ankle_r = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x, landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y]
                
                target_foot = ideal["check_opposite_foot"]
                if target_foot == "left":
                    # Check if LEFT is lower (larger Y) -> assume stepper
                     if ankle_l[1] < ankle_r[1]: # Left is higher/back
                         criteria_failures["Foot Position"] += 1
                elif target_foot == "right":
                     if ankle_r[1] < ankle_l[1]: # Right is higher/back
                         criteria_failures["Foot Position"] += 1

        # CHECK STABILITY (Window wide)
        # Average shoulder tilt over the window
        tilt_sum = 0
        valid_frames = 0
        for i in range(start, end+1):
            fdata = processed_frames_data[i]
            if fdata["landmarks"]:
                lms = fdata["landmarks"]
                sl = lms[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y
                sr = lms[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y
                tilt_sum += abs(sl - sr) * 100
                valid_frames += 1
        
        avg_tilt = tilt_sum / valid_frames if valid_frames > 0 else 0
        if "max_shoulder_tilt" in ideal:
            if avg_tilt > ideal["max_shoulder_tilt"]:
                criteria_failures["Shoulder Stability"] += 1
                accumulated_feedback.append("Keep shoulders more stable")
                
        # Calculate score for this shot based on failures
        # Base 10, minus 2 for each failure type detected in this shot
        shot_failures = 0
        if extension_failed: shot_failures += 1
        # Re-calc local failures for score (stability/etc were just counted for aggregate)
        # Simplified:
        start_score = 10.0
        if extension_failed: start_score -= 2.0
        if "max_wrist_distance" in ideal:
             wrist_dist = np.sqrt((wrist_l[0]-wrist_r[0])**2 + (wrist_l[1]-wrist_r[1])**2) # using peak again
             if wrist_dist > ideal["max_wrist_distance"]: start_score -= 1.0
        if avg_tilt > ideal.get("max_shoulder_tilt", 100): start_score -= 1.0
        
        shot_scores.append(max(0, start_score))

    # --- FINAL REPORT GENERATION ---
    final_score = round(np.mean(shot_scores), 1) if shot_scores else 0.0
    unique_feedback = list(set(accumulated_feedback))[:5]
    
    criteria_breakdown = []
    
    # We define relevant criteria for the current shot type
    relevant_keys = []
    if "min_extension_angle" in ideal or "max_extension_angle" in ideal: relevant_keys.append("Arm Extension")
    if "max_shoulder_tilt" in ideal: relevant_keys.append("Shoulder Stability")
    if "max_wrist_distance" in ideal: relevant_keys.append("Hands Together")
    if "check_opposite_foot" in ideal: relevant_keys.append("Foot Position")
    
    for crit in relevant_keys:
        fail_count = criteria_failures[crit]
        # Pass if failed in less than 50% of shots
        is_pass = fail_count <= (total_shots / 2)
        status = "Met" if is_pass else "Not Met"
        
        note = ""
        if not is_pass:
            if crit == "Arm Extension": note = ideal.get("key_feedback", "Check extension")
            elif crit == "Shoulder Stability": note = "Shoulders tilting too much"
            elif crit == "Hands Together": note = "Hands drifting apart"
            elif crit == "Foot Position": note = "Step with opposite foot"
            
        criteria_breakdown.append({
            "name": crit,
            "status": status,
            "notes": note
        })
        
    # --- RENDER VIDEO & KEYFRAMES ---
    # We will render the WHOLE video but annotated
    # Re-open for writing
    cap_read = cv2.VideoCapture(video_path)
    filename = os.path.basename(video_path)
    output_path = os.path.join(output_dir, f"processed_{filename}")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v') 
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    # We need to re-draw landmarks using the data we saved? 
    # Or just re-run process on read? Re-running process is safer for drawing utils demanding objects.
    # But for speed, we already have normalized landmarks. 
    # Drawing requires the landmark object structure.
    # We saved `results.pose_landmarks` object... wait, `processed_frames_data` saved `landmarks` which is a protobuf list.
    # mp_drawing.draw_landmarks needs the `NormalizedLandmarkList` object.
    # We didn't save that. We saved the list of landmarks.
    # So we must re-process for visualization or manually draw lines. Re-process is easier code-wise.
    
    frame_idx = 0
    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap_read.isOpened():
            ret, frame = cap_read.read()
            if not ret:
                break
                
            # If we are in a shot window, draw distinct color?
            in_shot = False
            for s, e, _ in shot_windows:
                if s <= frame_idx <= e:
                    in_shot = True
                    break
            
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = pose.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
            
            if results.pose_landmarks:
                # Color based on in_shot
                conn_color = (0, 255, 0) if in_shot else (200, 200, 200) # Green if shooting, Grey if waiting
                
                mp_drawing.draw_landmarks(image, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                                        mp_drawing.DrawingSpec(color=conn_color, thickness=2, circle_radius=2), 
                                        mp_drawing.DrawingSpec(color=conn_color, thickness=2, circle_radius=2))
            
            out.write(image)
            frame_idx += 1
            
    cap_read.release()
    out.release()

    # Keyframes: Select the BEST shot (highest velocity peak?)
    # Determine best shot index based on score? No, we didn't store score per window index clearly.
    # Let's take the first or middle shot. Middle shot is often good.
    target_peak_idx = peaks[len(peaks)//2] if len(peaks) > 0 else 0
    
    before_frame_idx = max(0, target_peak_idx - fps)
    after_frame_idx = min(frame_count - 1, target_peak_idx + fps)
    
    indices_to_capture = {
        "keyframe_before": before_frame_idx,
        "keyframe_contact": target_peak_idx,
        "keyframe_after": after_frame_idx
    }
    
    captured_paths = {}
    cap_read = cv2.VideoCapture(video_path)
    for key, idx in indices_to_capture.items():
        cap_read.set(cv2.CAP_PROP_POS_FRAMES, idx)
        ret, frame = cap_read.read()
        if ret:
            frame_filename = f"{key}_{filename}.jpg"
            frame_path = os.path.join(output_dir, frame_filename)
            cv2.imwrite(frame_path, frame)
            captured_paths[key] = f"/processed/{frame_filename}"
    cap_read.release()

    return {
        "score": final_score,
        "feedback": unique_feedback,
        "processed_video_url": f"/processed/processed_{filename}",
        "shot_type": shot_type,
        "keyframes": captured_paths,
        "criteria_breakdown": criteria_breakdown
    }
