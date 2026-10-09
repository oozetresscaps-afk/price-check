# E-Value

A home-screen app for Expedition, Aquapolis and Skyridge prices. It shows TCGplayer market price and last sold for every card, by printing (Normal, Reverse, Holo) and condition (NM, LP, MP, HP, DMG), and keeps everything on the phone so it works with no signal at a card show.

A GitHub Actions job pulls fresh TCGplayer data every 6 hours and republishes the app on GitHub Pages. Whenever the phone has a connection, the app picks up the newest prices; when it doesn't, it shows the last prices it saved and tells you how old they are.

## Set it up (about 15 minutes, once)

1. Create a new **public** repository on GitHub, for example `price-check`. Leave it empty.
2. In the new repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push these files to the `main` branch:
   ```
   cd price-check
   git init -b main
   git add .
   git commit -m "Price Check app"
   git remote add origin https://github.com/<you>/price-check.git
   git push -u origin main
   ```
4. Open the **Actions** tab. The push starts **Refresh prices and publish app**. The first run takes roughly 8 to 10 minutes because it checks last sold for every card and downloads card images. If it ran before Pages was turned on and failed at the deploy step, press **Run workflow** to run it again.
5. When the run is green, the app is live at `https://<you>.github.io/price-check/`.

## Put it on your phone

1. Open the link in Chrome on Android.
2. Tap the menu and choose **Install app** (or **Add to Home screen**).
3. Open it once on Wi-Fi and leave it open until the line under the title stops saying "saving card images". That stores every price and image on the phone.
4. Test it before the show: turn on airplane mode and open the app. It should say "Offline. Showing prices saved …" and everything should still work.

On an iPhone, use Safari's Share button and **Add to Home Screen**; it works the same way.

## Using it

- Search by name or card number (`33`, `33/165`, `h12`).
- Pick a set at the top, and the printing and condition at the bottom. The list shows market price and the most recent sale for that exact printing and condition.
- Sort by number or by price.
- Tap a card to see every condition side by side, recent sales, and an **Asking** box that tells you what percent of market a dealer's price is.

## How the data works

- **Market price** comes from TCGplayer's set price guide, which lists a market price for each printing and condition. A dash means TCGplayer has no market price for that combination.
- **Last sold** comes from TCGplayer's latest sales for each card (the 25 most recent sales across all conditions). The price shown is the item price without shipping. Cards that rarely sell may have no recent sale in a given condition.
- These are TCGplayer's public website feeds, not an official API, so they can change without notice. If a refresh fails, the job keeps the previous data, so the app never goes blank. The job log in the Actions tab shows how many cards were updated.
- The job waits between requests to stay light on TCGplayer. To refresh more or less often, change the `cron` line in `.github/workflows/refresh.yml`.

## Files

```
app/                     the app itself (what GitHub Pages serves)
  index.html, app.js, styles.css
  sw.js                  offline support
  data/prices.json       written by the refresh job
  img/                   card images, written by the refresh job
scripts/update_prices.py the refresh job (Python, standard library only)
.github/workflows/refresh.yml
```

To add more sets later, add their TCGplayer set IDs to `SETS` in `scripts/update_prices.py`.

Fonts: Atkinson Hyperlegible and Barlow Condensed, both under the SIL Open Font License.
