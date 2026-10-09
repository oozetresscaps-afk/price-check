#!/usr/bin/env python3
"""Refresh TCGplayer data for the sets Equire tracks.

Writes app/data/prices.json with, for every card:
  p  market price per printing and condition (TCGplayer price guide)
  l  cheapest live listing per printing and condition: [item price, shipping]
  s  sales from about the last two months, plus the latest sale for every
     printing and condition seen: [condition, printing, price, date]
and saves card thumbnails into app/img/ so the app works offline.

Printings are stored by TCGplayer's own names ("Normal", "Reverse Holofoil",
"Holofoil", "1st Edition", ...). Standard library only.
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

# Fixed sets (TCGplayer set IDs).
SETS = [
    {"id": 1375, "name": "Expedition", "abbr": "EX", "tab": "Expedition", "cat": 3},
    {"id": 1397, "name": "Aquapolis", "abbr": "AQ", "tab": "Aquapolis", "cat": 3},
    {"id": 1372, "name": "Skyridge", "abbr": "SK", "tab": "Skyridge", "cat": 3},
]
# Sets found by name in TCGplayer's set list each run (3 = Pokemon, 85 = Pokemon Japan).
FIND = [
    {"cats": [3], "pattern": r"^(WoTC Promo|Wizards Black Star Promos?)$", "tab": "Promos", "abbr": "Promo"},
    {"cats": [3, 85], "pattern": r"(?i)vending|expansion sheet", "tab": "Vending", "abbr": "Vend"},
    {"cats": [85], "pattern": r"^(Pok[eé]mon |Pokemon Card )?VS$", "tab": "VS", "abbr": "VS"},
]
TAB_ORDER = ["Expedition", "Aquapolis", "Skyridge", "Promos", "Vending", "VS"]
LANG = {3: (1, "English"), 85: (7, "Japanese")}

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP = os.path.join(ROOT, "app")
DATA_FILE = os.path.join(APP, "data", "prices.json")
IMG_DIR = os.path.join(APP, "img")

SETNAMES_URL = "https://mpapi.tcgplayer.com/v2/Catalog/SetNames?categoryId={cat}&active=true"
PRICE_URLS = [
    "https://infinite-api.tcgplayer.com/priceguide/set/{id}/cards/?rows=5000&productTypeID=1",
    "https://infinite-api.tcgplayer.com/priceguide/set/{id}/cards/?rows=5000",
]
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

SALES_DAYS = 61          # keep every sale from roughly the last two months
SALES_PAGE = 25          # the sales feed returns 25 at a time
SALES_MAX_PAGES = 6      # look back at most 150 sales per card
SALES_KEEP = 60          # cap on stored sales per card (latest per printing/condition kept on top)
LISTINGS_SIZE = 50       # cheapest listings checked per card
DELAY = 0.3              # seconds between requests, to stay polite
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


def printing_name(text):
    text = (text or "").strip()
    return text or "Normal"


def clean_name(name):
    # "Alakazam (33)" -> "Alakazam", "Ampharos (H1)" -> "Ampharos", "Drowzee (74a)" -> "Drowzee"
    return re.sub(r"\s*\((?:H)?\d+[a-zA-Z]?\)\s*$", "", name or "").strip()


def clean_number(num):
    # "033/165" -> "33/165", "H01/H32" -> "H1/H32", "074a/147" -> "74a/147"
    def strip(part):
        m = re.match(r"^([A-Za-z]*)0*(\d+)([A-Za-z]?)$", part.strip())
        return f"{m.group(1)}{m.group(2)}{m.group(3)}" if m else part.strip()
    return "/".join(strip(p) for p in (num or "").split("/") if p.strip())


def money(v):
    try:
        v = float(v)
    except (TypeError, ValueError):
        return None
    return round(v, 2) if v > 0 else None


def short_abbr(rule, name):
    if rule["tab"] == "Vending":
        m = re.search(r"(?:Series|Sheet)\s*(\d+)", name, re.I)
        return f"Vend {m.group(1)}" if m else "Vend"
    return rule["abbr"]


def find_sets(previous_sets):
    """Look up the extra sets by name in TCGplayer's catalogue."""
    found, errors = [], []
    names_by_cat = {}
    for cat in sorted({c for rule in FIND for c in rule["cats"]}):
        try:
            data = request(SETNAMES_URL.format(cat=cat))
            rows = pick(data, "results") or (data if isinstance(data, list) else [])
            names_by_cat[cat] = [(pick(r, "setNameId", "groupId", "id"), pick(r, "name") or "", pick(r, "urlName", "cleanSetName") or "") for r in rows]
            log(f"Category {cat}: {len(names_by_cat[cat])} sets listed")
        except Exception as e:
            errors.append(f"category {cat}: {describe(e)}")
            log(f"Could not list sets for category {cat}: {describe(e)}")
    candidates = [f"{name} ({sid}, cat {cat})" for cat, rows in names_by_cat.items() for sid, name, _ in rows
                  if re.search(r"(?i)vend|sheet|\bvs\b|wotc|wizards", name)]
    seen = {s["id"] for s in SETS}
    for rule in FIND:
        for cat in rule["cats"]:
            for sid, name, url in names_by_cat.get(cat, []):
                if sid and sid not in seen and re.search(rule["pattern"], name):
                    seen.add(sid)
                    found.append({"id": sid, "name": name, "abbr": short_abbr(rule, name), "tab": rule["tab"], "cat": cat, "url": url})
                    log(f"Found {rule['tab']}: {name} ({sid}, category {cat})")
    # If the catalogue lookup failed, fall back to sets found on an earlier run.
    if errors:
        for s in previous_sets:
            if s.get("tab") in {r["tab"] for r in FIND} and s["id"] not in seen:
                seen.add(s["id"])
                found.append({k: s[k] for k in ("id", "name", "abbr", "tab", "cat", "url") if k in s})
    return found, errors, candidates[:60]


