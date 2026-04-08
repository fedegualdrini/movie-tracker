# 🎬 Movie Tracker

A personal media library to track movies, series, and anime — with TMDB metadata, Rotten Tomatoes scores, season-level scoring, and Excel import from yearly watchlists.

**Live →** [movie-tracker-production-145a.up.railway.app](https://movie-tracker-production-145a.up.railway.app)

---

## Features

- **Library** — Poster grid or table view with instant search, filters by type / tracked year / release year / watch status, and multiple sort options
- **Smart Add** — Search TMDB on entry creation; pick from results if multiple matches; metadata loads before saving
- **Auto-enrichment** — Poster, score, genres, overview, and Rotten Tomatoes rating fetched automatically from TMDB + OMDB
- **Season scoring** — Series detail pages show all TMDB seasons; click any card to score it inline
- **Season tags** — Multi-season series show S1 S2 … badges on the library card with an averaged score
- **Excel import** — Upload yearly watchlist spreadsheets; repeated series entries auto-assign season numbers
- **Bulk enrich** — Re-process the entire library with live streaming progress
- **Score summary** — Settings table showing average scores per media type per tracked year
- **Dark mode** — Full dark/light theme

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, Turbopack) |
| Language | TypeScript |
| Database | SQLite via `better-sqlite3` |
| Styling | Tailwind CSS v4 + Radix UI |
| Metadata | TMDB API v3 |
| Ratings | OMDB API (Rotten Tomatoes) |
| Excel parsing | SheetJS (`xlsx`) |
| Deployment | Railway |

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/fedegualdrini/movie-tracker.git
cd movie-tracker
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
TMDB_API_KEY=your_tmdb_api_key
OMDB_API_KEY=your_omdb_api_key
```

- Free TMDB key → [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
- Free OMDB key → [omdbapi.com/apikey.aspx](https://www.omdbapi.com/apikey.aspx)

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Excel Import Format

One sheet per year — the sheet name is the year you tracked it (e.g. `2024`).

| Column | Field | Example |
|---|---|---|
| A | Title | Arcane |
| B | Release Year | 2021 |
| C | Personal Score | 9.0 |
| D | Media Type | `Movie` / `Series` / `Anime` |

Repeated series entries within the same sheet are treated as sequential seasons (S1, S2, …).

Import via **Settings → Import Excel**.

---

## Deployment (Railway)

1. Push to GitHub
2. Create a Railway project → **Deploy from GitHub repo**
3. Add a **Volume** mounted at `/app/data` to persist the SQLite database across deploys
4. Add environment variables in the Railway dashboard:
   ```
   TMDB_API_KEY=...
   OMDB_API_KEY=...
   ```
5. Railway auto-detects Next.js and runs `npm run build && npm start`

---

## Project Structure

```
├── src/app/
│   ├── add/                   # Add entry with TMDB search & picker
│   ├── library/               # Main library grid / table page
│   ├── media/[id]/            # Detail page — scores, seasons, edit
│   ├── settings/              # Import, bulk enrich, score summary
│   └── api/
│       ├── media/             # CRUD for media entries
│       ├── media/[id]/enrich/ # Single-entry TMDB + OMDB enrichment
│       ├── enrich-all/        # Bulk enrichment with SSE streaming
│       ├── import/            # Excel import endpoint
│       └── tmdb/search/       # TMDB search proxy
├── components/
│   ├── library/               # MediaCard, MediaGrid, MediaTable, Filters
│   ├── detail/                # EditEntryForm, SeasonSelector, EnrichAllButton
│   └── shared/                # ScoreSummaryTable
├── db/
│   └── client.ts              # SQLite connection + runtime migrations
└── lib/
    ├── tmdb.ts                # TMDB API wrapper + smart match algorithm
    ├── omdb.ts                # OMDB / Rotten Tomatoes wrapper
    ├── excel-import.ts        # Excel parser + season auto-detection
    └── utils.ts               # Score colours, poster URLs, helpers
```

---

## Score Colour Scale

| Score | Colour | |
|---|---|---|
| 8.5 – 10 | Emerald | Excellent |
| 7.0 – 8.4 | Green | Good |
| 5.0 – 6.9 | Amber | Average |
| 0 – 4.9 | Red | Poor |
| — | — | Not scored / No Visto |
