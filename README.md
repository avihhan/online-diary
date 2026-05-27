# Diary of Avi & Gracelynn

A retro, pink-themed 3D love-diary built with **React + Vite + React Three Fiber** on the frontend and **Python serverless functions** on Vercel, with **Google Sheets** as the database.

The closed leather book has a curved 3D title and a heart-shaped padlock. Click the lock, pick who you are (Avi = blue pencil, Gracelynn = pink pencil), and whisper the shared password to open the diary. Inside you'll find:

1. **Our Map** — a Mapbox world map; click anywhere to drop a pin you've visited or want to visit.
2. **Date Ideas** — a shared, checkable bucket list with each entry color-coded by who added it.
3. **Important Dates** — a retro pixel calendar to mark anniversaries, milestones, and reminders.
4. **Shared Thoughts** — a timestamped feed where both of you can leave notes, color-coded by author.

Chiptune sound effects fire on every click, page-flip, and unlock, and there's an optional background music track ("Dance of the Blessed Spirits" by Gluck — see Audio section below).

Smooth CSS-3D page-flip animations connect everything together. The whole UI is wrapped in a retro CRT scanline effect with a floating pixel-heart background.

---

## Tech Stack

- **Frontend**: React 18, Vite, React Three Fiber + drei, `@react-spring/three`, Framer Motion, Mapbox GL JS, Zustand, Axios
- **Backend**: Python 3.11 serverless functions on Vercel using `gspread` + `google-auth`
- **Storage**: Google Sheets (single spreadsheet, three tabs)
- **Hosting**: Vercel (single deploy — Vite static + Python functions auto-detected)
- **Fonts**: Press Start 2P + VT323 + Caveat from Google Fonts

---

## One-time setup

### 1. Create the Google Sheet

1. Go to https://sheets.google.com and create a new blank spreadsheet.
2. Rename the spreadsheet to anything you like (for example, "Diary of Avi & Gracelynn").
3. Create **three tabs** at the bottom and name them exactly:
   - `places`
   - `bucket_list`
   - `thoughts`
4. Copy the spreadsheet ID from the URL — it's the long string between `/d/` and `/edit`:
   `https://docs.google.com/spreadsheets/d/THIS_IS_THE_SHEET_ID/edit`

   You don't need to add any headers — the backend creates them on first write.

### 2. Create a Google service account

1. Open https://console.cloud.google.com/ and create a new project (or use an existing one).
2. Under **APIs & Services → Library**, enable both:
   - **Google Sheets API**
   - **Google Drive API**
3. Under **APIs & Services → Credentials**, click **Create Credentials → Service account**.
4. Give it any name, leave roles blank, finish.
5. Open the service account, go to the **Keys** tab, click **Add key → Create new key → JSON** and download the JSON file.
6. Open the JSON file, find the `client_email` (looks like `xxx@yyy.iam.gserviceaccount.com`), then go back to your Google Sheet and **share** it with that email as an **Editor**.

### 3. Create a Mapbox token

1. Sign up at https://account.mapbox.com/ (free tier is plenty).
2. Copy your default **public token** (starts with `pk.`).

### 4. Set environment variables

