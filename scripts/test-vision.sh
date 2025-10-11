#!/bin/bash

# Test Vision-Based Rack Analysis
# Usage: ./scripts/test-vision.sh path/to/rack-image.jpg [enrich]

set -e

IMAGE_PATH="$1"
ENRICH="${2:-false}"

if [ -z "$IMAGE_PATH" ]; then
  echo "❌ Error: No image path provided"
  echo ""
  echo "Usage: ./scripts/test-vision.sh path/to/rack-image.jpg [enrich]"
  echo ""
  echo "Examples:"
  echo "  ./scripts/test-vision.sh ~/Downloads/my-rack.jpg"
  echo "  ./scripts/test-vision.sh ~/Downloads/my-rack.jpg true"
  exit 1
fi

if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ Error: Image file not found: $IMAGE_PATH"
  exit 1
fi

echo "🔍 Testing Vision-Based Rack Analysis"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📸 Image: $IMAGE_PATH"
echo "🧠 Enrichment: $ENRICH"
echo ""

if [ "$ENRICH" = "true" ]; then
  echo "⚠️  Enrichment enabled - this may take 10-30 seconds..."
  echo ""
fi

# Test the API
curl -s -X POST http://localhost:3000/api/vision/analyze-rack \
  -F "image=@$IMAGE_PATH" \
  -F "enrich=$ENRICH" \
  | python3 -m json.tool

echo ""
echo "✅ Vision analysis complete!"
