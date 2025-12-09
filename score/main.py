import time
from pathlib import Path
from typing import Optional, Union

import cv2
import mediapipe as mp
from score.utils import landmark
from features import frame_features_from_xyvis, Estimator

def process_video(
    input_path: Union[str, Path],
    output_path: Union[str, Path],
    mode: str = "auto",
    max_width: Optional[int] = None,
    model_complexity: int = 0,
    min_det_conf: float = 0.5,
    min_track_conf: float = 0.5,
) -> None:
    input_path = Path(input_path)
    if not input_path.exists():
        raise RuntimeError(f"Input file does not exist: {input_path}")
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(
        static_image_mode=False,
        model_complexity=model_complexity,
        min_detection_confidence=min_det_conf,
        min_tracking_confidence=min_track_conf,
    )
    connections = mp_pose.POSE_CONNECTIONS

    cap = cv2.VideoCapture(str(input_path))
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open {input_path}")

    in_w: int = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    in_h: int = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps: float = cap.get(cv2.CAP_PROP_FPS) or 30.0
    scale: float = 1.0
    if max_width is not None and in_w > max_width:
        scale = max_width / float(in_w)
    out_w: int = int(round(in_w * scale))
    out_h: int = int(round(in_h * scale))
    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(str(output_path), fourcc, fps, (out_w, out_h))

    estimator = Estimator(fps=fps, window_seconds=3.0, stable_threshold=3, mode=mode)

    frame_idx: int = 0
    prev_t: float = time.time()
    font: int = cv2.FONT_HERSHEY_SIMPLEX

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

            label: str = "unknown"
            score: int = 0
            conf: float = 0.0
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
                    info = f"hz:{med['dom_freq']:.2f} ps:{med['periodic_strength']:.1f} as:{med['ankle_speed_norm']:.2f} hy:{med['hip_y_std_norm']:.3f}"
                else:
                    info = "hz:0.00 ps:0.0 as:0.00 hy:0.000"
                cv2.putText(canvas, info, (12, out_h - 18), font, 0.5, (200, 200, 200), 1)

            cv2.rectangle(canvas, (6, 6), (560, 120), (0, 0, 0, 140), -1)
            cv2.putText(canvas, f"Mode: {mode}", (12, 28), font, 0.7, (200, 200, 200), 2)
            cv2.putText(canvas, f"Label: {label}", (12, 58), font, 0.9, (0, 255, 255), 2)
            cv2.putText(canvas, f"Score: {score}/100", (12, 92), font, 0.8, (0, 200, 0), 2)
            cv2.putText(canvas, f"Conf: {conf:.2f}", (420, 92), font, 0.6, (200, 200, 200), 2)

            now = time.time()
            dt = now - prev_t if prev_t else 1e-6
            prev_t = now
            fps_est = 1.0 / (dt + 1e-6)
            cv2.putText(canvas, f"FPS: {fps_est:.1f}", (out_w - 120, 30), font, 0.7, (0, 255, 0), 2)

            out.write(canvas)
            if frame_idx % 120 == 0:
                print(f"Processed {frame_idx} frames Label={label} Score={score} Conf={conf:.2f}")

    finally:
        cap.release()
        out.release()
        pose.close()

if __name__ == "__main__":
    INPUT_PATH: str = "input/input.mp4"
    OUTPUT_PATH: str = "out/running.mp4"
    MAX_WIDTH: Optional[int] = None
    MODE: str = "running"
    MODEL_COMPLEXITY: int = 0
    MIN_DET_CONFIDENCE: float = 0.5
    MIN_TRACK_CONFIDENCE: float = 0.5

    process_video(
        INPUT_PATH,
        OUTPUT_PATH,
        mode=MODE,
        max_width=MAX_WIDTH,
        model_complexity=MODEL_COMPLEXITY,
        min_det_conf=MIN_DET_CONFIDENCE,
        min_track_conf=MIN_TRACK_CONFIDENCE,
    )
