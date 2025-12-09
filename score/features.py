from collections import deque
from typing import Any, Deque, Dict, List, Optional, Sequence, Tuple

import math
import numpy as np

from score.utils import dist, angle_at, torso_angle_deg

def frame_features_from_xyvis(xyvis: np.ndarray) -> Dict[str, Any]:
    f: Dict[str, Any] = {"valid": False}
    vis = xyvis[:, 2]
    req_idx: List[int] = [11, 12, 23, 24, 25, 26, 27, 28, 15, 16, 13, 14]
    if np.mean(vis[req_idx]) < 0.12:
        return f

    ls = xyvis[11, :2]
    rs = xyvis[12, :2]
    lh = xyvis[23, :2]
    rh = xyvis[24, :2]
    lk = xyvis[25, :2]
    rk = xyvis[26, :2]
    la = xyvis[27, :2]
    ra = xyvis[28, :2]
    lw = xyvis[15, :2]
    rw = xyvis[16, :2]
    le = xyvis[13, :2]
    re = xyvis[14, :2]

    shoulder_mid = (ls + rs) / 2.0
    hip_mid = (lh + rh) / 2.0
    shoulder_width = max(dist(ls, rs), 1e-6)

    foot_dist = dist(la, ra) / shoulder_width
    wrist_dist = dist(lw, rw) / shoulder_width

    left_knee_ang = angle_at(lh, lk, la)
    right_knee_ang = angle_at(rh, rk, ra)
    avg_knee = float((left_knee_ang + right_knee_ang) / 2.0)
    knee_diff = abs(left_knee_ang - right_knee_ang)

    left_hip_ang = angle_at(ls, lh, lk)
    right_hip_ang = angle_at(rs, rh, rk)
    avg_hip_ang = float((left_hip_ang + right_hip_ang) / 2.0)

    left_elbow_ang = angle_at(ls, le, lw)
    right_elbow_ang = angle_at(rs, re, rw)
    avg_elbow = float((left_elbow_ang + right_elbow_ang) / 2.0)

    t_ang = torso_angle_deg(shoulder_mid, hip_mid)

    f.update(
        {
            "valid": True,
            "shoulder_width_px": float(shoulder_width),
            "hip_x": float(hip_mid[0]),
            "hip_y": float(hip_mid[1]),
            "hip_norm_x": float(hip_mid[0] / (shoulder_width + 1e-6)),
            "hip_norm_y": float(hip_mid[1] / (shoulder_width + 1e-6)),
            "foot_dist_norm": float(foot_dist),
            "wrist_dist_norm": float(wrist_dist),
            "left_knee": left_knee_ang,
            "right_knee": right_knee_ang,
            "avg_knee": avg_knee,
            "knee_diff": knee_diff,
            "avg_hip_ang": avg_hip_ang,
            "avg_elbow": avg_elbow,
            "torso_angle": t_ang,
            "left_ankle_x": float(la[0]),
            "left_ankle_y": float(la[1]),
            "right_ankle_x": float(ra[0]),
            "right_ankle_y": float(ra[1]),
        }
    )
    return f

