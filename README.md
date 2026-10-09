# Equire

A home-screen app for hunting Expedition, Aquapolis and Skyridge cards at shows. For every card it shows TCGplayer's market price, the cheapest copy listed right now, and the most recent sale, by printing (Normal, Reverse, Holo) and condition (NM, LP, MP, HP, DMG). Everything is saved on the phone, so it keeps working with no signal.

A GitHub Actions job pulls fresh TCGplayer data every 4 hours and republishes the app on GitHub Pages. Whenever the phone is online, the app picks up the newest data; when it isn't, it uses what it saved and says how old it is.

Live at **https://oozetresscaps-afk.github.io/price-check/**

## On your phone

1. Open the link in Chrome on Android and tap **⋮ → Install app**.
2. Open it on Wi-Fi and wait until the speech bubble says everything's saved for offline.
3. Before a show, turn on airplane mode and open it once to be sure.

## What's in it

- **Search** by name or number (`33`, `33/165`, `h12`, `74a`).
- **Set chips** at the top, **printing and condition** at the bottom. Each card shows market price, 🛒 the cheapest listing on TCGplayer, and 🏷️ the last sale for that exact printing and condition.
- **Tap a card** for every condition side by side, recent sales, and a **🏪 Table price** box. Type what the vendor is asking and it tells you whether that beats buying online (with shipping) and what percent of market it is.
- **📚 Your collection**: import your Collectr CSV export and owned cards get a ✓ badge. The **🎯 Need** and **✅ Have** chips filter to what you're missing or already own, per printing. The collection stays on the phone; it is never uploaded.

## How the data works

- **Market** comes from TCGplayer's set price guide, per printing and condition.
- **Lowest** is the cheapest live English listing in that condition, with its shipping to the US, from the 50 cheapest listings for the card. Listings change constantly, so for a big buy, tap **See it live on TCGplayer** when you have signal.
- **Sold** comes from TCGplayer's latest sales for the card. It's the item price without shipping.
- These are TCGplayer's public website feeds, not an official API, so they can change without notice. If part of a refresh fails, the job keeps the previous data so the app never goes blank. The job log in the Actions tab shows how many cards were updated.
- To refresh right before a show, open **Actions → Refresh prices and publish app → Run workflow**. A run takes about 10 to 15 minutes.

## Making changes

Every push to `main` refreshes the data and republishes the app. Installed copies update themselves: open the app once with a connection, close it, and reopen it. When changing app files, bump `VERSION` in `app/sw.js` so phones drop the old saved copy.

```
app/                     the app (what GitHub Pages serves)
  index.html, app.js, styles.css
  sw.js                  offline support
  data/prices.json       written by the refresh job
  img/                   card images, written by the refresh job
scripts/update_prices.py the refresh job (Python, standard library only)
.github/workflows/refresh.yml
```

To add sets, add their TCGplayer set IDs to `SETS` in `scripts/update_prices.py`. To change how often it refreshes, edit the `cron` line in the workflow.

Fonts: Atkinson Hyperlegible and Baloo 2, both under the SIL Open Font License.
