#!/bin/bash
# enforce-immutable-tests.sh
# Fails the build if any modified file in the PR/branch contains the @immutable-test directive.
# This enforces our TDD contract.

set -e

# We want to compare against origin/main.
# In GitHub actions, we might need to fetch it first if not present, but checkout@v4 fetch-depth: 0 handles it.
TARGET_BRANCH=${1:-origin/main}

echo "Checking for modifications to immutable tests against $TARGET_BRANCH..."

# Get a list of all files that were modified or deleted
MODIFIED_FILES=$(git diff --name-only "$TARGET_BRANCH" HEAD || true)

if [ -z "$MODIFIED_FILES" ]; then
  echo "No files modified. Skipping check."
  exit 0
fi

VIOLATIONS=0

for file in $MODIFIED_FILES; do
  if [ -f "$file" ]; then
    # Check if the file contains the @immutable-test string
    if grep -q "@immutable-test" "$file"; then
      echo "❌ ERROR: File '$file' is marked as @immutable-test but was modified."
      VIOLATIONS=$((VIOLATIONS + 1))
    fi
  fi
done

if [ "$VIOLATIONS" -gt 0 ]; then
  echo "❌ FAILED: Found $VIOLATIONS immutable test(s) that were modified."
  echo "You must not alter a test once it is marked as @immutable-test."
  exit 1
fi

echo "✅ Success: No immutable tests were modified."
exit 0
