import os
import time
import tempfile
from pathlib import Path
from typing import Optional, Union, List, Dict
from collections import Counter

import cv2
import mediapipe as mp
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel

from score.utils import landmark
from features import frame_features_from_xyvis, Estimator

app = FastAPI(title="Score API")

class TemporalStats(BaseModel):
    dom_freq: Optional[float] = None
    periodic_strength: Optional[float] = None
    ankle_speed_norm: Optional[float] = None
    hip_y_std_norm: Optional[float] = None

class ScoreSummary(BaseModel):
    frames_processed: int
    input_fps: float
    duration_seconds: float
    mode: str
    avg_score: Optional[float] = None
    max_score: Optional[int] = None
    last_label: Optional[str] = None
    last_score: Optional[int] = None
    last_conf: Optional[float] = None
    temporal_stats: Optional[TemporalStats] = None
    processing_time_seconds: float

def _temporal_stats_to_dict(med: Dict) -> Dict:
    return {
        "dom_freq": med.get("dom_freq"),
        "periodic_strength": med.get("periodic_strength"),
        "ankle_speed_norm": med.get("ankle_speed_norm"),
        "hip_y_std_norm": med.get("hip_y_std_norm"),
    }

def analyze_video(
    input_path: Union[str, Path],
    mode: str = "auto",
    max_width: Optional[int] = None,
    model_complexity: int = 0,
    min_det_conf: float = 0.5,
    min_track_conf: float = 0.5,
    annotated_output_path: Optional[Union[str, Path]] = None,
) -> ScoreSummary:
    input_path = Path(input_path)
    if not input_path.exists():
        raise RuntimeError(f"Input file does not exist: {input_path}")

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=int(model_complexity),
        min_detection_confidence=float(min_det_conf),
        min_tracking_confidence=float(min_track_conf),
    )
    connections = mp_pose.POSE_CONNECTIONS

    cap = cv2.VideoCapture(str(input_path))
    if not cap.isOpened():
        pose.close()
        raise RuntimeError(f"Cannot open {input_path}")

    in_w: int = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    in_h: int = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps: float = cap.get(cv2.CAP_PROP_FPS) or 30.0
    scale: float = 1.0
    if max_width is not None and in_w > max_width:
        scale = float(max_width) / float(in_w)
    out_w: int = int(round(in_w * scale))
    out_h: int = int(round(in_h * scale))

    out = None

    estimator = Estimator(fps=fps, window_seconds=3.0, stable_threshold=3, mode=mode)

    frame_idx = 0
    scores: List[int] = []
    confs: List[float] = []
    labels: List[str] = []
    last_med = None

    start_time = time.time()
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_idx += 1
            frame_proc = cv2.resize(frame, (out_w, out_h)) if scale != 1.0 else frame
            rgb = cv2.cvtColor(frame_proc, cv2.COLOR_BGR2RGB)
            results = pose.process(rgb)
            canvas = frame_proc.copy()

            label = "unknown"
            score = 0
            conf = 0.0
            if results.pose_landmarks:
                lm = results.pose_landmarks.landmark
                if len(lm) < 33:
                    padded = list(lm) + [
                        mp.framework.formats.landmark_pb2.NormalizedLandmark()
                        for _ in range(33 - len(lm))
                    ]
                    lm = padded[:33]
                xyvis = landmark(lm, out_w, out_h)

                for a, b in connections:
                    if a < 0 or b < 0 or a >= xyvis.shape[0] or b >= xyvis.shape[0]:
                        continue
                    xa, ya, va = xyvis[a]
                    xb, yb, vb = xyvis[b]
                    if va > 0.12 and vb > 0.12:
                        cv2.line(canvas, (int(xa), int(ya)), (int(xb), int(yb)), (0, 200, 255), 2)
                for _, (x, y, v) in enumerate(xyvis):
                    c = (0, 255, 0) if v > 0.12 else (90, 90, 90)
                    cv2.circle(canvas, (int(x), int(y)), 3, c, -1)

                feat = frame_features_from_xyvis(xyvis)
                estimator.push(feat)
                label, score, conf = estimator.detect()
                med = estimator._temporal_stats()
                if med is not None:
                    last_med = med

                scores.append(int(score))
                confs.append(float(conf))
                labels.append(str(label))

    finally:
        cap.release()
        if out is not None:
            out.release()
        pose.close()

    processing_time = time.time() - start_time
    avg_score = float(sum(scores) / len(scores)) if scores else None
    max_score = int(max(scores)) if scores else None
    last_label = labels[-1] if labels else None
    last_score = int(scores[-1]) if scores else None
    last_conf = float(confs[-1]) if confs else None

    temporal_stats = _temporal_stats_to_dict(last_med) if last_med is not None else None

    summary = ScoreSummary(
        frames_processed=frame_idx,
        input_fps=float(fps),
        duration_seconds=float(frame_idx) / float(fps) if fps > 0 else 0.0,
        mode=mode,
        avg_score=avg_score,
        max_score=max_score,
        last_label=last_label,
        last_score=last_score,
        last_conf=last_conf,
        temporal_stats=temporal_stats,
        processing_time_seconds=processing_time,
    )
    return summary

@app.post("/api/score", response_model=ScoreSummary)
async def api_score(
    file: UploadFile = File(...),
    mode: str = Form("auto"),
    max_width: Optional[int] = Form(None),
    model_complexity: int = Form(0),
    min_det_conf: float = Form(0.5),
    min_track_conf: float = Form(0.5),
    save_annotated: bool = Form(False),
):
    if not file.filename.lower().endswith((".mp4", ".mov", ".m4v")):
        raise HTTPException(status_code=400, detail="Unsupported file extension. Please upload MP4/MOV/M4V.")

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp_path = tmp.name
            contents = await file.read()
            tmp.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {e}")

    try:
        summary = analyze_video(
            tmp_path,
            mode=mode,
            max_width=max_width,
            model_complexity=model_complexity,
            min_det_conf=min_det_conf,
            min_track_conf=min_track_conf,
        )

        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {e}")
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
