#!/bin/bash
set -e

echo "🐳 Docker Configuration Test Suite"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check Docker is installed
echo "Test 1: Docker Installation"
if command -v docker &> /dev/null; then
    test_result 0 "Docker is installed"
    docker --version
else
    test_result 1 "Docker is NOT installed"
fi
echo ""

# Test 2: Check Docker Compose is available
echo "Test 2: Docker Compose"
if docker compose version &> /dev/null; then
    test_result 0 "Docker Compose is available"
    docker compose version
else
    test_result 1 "Docker Compose is NOT available"
fi
echo ""

# Test 3: Check required files exist
echo "Test 3: Required Files"
FILES=("Dockerfile" ".dockerignore" "docker-compose.yml" "package.json")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        test_result 0 "$file exists"
    else
        test_result 1 "$file is missing"
    fi
done
echo ""

# Test 4: Check environment file
echo "Test 4: Environment Configuration"
if [ -f ".env.local" ]; then
    test_result 0 ".env.local exists"

    # Check for required environment variables
    REQUIRED_VARS=("AZURE_COSMOS_CONNECTION_STRING" "ANTHROPIC_API_KEY" "CLERK_SECRET_KEY")
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "$var" .env.local; then
            test_result 0 "$var is configured"
        else
            test_result 1 "$var is missing"
        fi
    done
else
    test_result 1 ".env.local is missing"
    echo -e "${YELLOW}⚠${NC}  Create .env.local with required environment variables"
fi
echo ""

# Test 5: Validate Dockerfile syntax
echo "Test 5: Dockerfile Validation"
if docker build --dry-run -f Dockerfile . &> /dev/null; then
    test_result 0 "Dockerfile syntax is valid"
else
    test_result 1 "Dockerfile has syntax errors"
fi
echo ""

# Test 6: Build Docker image (if requested)
if [ "$1" == "--build" ]; then
    echo "Test 6: Building Docker Image"
    echo -e "${YELLOW}⏳${NC} Building image (this may take a few minutes)..."
    if docker build -t patchpath-ai:test . ; then
        test_result 0 "Docker image built successfully"

        # Check image size
        IMAGE_SIZE=$(docker images patchpath-ai:test --format "{{.Size}}")
        echo "   Image size: $IMAGE_SIZE"
    else
        test_result 1 "Docker image build failed"
    fi
    echo ""
fi

# Test 7: Test docker-compose (if requested)
if [ "$1" == "--compose" ]; then
    echo "Test 7: Docker Compose Validation"
    if docker compose config &> /dev/null; then
        test_result 0 "docker-compose.yml is valid"
    else
        test_result 1 "docker-compose.yml has errors"
    fi
    echo ""
fi

# Summary
echo "=================================="
echo "Test Summary"
echo "=================================="
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run 'docker build -t patchpath-ai .' to build the image"
    echo "  2. Run 'docker compose up' to start the application"
    echo "  3. Visit http://localhost:3000"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo "Please fix the issues above before building."
    exit 1
fi
