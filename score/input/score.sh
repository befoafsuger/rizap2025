mkdir -p chunks

ffmpeg -i input.mp4 \
  -c copy \
  -map 0 \
  -f segment \
  -segment_time 2 \
  -reset_timestamps 1 \
  chunks/part_%03d.mp4

for file in chunks/part_*.mp4; do
  echo "Sending $file"

  curl -X POST "http://localhost:8000/api/score" \
    -F "file=@${file}" \
    -F "mode=running" \
    -F "max_width=640"
  echo
done
