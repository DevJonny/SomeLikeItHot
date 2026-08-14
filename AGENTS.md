# Some Like It Hot - Agent Guidelines

Welcome, Agent. When working on this repository, strictly adhere to the following project standards:

## 1. Technology Stack
*   **Framework**: React (using Vite)
*   **Charting**: Recharts
*   **Styling**: Pure Vanilla CSS (`App.css`). **DO NOT use TailwindCSS** or any other utility frameworks. Rely on the CSS variables defined in `index.css` for consistent theming.

## 2. Data Architecture & API
*   **Data Source**: Open-Meteo Archive API (`weatherService.js`).
*   **Fetch Strategy**: We execute a single massive fetch pulling daily data from `1940-05-01` to `yesterday`.
*   **Caching**: We use the native browser `Cache API` (`caches.match(url)`) in `weatherService.js` to aggressively cache the JSON response. Do not break or remove this, as it prevents `429 Too Many Requests` errors from the Open-Meteo API.
*   **Data Structure**: The application supports two view modes:
    *   **Decades**: Averages data into 10-year periods (e.g., `1970s`).
    *   **Years**: Renders all 87 individual years from 1940.
    *   This toggle dynamically swaps the `PERIODS` constant in `App.jsx`. Ensure both modes still work when adding new features.

## 3. Deployment
*   The site is hosted on GitHub Pages.
*   The Vite configuration `vite.config.js` uses `base: '/SomeLikeItHot/'`. Ensure any new static assets or routing mechanisms respect this base path.
