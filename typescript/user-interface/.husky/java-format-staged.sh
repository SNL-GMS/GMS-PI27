#!/usr/bin/env bash

# This script must be run in bash, husky uses sh by default which is
# mapped to dash on Ubuntu systems. This should be further investigated.
if [ -z "${BASH:-}" ]; then
  exec bash "$0" "$@"
fi

# Check that gradle wrapper is available
if command -v gradlew  &> /dev/null
then
  # Part 1: Gather Staged Files
  stagedFiles=$(git diff --staged --name-only)

  printf "Staged files: \n${stagedFiles[@]}\n"

  # Part 2: Determine if there are Staged Files that need Java formatting applied
  javaFiles=$(printf '%s\n' "${stagedFiles[@]}" |sed '/.*.java$/!d')

  if [ ${#javaFiles[@]} -eq 0 ] \
    || { [ ${#javaFiles[@]} -eq 1 ] && [ -z "${javaFiles[0]}" ]; }; then
    echo "No staged Java files. Spotless Java step skipped."
  else
    echo "Running spotlessApply. Formatting code..."
    printf "Staged Java files: \n${javaFiles[@]}\n"

    gmsFiles=$(printf '%s\n' "${javaFiles[@]}" |sed '/^java\/gms/!d')
    if [ ${#gmsFiles[@]} -eq 0 ] \
      || { [ ${#gmsFiles[@]} -eq 1 ] && [ -z "${gmsFiles[0]}" ]; }; then
      echo "No staged Java files in java/gms"
    else
      printf "Formatting code in java/gms...\n${gmsFiles[@]}\n"
      gradlew -p java/gms spotlessApply
    fi

    testToolsFiles=$(printf '%s\n' "${javaFiles[@]}" |sed '/^java\/test-tools/!d')
    if [ ${#testToolsFiles[@]} -eq 0 ] \
      || { [ ${#testToolsFiles[@]} -eq 1 ] && [ -z "${testToolsFiles[0]}" ]; }; then
      echo "No staged Java files in java/test-tools"
    else
      printf "Formatting code in java/test-tools...\n${testToolsFiles[@]}\n"
      gradlew -p java/test-tools spotlessApply
    fi
  fi

  # Part 3: Stage formatted Java files
  for file in $javaFiles; do
    echo "Staging Java File: $file"
    if test -f "$file"; then
      git add $file
    fi
  done
else
  echo "Gradle Wrapper not found. Spotless Java step skipped."
fi