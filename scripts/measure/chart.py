"""usage: chart.py <results.csv> <out.svg> [title]
One panel per metric: a bar for each app's median, a dot for every run.
Each panel has its own scale from zero, because the metrics have different units.
"""
import csv
import statistics
import sys

# column -> (title, unit, decimals); a panel is drawn for each column the CSV has
ALL_METRICS = {
    "scroll_net_cpu_s": ("CPU during 30 swipes, less the tool's share", "s", 2),
    "phone_scroll_net_cpu_s": ("CPU during 16 swipes, less the tool's share", "s", 2),
    "idle_cpu_s": ("CPU over 20 s idle", "s", 2),
    "startup_ms": ("Startup", "ms", 0),
    "rss_launch_mb": ("Memory after launch", "MB", 0),
    "rss_scroll_mb": ("Memory after scroll", "MB", 0),
    "mem_launch_mb": ("Memory after launch", "MB", 1),
    "mem_scroll_mb": ("Memory after scroll", "MB", 1),
    "hitches": ("Late frames during 16 swipes", "", 0),
    "hitch_ms_per_s": ("Hitch time per second of movement", "ms/s", 1),
    "longest_hitch_ms": ("Longest hitch", "ms", 1),
    "fps_max": ("Peak frames per second (higher is better)", "fps", 0),
}
APPS = {"rn": "RN", "exact": "Exact"}

COLUMNS = 2
PANEL_W, PANEL_H = 400, 112
LABEL_W, PLOT_W = 48, 220
BAR_H, BAR_GAP = 18, 8
MARGIN, HEADER_H = 24, 64

STYLE = """
  .surface { fill: #fcfcfb } .title { fill: #0b0b0b; font-weight: 600 }
  .text { fill: #52514e } .muted { fill: #898781 } .axis { stroke: #c3c2b7 }
  .rn { fill: #2a78d6 } .exact { fill: #eb6834 }
  .run { fill: #0b0b0b; stroke: #fcfcfb; stroke-width: 1.5 }
  text { font-family: -apple-system, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 12px }
  @media (prefers-color-scheme: dark) {
    .surface { fill: #1a1a19 } .title { fill: #f0efec }
    .text { fill: #c3c2b7 } .axis { stroke: #383835 }
    .rn { fill: #3987e5 } .exact { fill: #d95926 }
    .run { fill: #f0efec; stroke: #1a1a19 }
  }
"""


def bar(x, y, width, cls):
    """A bar square at the baseline and rounded at the data end."""
    r = min(4, width / 2)
    return (
        f'<path class="{cls}" d="M{x},{y} h{width - r:.1f} a{r},{r} 0 0 1 {r},{r} '
        f'v{BAR_H - 2 * r} a{r},{r} 0 0 1 -{r},{r} h-{width - r:.1f} z"/>'
    )


def panel(x, y, metric, rows):
    title, unit, decimals = METRICS[metric]
    values = {app: [float(row[metric]) for row in rows if row["app"] == app] for app in APPS}
    scale = PLOT_W / (max(max(v) for v in values.values()) or 1)
    left = x + LABEL_W
    out = [f'<text class="title" x="{x}" y="{y + 14}">{title}</text>']
    for i, (app, label) in enumerate(APPS.items()):
        top = y + 28 + i * (BAR_H + BAR_GAP)
        middle = top + BAR_H / 2
        median = statistics.median(values[app])
        out.append(f'<text class="text" x="{x}" y="{middle + 4}">{label}</text>')
        out.append(bar(left, top, median * scale, app))
        for value in values[app]:
            out.append(f'<circle class="run" cx="{left + value * scale:.1f}" cy="{middle}" r="3"/>')
        end = left + max(values[app]) * scale + 10
        out.append(f'<text class="text" x="{end:.1f}" y="{middle + 4}">{median:.{decimals}f} {unit}</text>')
    bottom = y + 28 + 2 * BAR_H + BAR_GAP + 4
    out.append(f'<line class="axis" x1="{left}" y1="{y + 24}" x2="{left}" y2="{bottom}"/>')
    return out


rows = list(csv.DictReader(open(sys.argv[1])))
METRICS = {name: spec for name, spec in ALL_METRICS.items() if name in rows[0]}
if "nav_wall_s" in rows[0]:  # the navigation session taps instead of swiping
    METRICS["hitches"] = ("Late frames during 16 transitions", "", 0)
TITLE = sys.argv[3] if len(sys.argv) > 3 else "RN and Exact on the iOS Simulator"
runs = len(rows) // len(APPS)
grid_rows = -(-len(METRICS) // COLUMNS)
width = MARGIN * 2 + COLUMNS * PANEL_W
height = HEADER_H + grid_rows * PANEL_H + MARGIN

svg = [
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" '
    f'height="{height}" role="img" aria-label="{TITLE}">',
    f"<style>{STYLE}</style>",
    f'<rect class="surface" width="{width}" height="{height}" rx="8"/>',
    f'<text class="title" x="{MARGIN}" y="30" style="font-size: 15px">'
    f"{TITLE}</text>",
    f'<text class="muted" x="{MARGIN}" y="48">Bar: median of {runs} runs. Dots: each run. '
    "Lower is better. Every panel has its own scale, from zero.</text>",
]
for i, metric in enumerate(METRICS):
    x = MARGIN + (i % COLUMNS) * PANEL_W
    y = HEADER_H + (i // COLUMNS) * PANEL_H
    svg += panel(x, y, metric, rows)
svg.append("</svg>")

with open(sys.argv[2], "w") as out:
    out.write("\n".join(svg) + "\n")
