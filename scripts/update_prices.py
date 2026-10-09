#!/usr/bin/env python3
"""Refresh TCGplayer prices for Expedition, Aquapolis and Skyridge.

Writes app/data/prices.json (market price per printing and condition, plus
recent sales) and saves card thumbnails into app/img/ so the app works offline.

Standard library only, so it runs on a plain GitHub Actions runner.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

SETS = [
    {"id": 1375, "name": "Expedition", "abbr": "EX"},
    {"id": 1397, "name": "Aquapolis", "abbr": "AQ"},
    {"id": 1372, "name": "Skyridge", "abbr": "SK"},
]

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
DATA_FILE = os.path.join(APP, "data", "prices.json")
IMG_DIR = os.path.join(APP, "img")

PRICE_URL = "https://infinite-api.tcgplayer.com/priceguide/set/{id}/cards/?rows=5000&productTypeID=1"
SALES_URL = "https://mpapi.tcgplayer.com/v2/product/{id}/latestsales"
IMG_URL = "https://tcgplayer-cdn.tcgplayer.com/product/{id}_200w.jpg"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/128.0 Safari/537.36",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.tcgplayer.com",
    "Referer": "https://www.tcgplayer.com/",
}

CONDITIONS = [
    ("Near Mint", "NM"),
    ("Lightly Played", "LP"),
    ("Moderately Played", "MP"),
    ("Heavily Played", "HP"),
    ("Damaged", "DMG"),
]
PRINTINGS = {"Normal": "N", "Reverse Holofoil": "R", "Holofoil": "H"}

SALES_KEEP = 20          # recent sales stored per card
SALES_DELAY = 0.4        # seconds between sales requests, to stay polite
SKIP_SALES = os.environ.get("SKIP_SALES") == "1"
SKIP_IMAGES = os.environ.get("SKIP_IMAGES") == "1"


def log(msg):
    print(msg, flush=True)


def request(url, body=None, retries=3, raw=False):
    """GET (or POST when body is given) with retries on throttling/server errors."""
    data = None
    headers = dict(HEADERS)
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, data=data, headers=headers,
                                         method="POST" if body is not None else "GET")
            with urllib.request.urlopen(req, timeout=30) as resp:
                payload = resp.read()
                return payload if raw else json.loads(payload)
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(2 * (attempt + 1) ** 2)
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if attempt < retries - 1:
                time.sleep(2 * (attempt + 1))
                continue
            raise


def pick(d, *names):
    """Read a field regardless of capitalisation (productID / productId)."""
    lower = {k.lower(): v for k, v in d.items()}
    for n in names:
        if n.lower() in lower:
            return lower[n.lower()]
    return None


def condition_code(text):
    text = (text or "").strip()
    for name, code in CONDITIONS:
        if text.startswith(name):
            return code
    return None


def printing_code(text):
    return PRINTINGS.get((text or "").strip())


def clean_name(name):
    # "Alakazam (33)" -> "Alakazam", "Ampharos (H1)" -> "Ampharos"
    return re.sub(r"\s*\((?:H)?\d+[a-zA-Z]?\)\s*$", "", name or "").strip()


def clean_number(num):
    # "033/165" -> "33/165", "H01/H32" -> "H1/H32"
    def strip(part):
        m = re.match(r"^([A-Za-z]*)0*(\d+)$", part.strip())
        return f"{m.group(1)}{m.group(2)}" if m else part.strip()
    return "/".join(strip(p) for p in (num or "").split("/"))


def money(v):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return None
    return round(v, 2) if v > 0 else None


def fetch_set_prices(s):
    data = request(PRICE_URL.format(id=s["id"]))
    rows = pick(data, "result") or []
    cards = {}
    for row in rows:
        pid = pick(row, "productID", "productId")
        if pid is None:
            continue
        pcode = printing_code(pick(row, "printing"))
        ccode = condition_code(pick(row, "condition"))
        card = cards.setdefault(pid, {
            "id": pid,
            "set": s["id"],
            "name": clean_name(pick(row, "productName")),
            "num": clean_number(pick(row, "number")),
            "rarity": pick(row, "rarity") or "",
            "p": {},
        })
        if pcode and ccode:
            price = money(pick(row, "marketPrice"))
            if price is not None:
                card["p"].setdefault(pcode, {})[ccode] = price
            else:
                card["p"].setdefault(pcode, {})
    return list(cards.values())


def fetch_sales(pid):
    body = {
        "conditions": [], "languages": [1], "variants": [],
        "listingType": "All", "offset": 0, "limit": 25,
        "time": int(time.time() * 1000),
    }
    data = request(SALES_URL.format(id=pid), body=body)
    out = []
    for sale in pick(data, "data") or []:
        ccode = condition_code(pick(sale, "condition"))
        pcode = printing_code(pick(sale, "variant"))
        price = money(pick(sale, "purchasePrice"))
        date = (pick(sale, "orderDate") or "")[:10]
        if ccode and pcode and price is not None and date:
            out.append([ccode, pcode, price, date])
    out.sort(key=lambda r: r[3], reverse=True)
    return out[:SALES_KEEP]


def save_image(pid):
    path = os.path.join(IMG_DIR, f"{pid}.jpg")
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return True
    try:
        payload = request(IMG_URL.format(id=pid), raw=True, retries=2)
    except Exception:
        return False
    if not payload or not payload[:3] == b"\xff\xd8\xff":
        return False
    with open(path, "wb") as f:
        f.write(payload)
    return True


def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    previous = {}
    old = {}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            old = json.load(f)
        previous = {c["id"]: c for c in old.get("cards", [])}

    cards, sets_out, price_failures = [], [], 0
    for s in SETS:
        try:
            set_cards = fetch_set_prices(s)
            log(f"{s['name']}: {len(set_cards)} cards from the price guide")
        except Exception as e:
            price_failures += 1
            set_cards = [c for c in previous.values() if c.get("set") == s["id"]]
            log(f"{s['name']}: price guide failed ({e}); kept {len(set_cards)} saved cards")
        cards.extend(set_cards)
        sets_out.append({**s, "count": len(set_cards)})

    if price_failures == len(SETS) and not previous:
        log("Could not reach the TCGplayer price guide for any set. Nothing written.")
        sys.exit(1)

    sales_ok = sales_failed = 0
    for i, card in enumerate(cards):
        prev = previous.get(card["id"], {})
        card["s"] = prev.get("s", [])
        if SKIP_SALES:
            continue
        try:
            card["s"] = fetch_sales(card["id"])
            sales_ok += 1
        except Exception as e:
            sales_failed += 1
            if sales_failed <= 3:
                log(f"Last-sold lookup failed for {card['name']} ({card['id']}): {e}")
        time.sleep(SALES_DELAY)
        if (i + 1) % 100 == 0:
            log(f"Last sold: {i + 1}/{len(cards)} cards checked")
    if not SKIP_SALES:
        log(f"Last sold: {sales_ok} cards updated, {sales_failed} kept from the previous run")

    images = 0
    os.makedirs(IMG_DIR, exist_ok=True)
    for card in cards:
        card["img"] = False if SKIP_IMAGES else save_image(card["id"])
        if not card["img"] and os.path.exists(os.path.join(IMG_DIR, f"{card['id']}.jpg")):
            card["img"] = True
        images += card["img"]
    log(f"Images: {images}/{len(cards)} saved")

    out = {
        "updated": now if price_failures < len(SETS) else old.get("updated", now),
        "salesUpdated": now if sales_ok else old.get("salesUpdated"),
        "source": "TCGplayer",
        "sets": sets_out,
        "cards": cards,
    }
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    log(f"Wrote {len(cards)} cards to {os.path.relpath(DATA_FILE, ROOT)}")


if __name__ == "__main__":
    main()
