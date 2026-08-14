export async function fetchWeatherData(lat = 51.5072, lon = -0.1276, tz = 'Europe/London') {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const endDate = yesterday.toISOString().split('T')[0];
    
    // Single massive fetch from 1940
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=1940-05-01&end_date=${endDate}&daily=temperature_2m_max,precipitation_sum&timezone=${tz}`;
    
    let json;
    const cacheName = 'weather-data-v1';
    let cachedResponse = null;
    
    try {
      const cache = await caches.open(cacheName);
      cachedResponse = await cache.match(url);
    } catch (e) {
      console.warn("Cache API not available", e);
    }

    if (cachedResponse) {
      json = await cachedResponse.json();
    } else {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch historical data: " + res.status);
      
      try {
        const cache = await caches.open(cacheName);
        await cache.put(url, res.clone());
      } catch (e) {
        console.warn("Failed to cache response", e);
      }
      
      json = await res.json();
    }
    
    const daysMap = new Map();
    const tempDate = new Date('2020-05-01'); // Leap year base for dates
    while (tempDate.getMonth() <= 8) { // Up to September
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const dateStr = `${month}-${day}`;
      
      daysMap.set(dateStr, {
        dateStr,
        day: tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
      
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    json.daily.time.forEach((timeStr, index) => {
      const [year, month, day] = timeStr.split('-');
      const dateStr = `${month}-${day}`;
      const temp = json.daily.temperature_2m_max[index];
      const precip = json.daily.precipitation_sum[index];
      
      if (['05', '06', '07', '08', '09'].includes(month) && daysMap.has(dateStr)) {
        if (temp !== null) {
          daysMap.get(dateStr)[year] = temp;
          daysMap.get(dateStr)[`${year}_precip`] = precip;
        }
      }
    });
    
    return Array.from(daysMap.values());
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}
