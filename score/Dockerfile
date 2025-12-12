FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    ffmpeg \
    libsm6 \
    libxext6 \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml uv.lock ./
COPY score/ ./score
COPY app.py .
COPY features.py .

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --upgrade pip setuptools wheel

RUN pip install .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
