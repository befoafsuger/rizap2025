# main.py

import time
import math
from pathlib import Path
from collections import deque
from typing import Any, Deque, Dict, List, Optional, Sequence, Tuple, Union
import numpy as np
import cv2
import mediapipe as mp

def dist(a: Sequence[float], b: Sequence[float]) -> float:
    # √Σ (ai - bi)^2
    return float(np.linalg.norm(np.array(a) - np.array(b)))

def angle_at(a: Sequence[float], b: Sequence[float], c: Sequence[float]) -> float:
    a_arr = np.array(a)
    b_arr = np.array(b)
    c_arr = np.array(c)
    # BA = A − B
    ba = a_arr - b_arr
    # BC = C − B
    bc = c_arr - b_arr
    if np.linalg.norm(ba) < 1e-6 or np.linalg.norm(bc) < 1e-6:
        # d -> 180
        return 180.0

    # (BA·BC)/(|BA||BC|)
    cosang = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    # clamp to [-1,1]
    cosang = np.clip(cosang, -1.0, 1.0)
    # arccos(cosang)
    return float(np.degrees(np.arccos(cosang)))

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