# GreenCity — Heilbronn Urban Intelligence

A responsive React dashboard prototype for exploring environmental indicators across Heilbronn, Germany. Its interactive real-world street map starts centered on the city, includes a clearly labeled sample user location and environmental sensor points, supports layer filtering and search, and reports map cursor/tap latitude and longitude. Map panning and zooming are constrained to the Heilbronn area.

## Run locally

```sh
npm run dev
```

This installs everything it needs the first time and opens the app in your browser automatically. To create a production build, run `npm run build`; `npm run lint` runs Oxlint.

## Connect the NeckarUs data API

The map reads cached sensor measurements from `../neckarUs` through `/api/v1/moment/environment`. Run both services in separate terminals:

```sh
cd ../neckarUs
uv run uvicorn neckarus.main:app --app-dir apps/api --reload --host 127.0.0.1 --port 8000
```

```sh
npm run dev
```

Vite proxies `/api` to the local API. The map creates an anonymous API session when needed and displays the latest eligible station readings, grouped by sensor category. If the API is unavailable, the map falls back to its labeled demo data.

NeckarUs stores app data in SQLite by default at `../neckarUs/runtime/neckarus.db`. Environmental readings originate from public sensor and weather sources and are cached by the API; they are not stored as live data in the React app.

## Map and sample data

The map uses public OpenStreetMap tiles and the official OSM administrative boundary for Heilbronn. The areas outside the city boundary are masked, and the city edge is outlined in red. Real OSM building polygons for central Heilbronn are bundled locally and shaded. Sensor coordinates, values, user location, metric cards, and recent city activity are demonstration data—not live municipal measurements. The basemap tiles require an internet connection.