def fetch_set_prices(s):
    rows = []
    for url in PRICE_URLS:
        data = request(url.format(id=s["id"]))
        rows = pick(data, "result") or []
        if rows:
            break
    cards = {}
    for row in rows:
        pid = pick(row, "productID", "productId")
        if pid is None:
            continue
        pname = printing_name(pick(row, "printing"))
        ccode = condition_code(pick(row, "condition"))
        card = cards.setdefault(pid, {
            "id": pid,
            "set": s["id"],
            "name": clean_name(pick(row, "productName")),
            "num": clean_number(pick(row, "number")),
            "rarity": pick(row, "rarity") or "",
            "p": {},
        })
        if ccode:
            price = money(pick(row, "marketPrice"))
            card["p"].setdefault(pname, {})
            if price is not None:
                card["p"][pname][ccode] = price
    return list(cards.values())


SEARCH_URL = "https://mp-search-api.tcgplayer.com/v1/search/request?q={q}&isList=false"
PRODUCT_LINE = {3: "pokemon", 85: "pokemon-japan"}


def slug(text):
    return re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")


def search_page(cat, q, set_slug, start):
    term = {"productLineName": [PRODUCT_LINE.get(cat, "pokemon")]}
    if set_slug:
        term["setName"] = [set_slug]
    body = {
        "algorithm": "sales_dismax", "from": start, "size": 50,
        "filters": {"term": term, "range": {}, "match": {}},
        "listingSearch": {"context": {"cart": {}}, "filters": {"term": {"sellerStatus": "Live", "channelId": 0},
                          "range": {"quantity": {"gte": 1}}, "exclude": {"channelExclusion": 0}}},
        "context": {"cart": {}, "shippingCountry": "US", "userProfile": {}},
        "settings": {"useFuzzySearch": False, "didYouMean": {}},
        "sort": {},
    }
    data = request(SEARCH_URL.format(q=urllib.request.quote(q)), body=body)
    outer = pick(data, "results") or []
    block = outer[0] if outer and isinstance(outer[0], dict) else {}
    return pick(block, "results") or [], pick(block, "totalResults") or 0


