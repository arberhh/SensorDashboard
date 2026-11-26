#!/bin/bash
# usage: run.sh [runs] [out-dir]   (default: 3 runs, measure-output/)
# Alternates the apps so drift on the machine (heat, background work) lands
# on both, then prints the per-app medians.
set -euo pipefail
RUNS=${1:-3}; DIR=${2:-measure-output}
HERE=$(cd "$(dirname "$0")" && pwd)
# TARGET=phone records frames on the iPhone instead (about 5 minutes a run),
# TARGET=phone-cpu its CPU and memory (about 3 minutes a run),
# TARGET=phone-nav frames while opening the detail screen and going back.
case ${TARGET:-simulator} in
  simulator) MEASURE=measure.sh ;;
  phone) MEASURE=measure-phone.sh ;;
  phone-cpu) MEASURE=measure-phone-cpu.sh ;;
  phone-nav) MEASURE=measure-phone.sh; export SESSION=nav ;;
  *) echo "TARGET is simulator, phone, phone-cpu or phone-nav" >&2; exit 1 ;;
esac
mkdir -p "$DIR"
OUT=$DIR/results-${TARGET:-simulator}-$(date +%Y%m%d-%H%M%S).csv
for run in $(seq 1 "$RUNS"); do
  for app in rn exact; do
    "$HERE/$MEASURE" "$app" "$run" "$OUT"
  done
done
python3 "$HERE/summarize.py" "$OUT"
