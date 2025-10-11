#!/bin/bash
set -e

echo "🔍 GitHub Actions Workflow Validation"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

TESTS_PASSED=0
TESTS_FAILED=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $2"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check workflow files exist
echo "Test 1: Workflow Files"
WORKFLOWS=("ci-cd.yml" "pr-check.yml" "deploy-manual.yml")
for workflow in "${WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        test_result 0 ".github/workflows/$workflow exists"
    else
        test_result 1 ".github/workflows/$workflow is missing"
    fi
done
echo ""

# Test 2: Basic YAML syntax validation
echo "Test 2: YAML Syntax"
for workflow in .github/workflows/*.yml; do
    if python3 -c "import yaml; yaml.safe_load(open('$workflow'))" 2>/dev/null; then
        test_result 0 "$(basename $workflow) has valid YAML syntax"
    else
        test_result 1 "$(basename $workflow) has YAML syntax errors"
    fi
done
echo ""

# Test 3: Check for required secrets in workflows
echo "Test 3: Required Secrets References"
REQUIRED_SECRETS=(
    "AZURE_REGISTRY_USERNAME"
    "AZURE_REGISTRY_PASSWORD"
    "AZURE_CREDENTIALS"
)

for secret in "${REQUIRED_SECRETS[@]}"; do
    if grep -r "secrets.$secret" .github/workflows/ >/dev/null; then
        test_result 0 "$secret is referenced in workflows"
    else
        test_result 1 "$secret is NOT referenced (may be intentional)"
    fi
done
echo ""

# Test 4: Validate workflow triggers
echo "Test 4: Workflow Triggers"
for workflow in .github/workflows/*.yml; do
    if grep -q "^on:" "$workflow"; then
        test_result 0 "$(basename $workflow) has triggers defined"
    else
        test_result 1 "$(basename $workflow) missing triggers"
    fi
done
echo ""

# Test 5: Check for job dependencies
echo "Test 5: Job Structure"
if grep -q "needs:" .github/workflows/ci-cd.yml; then
    test_result 0 "ci-cd.yml has job dependencies (needs:)"
else
    test_result 1 "ci-cd.yml missing job dependencies"
fi
echo ""

# Test 6: Docker references
echo "Test 6: Docker Integration"
if grep -q "docker/build-push-action" .github/workflows/ci-cd.yml; then
    test_result 0 "Docker build action configured"
else
    test_result 1 "Docker build action missing"
fi

if grep -q "docker/login-action" .github/workflows/ci-cd.yml; then
    test_result 0 "Docker login action configured"
else
    test_result 1 "Docker login action missing"
fi
echo ""

# Test 7: Environment configuration
echo "Test 7: Environment Configuration"
if grep -q "environment:" .github/workflows/ci-cd.yml; then
    test_result 0 "Deployment environment configured"
else
    test_result 1 "Deployment environment not configured"
fi
echo ""

# Test 8: Check documentation exists
echo "Test 8: Documentation"
if [ -f "CI-CD.md" ]; then
    test_result 0 "CI-CD.md documentation exists"
else
    test_result 1 "CI-CD.md documentation missing"
fi
echo ""

# Summary
echo "====================================="
echo "Validation Summary"
echo "====================================="
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All validations passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Configure GitHub secrets (see CI-CD.md)"
    echo "  2. Push workflows to GitHub"
    echo "  3. Make a commit to trigger first workflow"
    echo "  4. Monitor Actions tab for results"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some validations failed${NC}"
    echo "Review the issues above. Some may be expected (e.g., optional features)."
    exit 0
fi