def fetch_set_from_search(s, debug):
    """List a set's cards through TCGplayer's search when the price guide has nothing."""
    cat = s.get("cat", 3)
    attempts = [("", s.get("url") or slug(s["name"])), ("", slug(s["name"])), (s["name"], None)]
    for q, set_slug in attempts:
        cards, start, total = {}, 0, None
        try:
            while start < 1000:
                rows, total = search_page(cat, q, set_slug, start)
                if not debug.get(s["name"]):
                    debug[s["name"]] = f"q={q!r} set={set_slug!r} total={total} first={sorted(rows[0].keys())[:25] if rows else None}"
                for r in rows:
                    pid = pick(r, "productId", "productID")
                    sid = pick(r, "setId", "groupId")
                    if pid is None or (sid is not None and int(sid) != int(s["id"])):
                        continue
                    if pick(r, "sealed") or str(pick(r, "productTypeName") or "Cards") not in ("Cards", "Singles"):
                        continue
                    attrs = pick(r, "customAttributes") or {}
                    cards[pid] = {
                        "id": int(pid), "set": s["id"],
                        "name": clean_name(pick(r, "productName")),
                        "num": clean_number(pick(attrs, "number") or ""),
                        "rarity": pick(r, "rarityName") or "",
                        "p": {}, "mkt": money(pick(r, "marketPrice")),
                    }
                start += 50
                if not rows or start >= (total or 0):
                    break
                time.sleep(DELAY)
        except Exception as e:
            debug[s["name"]] = f"q={q!r} set={set_slug!r} error={describe(e)}"
            continue
        if cards:
            return list(cards.values())
    return []


def fetch_sales(pid, lang_id):
    out = _fetch_sales(pid, [lang_id])
    if not out:   # some Japanese cards sit in the English catalogue, or the other way round
        out = _fetch_sales(pid, [7 if lang_id == 1 else 1])
    return out


def _fetch_sales(pid, langs):
    cutoff = (datetime.now(timezone.utc) - timedelta(days=SALES_DAYS)).strftime("%Y-%m-%d")
    out = []
    for page in range(SALES_MAX_PAGES):
        body = {
            "conditions": [], "languages": langs, "variants": [],
            "listingType": "All", "offset": page * SALES_PAGE, "limit": SALES_PAGE,
            "time": int(time.time() * 1000),
        }
        data = request(SALES_URL.format(id=pid), body=body)
        rows = pick(data, "data") or []
        dates = []
        for sale in rows:
            ccode = condition_code(pick(sale, "condition"))
            pname = printing_name(pick(sale, "variant"))
            price = money(pick(sale, "purchasePrice"))
            date = (pick(sale, "orderDate") or "")[:10]
            if date:
                dates.append(date)
            if ccode and price is not None and date:
                out.append([ccode, pname, price, date])
        if len(rows) < SALES_PAGE or not dates or min(dates) < cutoff:
            break
        time.sleep(DELAY)
    out.sort(key=lambda r: r[3], reverse=True)
    keep = [s for s in out if s[3] >= cutoff][:SALES_KEEP]
    have = {(s[1], s[0]) for s in keep}
    for s in out:   # never leave a printing/condition blank if an older sale exists
        if (s[1], s[0]) not in have:
            keep.append(s)
            have.add((s[1], s[0]))
    keep.sort(key=lambda r: r[3], reverse=True)
    return keep


def listing_rows(data):
    """The listings API nests results: {"results": [{"results": [listing, ...]}]}."""
    outer = pick(data, "results")
    if isinstance(outer, list) and outer and isinstance(outer[0], dict) and "results" in {k.lower() for k in outer[0]}:
        inner = pick(outer[0], "results")
        return inner if isinstance(inner, list) else []
    return outer if isinstance(outer, list) else []


def fetch_listings(pid, language):
    best, count = _fetch_listings(pid, language)
    if not best:   # retry without a language filter for cards listed under the other language
        best, count = _fetch_listings(pid, None)
    return best, count


