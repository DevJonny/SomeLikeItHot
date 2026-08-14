---
name: add-weather-metrics
description: >-
  Use this skill as a runbook when the user asks to add new data metrics (e.g., wind speed, sunshine duration) to the application.
---

# Adding Weather Metrics Runbook

When adding a new metric to be visualized in the application, follow these precise steps:

## 1. Update API Fetch
In `weatherService.js`, add the new Open-Meteo variable to the URL query string inside `fetchWeatherData`.
For example, if adding wind speed, change `daily=temperature_2m_max,precipitation_sum` to `daily=temperature_2m_max,precipitation_sum,wind_speed_10m_max`.

## 2. Extract the Data
In the same file, inside the `json.daily.time.forEach` loop, extract the new metric from the JSON payload and assign it to `daysMap`.
Example:
```javascript
const wind = json.daily.wind_speed_10m_max[index];
if (wind !== null) {
  daysMap.get(dateStr)[`${year}_wind`] = wind;
}
```

## 3. Update Stats Calculation
In `App.jsx`, update the `getStatsForYear` function to ingest this new field and calculate yearly aggregates (e.g., average wind speed or days above a threshold). Ensure you return it in the final object.

## 4. Render the New Metric
In `App.jsx`:
1. Add a new tab button in the `.tabs-container` for the metric.
2. Render a new `renderTrendChart` component block mapped to that tab. Include appropriate domain scales and unit labels.
3. Update the `stats-container` UI to display the new metric for the selected periods.
4. Add the metric as a sortable column in the Historical Season Rankings table.
