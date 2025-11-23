#!/bin/bash

SRC_DIR="/Volumes/LH.io/geojson"
OUT_DIR="/Volumes/LH.io/merged"
OUT_FILE="$OUT_DIR/land_parcels_merged.geojson"

mkdir -p "$OUT_DIR"

first=true
for f in "$SRC_DIR"/*.geojson; do
  echo "Adding $(basename "$f")..."
  if $first; then
    # Create output with the first file
    ogr2ogr -f GeoJSON "$OUT_FILE" "$f" -nln parcels
    first=false
  else
    # Append subsequent files into same layer
    ogr2ogr -f GeoJSON -update -append "$OUT_FILE" "$f" -nln parcels
  fi
done

echo "Done. Merged file at: $OUT_FILE"