def _fetch_listings(pid, language):
    term = {"sellerStatus": "Live", "channelId": 0}
    if language:
        term["language"] = [language]
    body = {
        "filters": {
            "term": term,
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
    best, count = {}, {}
    for row in listing_rows(data):
        pname = printing_name(pick(row, "printing"))
        ccode = condition_code(pick(row, "condition"))
        price = money(pick(row, "price"))
        if not (ccode and price is not None):
            continue
        ship = pick(row, "shippingPrice", "sellerShippingPrice", "rankedShippingPrice")
        try:
            ship = round(max(float(ship or 0), 0), 2)
        except (TypeError, ValueError):
            ship = 0.0
        count[pname] = count.get(pname, 0) + 1
        cur = best.setdefault(pname, {}).get(ccode)
        if cur is None or price + ship < cur[0] + cur[1]:
            best[pname][ccode] = [price, ship]
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


def upgrade_old(card):
    """Data from before printing names were stored used N/R/H codes."""
    names = {"N": "Normal", "R": "Reverse Holofoil", "H": "Holofoil"}
    for key in ("p", "l", "lc"):
        if isinstance(card.get(key), dict):
            card[key] = {names.get(k, k): v for k, v in card[key].items()}
    card["s"] = [[s[0], names.get(s[1], s[1]), s[2], s[3]] for s in card.get("s", [])]
    return card


def main():
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    previous, old = {}, {}
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE) as f:
            old = json.load(f)
        previous = {c["id"]: upgrade_old(c) for c in old.get("cards", [])}

    extra, set_errors, candidates = find_sets(old.get("sets", []))
    all_sets = sorted(SETS + extra, key=lambda s: (TAB_ORDER.index(s["tab"]) if s["tab"] in TAB_ORDER else 99, s["name"]))
    cat_of = {s["id"]: s.get("cat", 3) for s in all_sets}

    cards, sets_out, price_failures, search_debug = [], [], 0, {}
    for s in all_sets:
        try:
            set_cards = fetch_set_prices(s)
            log(f"{s['name']}: {len(set_cards)} cards from the price guide")
            if not set_cards:
                set_cards = fetch_set_from_search(s, search_debug)
                log(f"{s['name']}: {len(set_cards)} cards from TCGplayer search ({search_debug.get(s['name'])})")
        except Exception as e:
            price_failures += 1
            set_cards = [c for c in previous.values() if c.get("set") == s["id"]]
            log(f"{s['name']}: price guide failed ({describe(e)}); kept {len(set_cards)} saved cards")
        cards.extend(set_cards)
        sets_out.append({**s, "count": len(set_cards)})

    if price_failures == len(all_sets) and not previous:
        log("Could not reach the TCGplayer price guide for any set. Nothing written.")
        sys.exit(1)

    diag = {"salesOk": 0, "salesFailed": 0, "listingsOk": 0, "listingsFailed": 0, "listingsEmpty": 0,
            "salesError": None, "listingsError": None, "setLookupErrors": set_errors,
            "setsFound": [f"{s['name']} ({s['id']})" for s in extra], "setCandidates": candidates,
            "emptySets": [s["name"] for s in sets_out if not s["count"]], "searchDebug": search_debug}
    for i, card in enumerate(cards):
        lang_id, language = LANG.get(cat_of.get(card["set"], 3), LANG[3])
        prev = previous.get(card["id"], {})
        card["s"] = prev.get("s", [])
        card["l"] = prev.get("l", {})
        if not SKIP_SALES:
            try:
                card["s"] = fetch_sales(card["id"], lang_id)
                diag["salesOk"] += 1
            except Exception as e:
                diag["salesFailed"] += 1
                if diag["salesFailed"] <= 3:
                    diag["salesError"] = describe(e)
                    log(f"Last sold failed for {card['name']} ({card['id']}): {diag['salesError']}")
            time.sleep(DELAY)
        if not SKIP_LISTINGS:
            try:
                best, count = fetch_listings(card["id"], language)
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
    for card in cards:
        mkt = card.pop("mkt", None)
        if mkt and not any(card["p"].values()):
            seen = {}
            for v in card.get("lc", {}) or {}:
                seen[v] = seen.get(v, 0) + card["lc"][v]
            for sale in card.get("s", []):
                seen[sale[1]] = seen.get(sale[1], 0) + 1
            main_print = max(seen, key=seen.get) if seen else "Normal"
            card["p"] = {main_print: {"NM": mkt}}
    log(f"Sales: {diag['salesOk']} updated, {diag['salesFailed']} kept from before")
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
        "version": 2,
        "updated": now if price_failures < len(all_sets) else old.get("updated", now),
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
