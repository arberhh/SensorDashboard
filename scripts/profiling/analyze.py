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
if sys.argv[1]=="show":
    t0,cs=clusters(sys.argv[2])
    for c in cs:
        print(f"+{(c[0][4]-t0)/1000:6.1f}s commits={len(c):2d} actual_sum={sum(r[2] for r in c):8.2f} max={max(r[2] for r in c):7.2f} base={c[-1][3]:7.2f}")
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
