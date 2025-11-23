#!/bin/bash

# >>> CHANGE THIS LINE TO MATCH YOUR DRIVE <<<
INPUT_DIR="/Volumes/LH.io/gml files"
OUTPUT_DIR="/Volumes/LH.io/shapefiles_zipped"

mkdir -p "$OUTPUT_DIR"

# Disable schema fetching (IMPORTANT FIX)
export OGR_GML_FETCH_SCHEMA=NO

for file in "$INPUT_DIR"/*.gml; do
    [ -e "$file" ] || continue   # skip if none
    base=$(basename "$file" .gml)

    echo "Processing $base ..."

    out_folder="$OUTPUT_DIR/$base"
    mkdir -p "$out_folder"

    # Convert GML → SHP
    ogr2ogr -f "ESRI Shapefile" "$out_folder" "$file"

    # Zip the result
    (cd "$OUTPUT_DIR" && zip -r "$base.zip" "$base" >/dev/null)

    echo "Created: $OUTPUT_DIR/$base.zip"
done

echo "ALL DONE."

