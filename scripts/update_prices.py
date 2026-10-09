#!/usr/bin/env python3
"""Refresh TCGplayer data for Expedition, Aquapolis and Skyridge.

Writes app/data/prices.json with, for every card:
  p  market price per printing and condition (TCGplayer price guide)
  l  cheapest live listing per printing and condition: [item price, shipping]
  s  recent sales: [condition, printing, price, date]
and saves card thumbnails into app/img/ so the app works offline.

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
LISTINGS_URL = "https://mp-search-api.tcgplayer.com/v1/product/{id}/listings"
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
LISTINGS_SIZE = 50       # cheapest listings checked per card
DELAY = 0.35             # seconds between requests, to stay polite
SKIP_SALES = os.environ.get("SKIP_SALES") == "1"
SKIP_LISTINGS = os.environ.get("SKIP_LISTINGS") == "1"
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


def describe(e):
    """Short error text for the log and diagnostics, including the API's reply."""
    text = str(e)
    if isinstance(e, urllib.error.HTTPError):
        try:
            text += " " + e.read()[:300].decode("utf-8", "replace")
        except Exception:
            pass
    return text[:400]


def pick(d, *names):
    """Read a field regardless of capitalisation (productID / productId)."""
    if not isinstance(d, dict):
        return None
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
    # "Alakazam (33)" -> "Alakazam", "Ampharos (H1)" -> "Ampharos", "Drowzee (74a)" -> "Drowzee"
    return re.sub(r"\s*\((?:H)?\d+[a-zA-Z]?\)\s*$", "", name or "").strip()


def clean_number(num):
    # "033/165" -> "33/165", "H01/H32" -> "H1/H32", "074a/147" -> "74a/147"
    def strip(part):
        m = re.match(r"^([A-Za-z]*)0*(\d+)([A-Za-z]?)$", part.strip())
        return f"{m.group(1)}{m.group(2)}{m.group(3)}" if m else part.strip()
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
        low = money(pick(row, "lowPrice"))
        if low is not None:
            card["low"] = low
        if pcode and ccode:
            price = money(pick(row, "marketPrice"))
            card["p"].setdefault(pcode, {})
            if price is not None:
                card["p"][pcode][ccode] = price
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


def listing_rows(data):
    """The listings API nests results: {"results": [{"results": [listing, ...]}]}."""
    outer = pick(data, "results")
    if isinstance(outer, list) and outer and isinstance(outer[0], dict) and "results" in {k.lower() for k in outer[0]}:
        inner = pick(outer[0], "results")
        return inner if isinstance(inner, list) else []
    return outer if isinstance(outer, list) else []


def fetch_listings(pid):
    body = {
        "filters": {
            "term": {"sellerStatus": "Live", "channelId": 0, "language": ["English"]},
            "range": {"quantity": {"gte": 1}},
            "exclude": {"channelExclusion": 0},
        },
        "from": 0,
        "size": LISTINGS_SIZE,
        "sort": {"field": "price+shipping", "order": "asc"},
        "context": {"shippingCountry": "US", "cart": {}},
        "aggregations": ["listingType"],
    }
    data = request(LISTINGS_URL.format(id=pid), body=body)
    best = {}
    count = {}
    for row in listing_rows(data):
        pcode = printing_code(pick(row, "printing"))
        ccode = condition_code(pick(row, "condition"))
        price = money(pick(row, "price"))
        if not (pcode and ccode and price is not None):
            continue
        ship = pick(row, "shippingPrice", "sellerShippingPrice", "rankedShippingPrice")
        try:
            ship = round(max(float(ship or 0), 0), 2)
        except (TypeError, ValueError):
            ship = 0.0
        count[pcode] = count.get(pcode, 0) + 1
        cur = best.setdefault(pcode, {}).get(ccode)
        if cur is None or price + ship < cur[0] + cur[1]:
            best[pcode][ccode] = [price, ship]
    return best, count


def save_image(pid):
    path = os.path.join(IMG_DIR, f"{pid}.jpg")
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return True
    try:
        payload = request(IMG_URL.format(id=pid), raw=True, retries=2)
    except Exception:
        return False
    if not payload or payload[:3] != b"\xff\xd8\xff":
        return False
    with open(path, "wb") as f:
        f.write(payload)
    return True


def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    previous, old = {}, {}
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
            log(f"{s['name']}: price guide failed ({describe(e)}); kept {len(set_cards)} saved cards")
        cards.extend(set_cards)
        sets_out.append({**s, "count": len(set_cards)})

    if price_failures == len(SETS) and not previous:
        log("Could not reach the TCGplayer price guide for any set. Nothing written.")
        sys.exit(1)

    diag = {"salesOk": 0, "salesFailed": 0, "listingsOk": 0, "listingsFailed": 0,
            "listingsEmpty": 0, "salesError": None, "listingsError": None}
    for i, card in enumerate(cards):
        prev = previous.get(card["id"], {})
        card["s"] = prev.get("s", [])
        card["l"] = prev.get("l", {})
        if not SKIP_SALES:
            try:
                card["s"] = fetch_sales(card["id"])
                diag["salesOk"] += 1
            except Exception as e:
                diag["salesFailed"] += 1
                if diag["salesFailed"] <= 3:
                    diag["salesError"] = describe(e)
                    log(f"Last sold failed for {card['name']} ({card['id']}): {diag['salesError']}")
            time.sleep(DELAY)
        if not SKIP_LISTINGS:
            try:
                best, count = fetch_listings(card["id"])
                card["l"] = best
                card["lc"] = count
                diag["listingsOk"] += 1
                if not best:
                    diag["listingsEmpty"] += 1
            except Exception as e:
                diag["listingsFailed"] += 1
                if diag["listingsFailed"] <= 3:
                    diag["listingsError"] = describe(e)
                    log(f"Listings failed for {card['name']} ({card['id']}): {diag['listingsError']}")
            time.sleep(DELAY)
        if (i + 1) % 100 == 0:
            log(f"{i + 1}/{len(cards)} cards checked")
    log(f"Last sold: {diag['salesOk']} updated, {diag['salesFailed']} kept from before")
    log(f"Lowest listed: {diag['listingsOk']} updated ({diag['listingsEmpty']} with no listings), "
        f"{diag['listingsFailed']} kept from before")

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
        "salesUpdated": now if diag["salesOk"] else old.get("salesUpdated"),
        "listingsUpdated": now if diag["listingsOk"] else old.get("listingsUpdated"),
        "source": "TCGplayer",
        "diag": diag,
        "sets": sets_out,
        "cards": cards,
    }
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump(out, f, separators=(",", ":"), ensure_ascii=False)
    log(f"Wrote {len(cards)} cards to {os.path.relpath(DATA_FILE, ROOT)}")


if __name__ == "__main__":
    main()
