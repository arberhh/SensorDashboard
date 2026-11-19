"""usage: hitches.py <trace> <process name>
Reads an Animation Hitches trace and prints, for one process:
moving_s,hitches,hitch_ms,longest_hitch_ms,hitch_ms_per_s,fps_mean,fps_max
"""
import re
import subprocess
import sys
import xml.etree.ElementTree as ET

trace, process = sys.argv[1], sys.argv[2]


def table(schema):
    xpath = f'/trace-toc/run[@number="1"]/data/table[@schema="{schema}"]'
    out = subprocess.run(
        ["xcrun", "xctrace", "export", "--input", trace, "--xpath", xpath],
        capture_output=True, text=True, check=True,
    ).stdout
    root = ET.fromstring(out)
    columns = [col.findtext("mnemonic") for col in root.iter("col")]
    # xctrace writes a repeated value once and points back at it with ref=.
    seen = {}
    rows = []
    for row in root.iter("row"):
        values = {}
        for column, cell in zip(columns, list(row)):
            if "ref" in cell.attrib:
                cell = seen[cell.attrib["ref"]]
            elif "id" in cell.attrib:
                seen[cell.attrib["id"]] = cell
            values[column] = cell
        rows.append(values)
    return rows


hitches = [
    int(row["duration"].text) / 1e6
    for row in table("hitches")
    if re.sub(r" \(\d+\)$", "", row["process"].attrib.get("fmt", "")) == process
]
# Seconds with no new frame are the list at rest between swipes, so the hitch
# rate and the mean frame rate are taken over the seconds that showed a frame.
fps = [int(row["count"].text) for row in table("displayed-surfaces-per-second")]
moving = [count for count in fps if count > 0]
seconds = max(len(moving), 1)

print(
    f"{len(moving)},{len(hitches)},{sum(hitches):.1f},{max(hitches, default=0):.1f},"
    f"{sum(hitches) / seconds:.2f},{sum(moving) / seconds:.1f},{max(fps, default=0)}"
)
