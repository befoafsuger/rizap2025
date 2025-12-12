import math
from typing import Sequence, Any
import numpy as np

# √Σ (ai - bi)^2
def dist(a: Sequence[float], b: Sequence[float]) -> float:
    return float(np.linalg.norm(np.array(a) - np.array(b)))

# arccos((BA・BC)/(|BA| |BC|))
def angle_at(a: Sequence[float], b: Sequence[float], c: Sequence[float]) -> float:
    a_arr = np.array(a)
    b_arr = np.array(b)
    c_arr = np.array(c)
    # BA = A − B
    ba = a_arr - b_arr
    # BC = C − B
    bc = c_arr - b_arr
    if np.linalg.norm(ba) < 1e-6 or np.linalg.norm(bc) < 1e-6:
        # degenerate -> 180
        return 180.0

    # (BA·BC)/(|BA||BC|)
    cosang = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    # clamp to [-1,1]
    cosang = np.clip(cosang, -1.0, 1.0)
    # arccos(cosang)
    return float(np.degrees(np.arccos(cosang)))


# | atan2(dy, dx) | angle = min(|θ|, 180−|θ|)
def torso_angle_deg(shoulder_mid: Sequence[float], hip_mid: Sequence[float]) -> float:
    # v = hip − shoulder
    v = np.array(hip_mid) - np.array(shoulder_mid)
    # dx = v_x, dy = v_y
    dx, dy = v[0], v[1]
    # ang = |θ|
    ang = abs(math.degrees(math.atan2(dy, dx)))
    # ang = min(|θ|, 180−|θ|)
    ang = min(ang, 180 - ang)
    return ang

def landmark(landmarks: Sequence[Any], image_width: int, image_height: int) -> np.ndarray:
    # 33*3
    out: np.ndarray = np.zeros((33, 3), dtype=np.float32)
    for i, lm in enumerate(landmarks):
        x = int(round(lm.x * image_width))
        y = int(round(lm.y * image_height))
        # x ∈ [0, W−1]
        x = min(max(x, 0), image_width - 1)
        # y ∈ [0, H−1]
        y = min(max(y, 0), image_height - 1)
        vis = getattr(lm, "visibility", None) or getattr(lm, "presence", None) or 1.0
        out[i, 0] = x
        out[i, 1] = y
        out[i, 2] = float(vis)
    return out
