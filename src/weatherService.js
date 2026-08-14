export async function fetchWeatherData(lat = 51.5072, lon = -0.1276, tz = 'Europe/London') {
  try {
    // 1976 data
    const res1976 = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=1976-05-01&end_date=1976-09-30&daily=temperature_2m_max,precipitation_sum&timezone=${tz}`);
    if (!res1976.ok) throw new Error("Failed to fetch 1976 data");
    const data1976 = await res1976.json();
    
    // 2016-2026 data
    // Fetch up to yesterday to ensure we don't query future dates which might cause issues
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const endDate = yesterday.toISOString().split('T')[0];
    
    const res2016_2026 = await fetch(`https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=2016-05-01&end_date=${endDate}&daily=temperature_2m_max,precipitation_sum&timezone=${tz}`);
    if (!res2016_2026.ok) throw new Error("Failed to fetch recent data");
    const data2016_2026 = await res2016_2026.json();
    
    // Create map for each day from May 1 to Sep 30
    const daysMap = new Map();
    const tempDate = new Date('2020-05-01'); // Use leap year to ensure Feb 29 doesn't mess things up (not that we have it)
    while (tempDate.getMonth() <= 8) { // 8 is September
      const month = String(tempDate.getMonth() + 1).padStart(2, '0');
      const day = String(tempDate.getDate()).padStart(2, '0');
      const dateStr = `${month}-${day}`;
      
      daysMap.set(dateStr, {
        dateStr,
        day: tempDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
      
      tempDate.setDate(tempDate.getDate() + 1);
    }
    
    // Process 1976
    data1976.daily.time.forEach((timeStr, index) => {
      const [, month, day] = timeStr.split('-');
      const dateStr = `${month}-${day}`;
      const temp = data1976.daily.temperature_2m_max[index];
      const precip = data1976.daily.precipitation_sum[index];
      if (daysMap.has(dateStr)) {
        daysMap.get(dateStr)['1976'] = temp;
        daysMap.get(dateStr)['1976_precip'] = precip;
      }
    });
    
    // Process 2016-2026
    data2016_2026.daily.time.forEach((timeStr, index) => {
      const [year, month, day] = timeStr.split('-');
      const dateStr = `${month}-${day}`;
      const temp = data2016_2026.daily.temperature_2m_max[index];
      const precip = data2016_2026.daily.precipitation_sum[index];
      if (['05', '06', '07', '08', '09'].includes(month) && daysMap.has(dateStr) && temp !== null) {
        daysMap.get(dateStr)[year] = temp;
        daysMap.get(dateStr)[`${year}_precip`] = precip;
      }
    });
    
    return Array.from(daysMap.values());
  } catch (error) {
    console.error("Error fetching weather data:", error);
    throw error;
  }
}