For local development create a `.env.local` file in the project root (it's gitignored):

```env
VITE_MAPBOX_TOKEN=pk.your_public_mapbox_token
DIARY_PASSWORD=our-secret-love
SESSION_SECRET=replace-with-a-long-random-hex-string
SHEET_ID=your-google-sheet-id
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...", ...}
```

The `GOOGLE_SERVICE_ACCOUNT_JSON` must be the full contents of the JSON key file as a single line. The easiest way is to copy the file's contents and use a JSON minifier, or run:

```bash
node -e "console.log(JSON.stringify(require('./service-account.json')))"
```

For `SESSION_SECRET`, any long random string works. Generate one quickly with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Local development

```bash
npm install
npm run dev
```

This starts the Vite dev server on http://localhost:5173. To also run the Python backend locally, use the Vercel CLI which runs everything together:

```bash
npm install -g vercel
vercel dev
```

`vercel dev` reads `.env.local` automatically and serves both the Vite app and the Python functions at the same port.

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. Vercel auto-detects Vite. Leave the build settings at the defaults — `vercel.json` already configures the Python runtime for `/api/*.py`.
4. In **Project Settings → Environment Variables**, add the **five** vars from the `.env.example`:
   - `VITE_MAPBOX_TOKEN`
   - `DIARY_PASSWORD`
   - `SESSION_SECRET`
   - `SHEET_ID`
   - `GOOGLE_SERVICE_ACCOUNT_JSON`
5. Deploy. The first deploy takes a few minutes because Vercel installs the Python dependencies.

After deploy, visit your Vercel URL, click the heart lock, pick a user, and type the password.

---

## Project layout

```
/
├── api/                          # Python serverless functions on Vercel
│   ├── auth.py                   # POST /api/auth
│   ├── places.py                 # GET/POST/PATCH/DELETE /api/places
│   ├── bucket.py                 # GET/POST/PATCH/DELETE /api/bucket
│   ├── thoughts.py               # GET/POST/DELETE /api/thoughts
│   └── _lib/                     # shared helpers (sheets, auth, http)
├── public/textures/              # SVG textures (leather, paper, pixel hearts, pencil)
├── src/
│   ├── three/                    # R3F book, leather cover, curved title, heart lock
│   ├── components/               # PasswordModal, OpenBook, NavArrows, Hud, pages/...
│   ├── state/                    # Zustand stores (useAuth, useDiary)
│   ├── api/client.js             # axios wrapper with bearer-token interceptor
│   ├── styles/retro.css          # all the retro styling
│   ├── App.jsx, main.jsx
├── vercel.json                   # Vite + python3.11 runtime config
├── requirements.txt              # gspread, google-auth, python-ulid
├── package.json, vite.config.js
└── README.md
```

---

## Audio

### Background music (Gluck — "Dance of the Blessed Spirits")

The diary tries to load `public/audio/blessed-spirits.mp3` and loop it quietly in the background. If the file isn't there, the music button in the HUD just shows `♪ ?` and stays disabled — nothing breaks.

To enable music:
1. Grab any public-domain recording of Gluck's *Dance of the Blessed Spirits* (Act II Andante from *Orfeo ed Euridice*). Good free sources:
   - https://musopen.org/music/ (search "Dance of the Blessed Spirits")
   - https://imslp.org/wiki/Orfeo_ed_Euridice_(Gluck%2C_Christoph_Willibald)
2. Save it as **`blessed-spirits.mp3`** inside `public/audio/`
3. Refresh the page — the `♪ Play` button in the top-right HUD activates. Use the slider to set volume; preferences persist across sessions.

### Sound effects

Built-in chiptune SFX (no files needed — synthesized in the browser via Web Audio):
- soft blip on every button click
- whoosh + paper-settle on every page-flip
- 3-note arpeggio on successful unlock
- low woody pop when the cover opens
- sad descending tones on errors

Toggle them with the `SFX On / Off` button in the same HUD widget.

## Notes

- The diary uses a single shared password. Pick something only the two of you know.
- The session token is a small signed HMAC blob valid for 7 days, stored in `sessionStorage`.
- Data appears in your Google Sheet in real time — you can edit rows directly there too.
- Mapbox is free up to 50,000 map loads per month.

## Local dev (Windows)

`vercel dev` doesn't reliably serve Python serverless functions on Windows + Python 3.14, so the project includes a tiny standalone Python dev server. Run two terminals:

```powershell
# Terminal 1 — Python API on port 3001
pip install -r requirements.txt python-dotenv
python dev_server.py

# Terminal 2 — Vite frontend on port 5173
npm run dev
```

Open http://localhost:5173. Vite proxies `/api/*` to the Python server. The `.env.local` file is loaded automatically by `dev_server.py`.

In production on Vercel, none of this matters — the `api/*.py` files are auto-detected and run as serverless functions.
