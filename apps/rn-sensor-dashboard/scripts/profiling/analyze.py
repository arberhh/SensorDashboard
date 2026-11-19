# usage: analyze.py show <log> | analyze.py summary <dir-with-before-N/after-N logs>
# Groups commits into bursts (a gap of over 1s starts a new one). The first
# burst is startup; every later one is a 5s feed tick.
import sys, statistics as st
def clusters(path):
    rows=[l.split() for l in open(path) if l.strip()]
    rows=[(int(n),ph,float(a),float(b),int(t)) for n,ph,a,b,t in rows]
    rows.sort(key=lambda r:r[0])
    t0=rows[0][4]; out=[]; cur=[rows[0]]
    for r in rows[1:]:
        if r[4]-cur[-1][4] > 1000: out.append(cur); cur=[r]
        else: cur.append(r)
    out.append(cur)
    return t0,out
FRAME_MS = 1000 / 60  # one frame at 60fps

def show(path):
    t0, cs = clusters(path)
    startup, ticks = cs[0], cs[1:]
    sums = [sum(r[2] for r in c) for c in ticks]
    print(f"Profile: {path}")
    print(f"Recorded {(cs[-1][-1][4] - t0) / 1000:.0f}s, {sum(len(c) for c in cs)} React commits\n")
    print("Startup (initial mount of the list)")
    print(f"  render time  {sum(r[2] for r in startup):7.1f} ms   {len(startup)} commits, slowest {max(r[2] for r in startup):.1f} ms\n")
    print("Feed ticks (one burst of commits per 5s feed update)")
    print("  tick   at      render ms   frames@60fps   commits")
    top = max(sums, default=1)
    for i, (c, a) in enumerate(zip(ticks, sums), 1):
        bar = "#" * round(a / top * 20)
        print(f"  {i:>4}  {(c[0][4] - t0) / 1000:5.1f}s  {a:9.1f}   {a / FRAME_MS:12.1f}   {len(c):7d}   {bar}")
    if sums:
        s = sorted(sums)
        print("\nSummary of ticks")
        print(f"  median {st.median(s):6.1f} ms   mean {st.mean(s):6.1f} ms   min {s[0]:6.1f} ms   max {s[-1]:6.1f} ms")
        print(f"  median tick = {st.median(s) / FRAME_MS:.1f} frames of JS render time at 60fps")
    print("\nHow to read this")
    print("  render ms  : time React spent rendering that update (JS thread only)")
    print("  frames     : render ms / 16.7 ms, the budget of one frame at 60fps")
    print("  commits    : React commits in the burst (usually 2 per tick)")
    print("  Debug build, JS render time only: no native layout or UI thread.")

if sys.argv[1]=="show":
    show(sys.argv[2])
if sys.argv[1]=="summary":
    for w in ("before","after"):
        ticks=[]; starts=[]
        for i in (1,2,3):
            _,cs=clusters(f"{sys.argv[2]}/{w}-{i}.log")
            starts.append(sum(r[2] for r in cs[0]))
            ticks += [sum(r[2] for r in c) for c in cs[1:]]
        ticks.sort()
        p=lambda q: ticks[min(len(ticks)-1,int(q*len(ticks)))]
        print(f"{w:6s} ticks={len(ticks)} median={st.median(ticks):6.1f} mean={st.mean(ticks):6.1f} p90={p(0.9):6.1f} max={max(ticks):6.1f} | startup median={st.median(starts):6.1f} ({', '.join(f'{s:.0f}' for s in starts)})")
