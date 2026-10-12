#!/usr/bin/env python3
"""Validate core Hugo output: metadata, required pages, local links and asset references."""
from html.parser import HTMLParser
from pathlib import Path
import sys

public = Path(sys.argv[1] if len(sys.argv) > 1 else "public").resolve()
errors, warnings = [], []
if not public.is_dir():
    print(f"ERROR: build directory missing: {public}")
    sys.exit(1)

class Parser(HTMLParser):
    def __init__(self):
        super().__init__(); self.title_depth = 0; self.title = ""; self.description = False
        self.links = []; self.assets = []; self.ids = set(); self.main_count = 0
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title": self.title_depth += 1
        if tag == "main": self.main_count += 1
        if a.get("id"): self.ids.add(a["id"])
        if tag == "meta" and (a.get("name") or "").lower() == "description" and (a.get("content") or "").strip(): self.description = True
        if tag in ("a", "link") and a.get("href"): self.links.append(a["href"].strip())
        if tag in ("img", "script", "source", "video", "audio") and a.get("src"): self.assets.append(a["src"].strip())
        if tag == "img" and not (a.get("alt") or "").strip(): warnings.append(f"{self.page}: image missing alt text")
    def handle_endtag(self, tag):
        if tag == "title" and self.title_depth: self.title_depth -= 1
    def handle_data(self, data):
        if self.title_depth: self.title += data.strip()

pages = sorted(
    p for p in public.rglob("*.html")
    if not (p.name.startswith("google") and p.name.endswith(".html"))
)
if not pages:
    print("ERROR: no HTML pages generated"); sys.exit(1)
for page in pages:
    parser = Parser(); parser.page = page.relative_to(public)
    try: parser.feed(page.read_text(errors="replace"))
    except Exception as e: errors.append(f"{parser.page}: parse failed: {e}"); continue
    rel = page.relative_to(public)
    if not parser.title.strip(): errors.append(f"{rel}: missing title")
    if not parser.description: warnings.append(f"{rel}: missing meta description")
    for raw in parser.links + parser.assets:
        if not raw or raw.startswith(("#", "https://", "http://", "mailto:", "tel:", "data:", "javascript:", "//")): continue
        path = raw.split("#", 1)[0].split("?", 1)[0]
        if not path: continue
        if path.startswith("/"):
            # GitHub Pages project-site paths commonly start with /toolscout/.
            candidates = [public / path.lstrip("/"), public / path.lstrip("/").removeprefix("toolscout/")]
        else:
            candidates = [(page.parent / path).resolve()]
        ok = False
        for candidate in candidates:
            if candidate.is_dir(): candidate = candidate / "index.html"
            try: candidate.resolve().relative_to(public)
            except ValueError: continue
            if candidate.exists(): ok = True; break
        # Hugo routes often end with / and map to index.html.
        if not ok and path.endswith("/"):
            trimmed = path.lstrip("/")
            for prefix in ("", "toolscout/"):
                candidate = public / (prefix + trimmed) / "index.html"
                if candidate.exists(): ok = True; break
        if not ok and not path.endswith((".xml", ".json", ".webmanifest")):
            errors.append(f"{rel}: local target not found: {raw}")

required = [
    public / "index.html", public / "404.html", public / "favicon.svg",
    public / "robots.txt", public / "sitemap.xml", public / "guides/index.html",
    public / "css/toolscout-upgrades.css", public / "js/toolscout-upgrades.js",
]
for p in required:
    if not p.exists(): errors.append(f"required output missing: {p.relative_to(public)}")

print(f"Checked {len(pages)} HTML pages; {len(errors)} errors; {len(warnings)} warnings.")
for item in errors: print("ERROR:", item)
for item in warnings[:80]: print("WARNING:", item)
if len(warnings) > 80: print(f"... {len(warnings)-80} more warnings")
if errors: sys.exit(1)
print("Core checks passed. Review warnings before deployment.")
