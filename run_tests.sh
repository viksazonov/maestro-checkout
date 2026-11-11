#!/usr/bin/env bash
# Runs the whole Maestro suite N times in a row against the connected
# Android device and keeps a JUnit report plus screenshots for every run.
#
# Usage: ./run_tests.sh [runs] [extra maestro args]     (default: 1 run)
#   e.g. ./run_tests.sh 3 -e CLEAR_STATE=false
# With more than one device connected, pick one with DEVICE=<adb serial>:
#   DEVICE=emulator-5554 ./run_tests.sh 5
set -euo pipefail

RUNS="${1:-1}"
shift || true
EXTRA=("$@")
UDID=()
if [ -n "${DEVICE:-}" ]; then
  export ANDROID_SERIAL="$DEVICE"   # adb commands below use it too
  UDID=(--udid "$DEVICE")
fi
APP_ID="com.ventrata.maestro_booking_demo"
cd "$(dirname "$0")"

command -v maestro >/dev/null || { echo "Maestro CLI not found: https://maestro.dev"; exit 1; }
adb get-state >/dev/null 2>&1 || { echo "No Android device found (check: adb devices)"; exit 1; }
adb shell pm path "$APP_ID" >/dev/null 2>&1 || {
  echo "App not installed. Run:"
  echo "  flutter build apk --release && adb install -r build/app/outputs/flutter-apk/app-release.apk"
  exit 1
}

echo "Device: $(adb shell getprop ro.product.model | tr -d '\r'), Android $(adb shell getprop ro.build.version.release | tr -d '\r')"
mkdir -p reports
failed=0

for i in $(seq 1 "$RUNS"); do
  stamp="$(date +%Y%m%d-%H%M%S)"
  echo "=== Run $i/$RUNS ($stamp) ==="
  start=$SECONDS
  tag="${DEVICE:-device}-$stamp"
  if maestro test ${UDID[@]+"${UDID[@]}"} ${EXTRA[@]+"${EXTRA[@]}"} test/maestro/ \
      --format junit --output "reports/junit-$tag.xml" \
      --test-output-dir "reports/$tag"; then
    result="passed"
  else
    result="FAILED"
    failed=$((failed + 1))
  fi
  echo "Run $i: $result in $(( (SECONDS - start) / 60 ))m $(( (SECONDS - start) % 60 ))s"
done

echo "=== $((RUNS - failed))/$RUNS runs passed ==="
[ "$failed" -eq 0 ]
