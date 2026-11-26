"""usage: sysmon.py <trace> <process name> <t_idle> <t_tool> <t_scroll> <t_end>
Reads an Activity Monitor trace and prints, for one process:
idle_cpu_s,phone_tool_cpu_s,phone_scroll_cpu_s,phone_scroll_net_cpu_s,tool_wall_s,scroll_wall_s,mem_launch_mb,mem_scroll_mb
The four times are epoch seconds: the start of the idle wait, of the swipes
that move nothing, of the scroll, and the end of the scroll.
"""
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from datetime import datetime

trace, process = sys.argv[1], sys.argv[2]
t_idle, t_tool, t_scroll, t_end = (float(arg) for arg in sys.argv[3:7])


def export(*args):
    return ET.fromstring(subprocess.run(
        ["xcrun", "xctrace", "export", "--input", trace, *args],
        capture_output=True, text=True, check=True,
    ).stdout)


# Rows carry nanoseconds since the recording started.
start = datetime.fromisoformat(export("--toc").find(".//start-date").text).timestamp()
root = export("--xpath", '/trace-toc/run[@number="1"]/data/table[@schema="sysmon-process"]')
columns = [col.findtext("mnemonic") for col in root.iter("col")]
# xctrace writes a repeated value once and points back at it with ref=.
by_id = {cell.attrib["id"]: cell for cell in root.iter() if "id" in cell.attrib}

samples = []  # (epoch seconds, cpu seconds so far, memory in MB)
for row in root.iter("row"):
    cells = {
        column: by_id[cell.attrib["ref"]] if "ref" in cell.attrib else cell
        for column, cell in zip(columns, list(row))
    }
    if re.sub(r" \(\d+\)$", "", cells["process"].attrib.get("fmt", "")) != process:
        continue
    cpu = int(cells["cpu-total-user"].text) + int(cells["cpu-total-system"].text)
    # The footprint is what Xcode's memory gauge shows and what iOS limits.
    memory = int(cells["memory-physical-footprint"].text)
    samples.append((start + int(cells["time"].text) / 1e9, cpu / 1e9, memory / 2**20))
if not samples:
    sys.exit(f"no rows for {process} in {trace}")


def at(time):
    """The last sample at or before a time."""
    return max((s for s in samples if s[0] <= time), default=samples[0], key=lambda s: s[0])


idle = at(t_tool)[1] - at(t_idle)[1]
tool = at(t_scroll)[1] - at(t_tool)[1]
scroll = at(t_end)[1] - at(t_scroll)[1]
print(
    f"{idle:.2f},{tool:.2f},{scroll:.2f},{scroll - tool:.2f},{t_scroll - t_tool:.2f},"
    f"{t_end - t_scroll:.2f},{at(t_idle)[2]:.1f},{at(t_end)[2]:.1f}"
)