class Estimator:
    def __init__(
        self,
        fps: float = 30,
        window_seconds: float = 3.0,
        stable_threshold: int = 3,
        mode: str = "auto",
    ) -> None:
        self.fps: float = max(1.0, float(fps))
        self.window_size: int = max(8, int(round(self.fps * window_seconds)))
        self.buf: Deque[Dict[str, Any]] = deque(maxlen=self.window_size)
        self.hip_y_series: Deque[float] = deque(maxlen=self.window_size)
        self.hip_x_series: Deque[float] = deque(maxlen=self.window_size)
        self.lax: Deque[float] = deque(maxlen=self.window_size)
        self.lay: Deque[float] = deque(maxlen=self.window_size)
        self.rax: Deque[float] = deque(maxlen=self.window_size)
        self.ray: Deque[float] = deque(maxlen=self.window_size)
        self.shoulder_width_series: Deque[float] = deque(maxlen=self.window_size)
        self.standing_hip_y: Optional[float] = None
        self.standing_initialized: bool = False
        self.prev_label: Optional[str] = None
        self.candidate_label: Optional[str] = None
        self.stable_count: int = 0
        self.stable_threshold: int = stable_threshold
        self.mode: str = mode

    def push(self, feat: Dict[str, Any]) -> None:
        if not isinstance(feat, dict):
            return
        self.buf.append(feat)
        if feat.get("valid"):
            self.hip_y_series.append(feat["hip_y"])
            self.hip_x_series.append(feat["hip_x"])
            self.lax.append(feat["left_ankle_x"])
            self.lay.append(feat["left_ankle_y"])
            self.rax.append(feat["right_ankle_x"])
            self.ray.append(feat["right_ankle_y"])
            self.shoulder_width_series.append(feat["shoulder_width_px"])
            if not self.standing_initialized and feat["avg_knee"] > 150:
                if self.standing_hip_y is None:
                    self.standing_hip_y = feat["hip_y"]
                else:
                    self.standing_hip_y = 0.95 * self.standing_hip_y + 0.05 * feat["hip_y"]

                if len([b for b in self.buf if b.get("valid") and b["avg_knee"] > 150]) > self.fps * 1.0:
                    self.standing_initialized = True

    def _temporal_stats(self) -> Optional[Dict[str, float]]:
        valid = [b for b in self.buf if b.get("valid")]
        if len(valid) == 0:
            return None
        med: Dict[str, float] = {}
        med["median_knee"] = float(np.median([b["avg_knee"] for b in valid]))
        med["median_torso"] = float(np.median([b["torso_angle"] for b in valid]))
        med["median_wrist_norm"] = float(np.median([b["wrist_dist_norm"] for b in valid]))
        med["median_foot_norm"] = float(np.median([b["foot_dist_norm"] for b in valid]))
        med["knee_diff_med"] = float(np.median([b["knee_diff"] for b in valid]))
        med["hip_ang_med"] = float(np.median([b["avg_hip_ang"] for b in valid]))
        med["elbow_med"] = float(np.median([b["avg_elbow"] for b in valid]))
        med["shoulder_width_median"] = (
            float(np.median(list(self.shoulder_width_series)))
            if len(self.shoulder_width_series) > 0
            else 1.0
        )

        hip_y = np.array(self.hip_y_series) if len(self.hip_y_series) > 0 else np.array([0.0])
        hip_x = np.array(self.hip_x_series) if len(self.hip_x_series) > 0 else np.array([0.0])

        sw = med["shoulder_width_median"] + 1e-6
        med["hip_y_std_norm"] = float(np.std(hip_y) / sw)
        med["hip_y_range_norm"] = float((np.max(hip_y) - np.min(hip_y)) / sw) if len(hip_y) > 1 else 0.0
        med["hip_x_std_norm"] = float(np.std(hip_x) / sw)

        dom_freq = 0.0
        periodic_strength = 0.0
        if len(hip_y) >= max(8, int(self.fps * 0.5)):
            y = hip_y - np.mean(hip_y)
            yf = np.abs(np.fft.rfft(y))
            yf[0] = 0
            freqs = np.fft.rfftfreq(len(y), d=1.0 / self.fps)
            idx = int(np.argmax(yf))
            if idx < len(freqs):
                dom_freq = float(freqs[idx])
                peak = float(yf[idx])
                rest = np.median(np.delete(yf, idx)) + 1e-6
                periodic_strength = float(peak / rest)
        med["dom_freq"] = dom_freq
        med["periodic_strength"] = periodic_strength

        def mean_ankle_speed_norm(xs: List[float], ys: List[float]) -> float:
            if len(xs) < 2 or len(self.shoulder_width_series) < 1:
                return 0.0
            diffs = [math.hypot(xs[i + 1] - xs[i], ys[i + 1] - ys[i]) for i in range(len(xs) - 1)]
            diffs = np.array(diffs)
            sh = float(np.median(list(self.shoulder_width_series))) if len(self.shoulder_width_series) > 0 else sw
            mean_norm = float(np.mean(diffs) / (sh + 1e-6) * self.fps)
            return mean_norm

        left_speed = mean_ankle_speed_norm(list(self.lax), list(self.lay))
        right_speed = mean_ankle_speed_norm(list(self.rax), list(self.ray))
        med["ankle_speed_norm"] = float((left_speed + right_speed) / 2.0)

        med["motion_energy"] = float(
            np.mean(
                [
                    np.linalg.norm(
                        [
                            b.get("left_ankle_x", 0) - b.get("right_ankle_x", 0),
                            b.get("left_ankle_y", 0) - b.get("right_ankle_y", 0),
                        ]
                    )
                    for b in valid
                ]
            )
        )

        return med

    @staticmethod
    def _logistic(x: float, k: float = 1.0, x0: float = 0.0) -> float:
        return 1.0 / (1.0 + np.exp(-k * (x - x0)))

    def detect(self) -> Tuple[str, int, float]:
        med = self._temporal_stats()
        if med is None:
            return "unknown", 0, 0.0

        scores: Dict[str, float] = {}

        run_freq_score = np.clip(1 - abs(2.2 - med["dom_freq"]) / 1.4, 0.0, 1.0)
        run_periodic = self._logistic(med["periodic_strength"], k=0.8, x0=2.0)
        run_speed = self._logistic(med["ankle_speed_norm"], k=1.2, x0=0.8)
        run_side_motion = self._logistic(med["hip_x_std_norm"], k=2.0, x0=0.2)
        run_score_raw = 0.45 * run_periodic + 0.3 * run_speed + 0.15 * run_side_motion + 0.1 * run_freq_score
        scores["running"] = run_score_raw

        walk_freq_score = np.clip(1 - abs(1.2 - med["dom_freq"]) / 0.9, 0.0, 1.0)
        walk_speed = self._logistic(med["ankle_speed_norm"], k=1.0, x0=0.35)
        walk_periodic = self._logistic(med["periodic_strength"], k=0.6, x0=1.2)
        scores["walking"] = 0.5 * walk_periodic + 0.35 * walk_freq_score + 0.15 * walk_speed

        squat_depth = np.clip((160.0 - med["median_knee"]) / 80.0, 0.0, 1.0)
        squat_nonperiodic = 1.0 - self._logistic(med["periodic_strength"], k=0.6, x0=1.0)
        squat_torso = self._logistic(100.0 - abs(90.0 - med["hip_ang_med"]), k=0.05, x0=40.0)
        scores["squat"] = 0.55 * squat_depth + 0.3 * squat_nonperiodic + 0.15 * squat_torso

        lunge_asym = self._logistic(med["knee_diff_med"], k=0.15, x0=20.0)
        lunge_step = self._logistic(med["hip_x_std_norm"], k=2.0, x0=0.12)
        scores["lunge"] = 0.6 * lunge_asym + 0.4 * lunge_step

        pushup_torso = self._logistic(40.0 - med["median_torso"], k=0.2, x0=8.0)
        pushup_knee = self._logistic(med["median_knee"], k=0.03, x0=120.0)
        pushup_motion = 1.0 - self._logistic(med["hip_y_range_norm"], k=2.0, x0=0.2)
        scores["pushup"] = 0.6 * pushup_torso + 0.25 * pushup_knee + 0.15 * pushup_motion

        plank_torso = pushup_torso
        plank_still = 1.0 - self._logistic(med["hip_y_std_norm"], k=3.0, x0=0.05)
        scores["plank"] = 0.7 * plank_torso + 0.3 * plank_still

        jj_w = self._logistic(med["median_wrist_norm"], k=2.0, x0=1.2)
        jj_f = self._logistic(med["median_foot_norm"], k=2.0, x0=1.2)
        jj_period = self._logistic(med["periodic_strength"], k=0.6, x0=1.3)
        scores["jumping_jack"] = 0.45 * (jj_w + jj_f) / 2.0 + 0.55 * jj_period

        sit_amp = self._logistic(med["hip_y_std_norm"], k=6.0, x0=0.06)
        sit_freq = np.clip(1 - abs(1.0 - med["dom_freq"]) / 0.8, 0.0, 1.0)
        scores["situp"] = 0.5 * sit_amp + 0.5 * sit_freq

        burp_amp = np.clip(med["hip_y_range_norm"] / 0.6, 0.0, 1.0)
        burp_torso = 1.0 - self._logistic(med["median_torso"], k=0.08, x0=50.0)
        scores["burpee"] = 0.6 * burp_amp + 0.4 * burp_torso

        stand_energy = 1.0 - self._logistic(med["ankle_speed_norm"], k=1.5, x0=0.15)
        stand_y = 1.0 - self._logistic(med["hip_y_std_norm"], k=4.0, x0=0.03)
        scores["standing"] = 0.6 * stand_energy + 0.4 * stand_y

        names = list(scores.keys())
        vals = np.array([scores[n] for n in names], dtype=float)
        vals_shift = vals - np.max(vals)
        expv = np.exp(vals_shift * 6.0)
        probs = expv / (np.sum(expv) + 1e-12)
        probs_by_name: Dict[str, float] = {n: float(probs[i]) for i, n in enumerate(names)}

        best_label = max(probs_by_name.items(), key=lambda x: x[1])[0]
        best_conf = probs_by_name[best_label]

        if self.mode != "auto":
            override = str(self.mode).lower()
            if override in names:
                best_label = override
                best_conf = max(best_conf, 0.6)
            else:
                best_conf = max(best_conf, 0.55)

        if self.prev_label is None:
            self.prev_label = best_label
            self.candidate_label = best_label
            self.stable_count = 1
        else:
            if best_label == self.candidate_label:
                self.stable_count += 1
            else:
                self.candidate_label = best_label
                self.stable_count = 1
            if self.candidate_label != self.prev_label and self.stable_count >= self.stable_threshold:
                self.prev_label = self.candidate_label
                self.stable_count = 0
        final_label = self.prev_label

        score_val = self.form_score(final_label, med)
        return final_label, int(round(score_val)), float(best_conf)

    def form_score(self, label: str, med: Optional[Dict[str, float]]) -> float:
        if med is None:
            return 0.0
        if label == "running":
            p = np.clip(self._logistic(med["periodic_strength"], k=0.8, x0=2.0), 0, 1)
            s = np.clip(med["ankle_speed_norm"] / 2.2, 0, 1)
            freq_fit = np.clip(1 - abs(2.2 - med["dom_freq"]) / 1.6, 0, 1)
            score = 0.5 * p + 0.35 * s + 0.15 * freq_fit
            return float(score * 100.0)
        if label == "walking":
            freq_fit = np.clip(1 - abs(1.2 - med["dom_freq"]) / 1.0, 0, 1)
            speed_fit = np.clip(med["ankle_speed_norm"] / 1.0, 0, 1)
            periodic = np.clip(self._logistic(med["periodic_strength"], k=0.6, x0=1.2), 0, 1)
            score = 0.5 * freq_fit + 0.35 * periodic + 0.15 * speed_fit
            return float(score * 100.0)
        if label == "squat":
            depth = np.clip((160.0 - med["median_knee"]) / 80.0, 0, 1)
            symmetry = np.clip(1.0 - med["knee_diff_med"] / 70.0, 0, 1)
            torso_pen = np.clip(1.0 - abs(90.0 - med["hip_ang_med"]) / 50.0, 0, 1)
            score = 0.6 * depth + 0.25 * symmetry + 0.15 * torso_pen
            return float(score * 100.0)
        if label == "lunge":
            asym = np.clip(med["knee_diff_med"] / 60.0, 0, 1)
            step = np.clip(med["hip_x_std_norm"] / 0.5, 0, 1)
            score = 0.6 * asym + 0.4 * step
            return float(score * 100.0)
        if label == "pushup":
            torso = np.clip(1.0 - med["median_torso"] / 40.0, 0, 1)
            elbow = np.clip(1.0 - abs(80.0 - med["elbow_med"]) / 60.0, 0, 1)
            motion = np.clip(1.0 - med["hip_y_range_norm"] / 0.3, 0, 1)
            score = 0.6 * torso + 0.3 * elbow + 0.1 * motion
            return float(score * 100.0)
        if label == "plank":
            t = np.clip(1.0 - med["median_torso"] / 25.0, 0, 1)
            mv = np.clip(1.0 - med["hip_y_std_norm"] / 0.05, 0, 1)
            score = 0.75 * t + 0.25 * mv
            return float(score * 100.0)
        if label == "jumping_jack":
            ws = np.clip((med["median_wrist_norm"] - 1.2) / (2.0 - 1.2), 0, 1)
            fs = np.clip((med["median_foot_norm"] - 1.2) / (2.0 - 1.2), 0, 1)
            periodic = np.clip(self._logistic(med["periodic_strength"], k=0.6, x0=1.3), 0, 1)
            score = 0.4 * (0.5 * ws + 0.5 * fs) + 0.6 * periodic
            return float(score * 100.0)
        if label == "burpee":
            amp = np.clip(med["hip_y_range_norm"] / 0.6, 0, 1)
            t = np.clip(1.0 - med["median_torso"] / 60.0, 0, 1)
            score = 0.6 * amp + 0.4 * t
            return float(score * 100.0)
        if label == "situp":
            freq_score = np.clip(1 - abs(1.0 - med["dom_freq"]) / 0.8, 0, 1)
            amp = np.clip(med["hip_y_std_norm"] / 0.12, 0, 1)
            score = 0.5 * freq_score + 0.5 * amp
            return float(score * 100.0)
        if label == "standing":
            s = np.clip(1.0 - med["ankle_speed_norm"] / 0.25, 0, 1)
            y = np.clip(1.0 - med["hip_y_std_norm"] / 0.02, 0, 1)
            return float((0.6 * s + 0.4 * y) * 100.0)
        return 0.0
