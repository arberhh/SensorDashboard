"""usage: summarize.py <results.csv>  Per-app median (min-max) of each metric."""
import csv
import statistics
import sys

rows = list(csv.DictReader(open(sys.argv[1])))
metrics = [name for name in rows[0] if name not in ("app", "run")]
apps = sorted({row["app"] for row in rows})

print(f"{'metric':16}" + "".join(f"{app:>28}" for app in apps))
for metric in metrics:
    line = f"{metric:16}"
    for app in apps:
        values = [float(row[metric]) for row in rows if row["app"] == app]
        cell = f"{statistics.median(values):.2f} ({min(values):.2f}-{max(values):.2f})"
        line += f"{cell:>28}"
    print(line)
print(f"\n{len(rows) // len(apps)} runs per app, from {sys.argv[1]}")
