#!/bin/bash

echo "🧹 Disk Space Cleanup Script"
echo "=============================="
echo ""
echo "Current disk usage:"
df -h /Users/robbfladry | tail -1
echo ""

# Calculate space that will be freed
TOTAL_FREED=0

# Function to calculate size
get_size() {
    du -sk "$1" 2>/dev/null | cut -f1
}

echo "🔍 Analyzing caches..."
echo ""

# Safe cleanups (won't break anything)
echo "Safe to clean:"
echo "  - npm cache: $(du -sh ~/.npm 2>/dev/null | cut -f1)"
echo "  - Homebrew cache: $(du -sh ~/Library/Caches/Homebrew 2>/dev/null | cut -f1)"
echo "  - pip cache: $(du -sh ~/Library/Caches/pip 2>/dev/null | cut -f1)"
echo "  - Playwright browsers: $(du -sh ~/Library/Caches/ms-playwright 2>/dev/null | cut -f1)"
echo ""

read -p "Clean these caches? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🧹 Cleaning npm cache..."
    npm cache clean --force

    echo "🧹 Cleaning Homebrew cache..."
    brew cleanup 2>/dev/null || echo "  (Homebrew not found or already clean)"

    echo "🧹 Cleaning pip cache..."
    rm -rf ~/Library/Caches/pip

    echo "🧹 Cleaning Playwright browsers (will reinstall if needed)..."
    rm -rf ~/Library/Caches/ms-playwright

    echo ""
    echo "✅ Cleanup complete!"
    echo ""
    echo "New disk usage:"
    df -h /Users/robbfladry | tail -1
else
    echo "Cleanup cancelled."
fi
