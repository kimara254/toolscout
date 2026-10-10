import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlparse

from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = Path(__file__).resolve().parent.parent
DATA_FILE = ROOT / "data" / "products.json"
TEMPLATE_DIR = ROOT / "templates"
OUTPUT_DIR = ROOT / "site" / "content" / "tools"

ALLOWED_HOSTS = {
    "notion": "www.notion.so",
    "trello": "trello.com",
    "obsidian": "obsidian.md",
}

def validate_product(product):
    required = {
        "slug", "name", "category", "description",
        "official_url", "features", "best_for"
    }
    missing = required - product.keys()
    if missing:
        raise ValueError(f"Missing fields: {sorted(missing)}")

    slug = product["slug"]
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug):
        raise ValueError(f"Invalid slug: {slug}")

    if slug not in ALLOWED_HOSTS:
        raise ValueError(f"No approved URL host configured for {slug}")

    parsed = urlparse(product["official_url"])
    if parsed.scheme != "https" or parsed.hostname != ALLOWED_HOSTS[slug]:
        raise ValueError(f"Unexpected official URL for {slug}")

    if not isinstance(product["features"], list) or not product["features"]:
        raise ValueError(f"Features must be a non-empty list for {slug}")

def main():
    products = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    if not isinstance(products, list):
        raise ValueError("products.json must contain a JSON list")

    env = Environment(
        loader=FileSystemLoader(str(TEMPLATE_DIR)),
        undefined=StrictUndefined,
        autoescape=False,
        keep_trailing_newline=True,
    )
    template = env.get_template("product.md.j2")
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    seen = set()
    today = date.today().isoformat()

    for product in products:
        validate_product(product)
        if product["slug"] in seen:
            raise ValueError(f"Duplicate product slug: {product['slug']}")
        seen.add(product["slug"])

        rendered = template.render(**product, build_date=today)
        target = OUTPUT_DIR / f"{product['slug']}.md"
        target.write_text(rendered, encoding="utf-8")
        print(f"Generated: {target.relative_to(ROOT)}")

    print(f"\nSuccess: generated {len(products)} product pages.")

if __name__ == "__main__":
    main()
