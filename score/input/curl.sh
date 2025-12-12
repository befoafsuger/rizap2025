curl -X POST "http://localhost:8000/api/score" \
  -F "file=@input.mp4" \
  -F "mode=running" \
  -F "max_width=640"