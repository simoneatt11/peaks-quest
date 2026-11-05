"""Fails if a forbidden word appears in UI files outside the mission-3 buzzword block."""
import re, pathlib, sys
ROOT = pathlib.Path(__file__).resolve().parent.parent
WORDS = r"synerg\w*|leverag\w*|thought leadership|solutions?|innovative|disruptive\w*|passionate|cutting[- ]edge"
bad = []
for f in ["index.html", "style.css", "game.js", "content.js"]:
    text = (ROOT / f).read_text()
    if f == "content.js":
        a, b = text.index("BUZZWORD-MISSION-START"), text.index("BUZZWORD-MISSION-END")
        inside = re.findall(WORDS, text[a:b], re.I)
        print(f"content.js mission-3 block contains (allowed, shown struck through): {inside}")
        text = text[:a] + text[b:]
    for m in re.finditer(WORDS, text, re.I):
        line = text[:m.start()].count("\n") + 1
        bad.append(f"{f}:{line}: {m.group(0)}")
print("\n".join(bad) if bad else "OK: no forbidden words outside mission 3")
sys.exit(1 if bad else 0)
