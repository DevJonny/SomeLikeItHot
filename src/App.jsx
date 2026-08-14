import React, { useState, useEffect, useMemo } from 'react';
import { fetchWeatherData } from './weatherService';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import './App.css';

const YEARS = ['1976', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];

const COLORS = {
  '1976': 'var(--chart-1976)',
  '2016': 'var(--chart-2016)',
  '2017': 'var(--chart-2017)',
  '2018': 'var(--chart-2018)',
  '2019': 'var(--chart-2019)',
  '2020': 'var(--chart-2020)',
  '2021': 'var(--chart-2021)',
  '2022': 'var(--chart-2022)',
  '2023': 'var(--chart-2023)',
  '2024': 'var(--chart-2024)',
  '2025': 'var(--chart-2025)',
  '2026': 'var(--chart-2026)',
};

const LOCATIONS = [
  { id: 'london', name: 'London', lat: 51.5072, lon: -0.1276, tz: 'Europe/London', threshold: 28 },
  { id: 'birmingham', name: 'Birmingham', lat: 52.4862, lon: -1.8904, tz: 'Europe/London', threshold: 27 },
  { id: 'cardiff', name: 'Cardiff', lat: 51.4816, lon: -3.1791, tz: 'Europe/London', threshold: 26 },
  { id: 'manchester', name: 'Manchester', lat: 53.4808, lon: -2.2426, tz: 'Europe/London', threshold: 25 },
  { id: 'belfast', name: 'Belfast', lat: 54.5973, lon: -5.9301, tz: 'Europe/London', threshold: 25 },
  { id: 'edinburgh', name: 'Edinburgh', lat: 55.9533, lon: -3.1883, tz: 'Europe/London', threshold: 25 },
];

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(LOCATIONS[0]);
  const [sortConfig, setSortConfig] = useState({ key: 'year', direction: 'desc' });
  const [activeTab, setActiveTab] = useState('daily');
  
  // By default, select 1976 and the current year (2026)
  const [selectedYears, setSelectedYears] = useState(['1976', '2026']);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const weatherData = await fetchWeatherData(selectedLocation.lat, selectedLocation.lon, selectedLocation.tz);
        setData(weatherData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedLocation]);

  const toggleYear = (year) => {
    setSelectedYears(prev => 
      prev.includes(year)
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const getHeatwaves = (year) => {
    const heatwaves = [];
    let currentStreak = [];
    const HEATWAVE_THRESHOLD = selectedLocation.threshold;
    
    data.forEach((dayData) => {
      if (dayData[year] >= HEATWAVE_THRESHOLD) {
        currentStreak.push(dayData.day);
      } else {
        if (currentStreak.length >= 3) {
          heatwaves.push({ start: currentStreak[0], end: currentStreak[currentStreak.length - 1] });
        }
        currentStreak = [];
      }
    });
    if (currentStreak.length >= 3) {
      heatwaves.push({ start: currentStreak[0], end: currentStreak[currentStreak.length - 1] });
    }
    return heatwaves;
  };

  const getStats = (year) => {
    let tempSum = 0;
    let tempCount = 0;
    let dryDays = 0;
    let currentDrySpell = 0;
    let maxDrySpell = 0;
    let heatwaveDays = 0;
    const threshold = selectedLocation.threshold;
    
    data.forEach(day => {
      const temp = day[year];
      const precip = day[`${year}_precip`];
      
      if (temp !== undefined && temp !== null) {
        tempSum += temp;
        tempCount++;
        if (temp >= threshold) heatwaveDays++;
      }
      
      if (precip !== undefined && precip !== null) {
        if (precip === 0) {
          dryDays++;
          currentDrySpell++;
          if (currentDrySpell > maxDrySpell) maxDrySpell = currentDrySpell;
        } else {
          currentDrySpell = 0;
        }
      }
    });
    
    const avgTemp = tempCount > 0 ? (tempSum / tempCount).toFixed(1) : 0;
    return { avgTemp, dryDays, maxDrySpell, heatwaveDays, tempCount };
  };

  const trendData = useMemo(() => {
    return YEARS.map(year => ({ year, ...getStats(year) })).filter(s => s.tempCount > 0);
  }, [data, selectedLocation]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStats = useMemo(() => {
    const statsArray = [...trendData];
    statsArray.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (sortConfig.key === 'avgTemp') {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return statsArray;
  }, [trendData, sortConfig]);

  const renderTrendChart = (dataKey, color, domain = [0, 'auto'], unit = '') => {
    const validData = trendData.filter(d => d[dataKey] !== undefined && !isNaN(d[dataKey]));
    const avg = validData.length > 0 
      ? validData.reduce((sum, item) => sum + Number(item[dataKey]), 0) / validData.length 
      : 0;
    const avgFormatted = Number.isInteger(avg) && dataKey !== 'avgTemp' ? Math.round(avg) : Number(avg.toFixed(1));

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis dataKey="year" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
            <YAxis tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} domain={domain} unit={unit} />
            <Tooltip 
              cursor={{fill: 'var(--bg-color)'}}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
              labelStyle={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}
            />
            <ReferenceLine 
              y={avgFormatted} 
              stroke="var(--text-secondary)" 
              strokeDasharray="4 4" 
              label={{ position: 'top', value: `Avg: ${avgFormatted}${unit}`, fill: 'var(--text-secondary)', fontSize: 12 }} 
            />
            <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading historical weather data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div style={{color: 'red', textAlign: 'center', padding: '2rem'}}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">Some Like It Hot</h1>
        
        <div className="location-picker">
          {LOCATIONS.map(loc => (
            <button 
              key={loc.id} 
              className={`location-tab ${selectedLocation.id === loc.id ? 'active' : ''}`}
              onClick={() => setSelectedLocation(loc)}
            >
              {loc.name}
            </button>
          ))}
        </div>

        <p className="app-subtitle">Daily High Temperatures ({selectedLocation.name})</p>
        <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>
          * Highlighted vertical bands indicate a heatwave (3+ consecutive days ≥ {selectedLocation.threshold}°C)
        </p>

        <div className="tabs-container">
          <button className={`tab ${activeTab === 'daily' ? 'active' : ''}`} onClick={() => setActiveTab('daily')}>Daily View</button>
          <button className={`tab ${activeTab === 'avgTemp' ? 'active' : ''}`} onClick={() => setActiveTab('avgTemp')}>Avg Temp Trend</button>
          <button className={`tab ${activeTab === 'heatwaves' ? 'active' : ''}`} onClick={() => setActiveTab('heatwaves')}>Heatwaves Trend</button>
          <button className={`tab ${activeTab === 'dryDays' ? 'active' : ''}`} onClick={() => setActiveTab('dryDays')}>Dry Days Trend</button>
        </div>
      </header>

      {activeTab === 'daily' && (
        <>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis 
                  dataKey="day" 
                  tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                />
                <YAxis 
                  tick={{fill: 'var(--text-secondary)', fontSize: 12}}
                  axisLine={false}
                  tickLine={false}
                  unit="°C"
                  domain={['dataMin - 5', 'dataMax + 2']}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                {YEARS.map(year => {
                  if (!selectedYears.includes(year)) return null;
                  const heatwaves = getHeatwaves(year);
                  return heatwaves.map((wave, i) => (
                    <ReferenceArea
                      key={`hw-${year}-${i}`}
                      x1={wave.start}
                      x2={wave.end}
                      fill={COLORS[year]}
                      fillOpacity={0.15}
                      strokeOpacity={0}
                      ifOverflow="hidden"
                    />
                  ));
                })}

                {YEARS.map(year => (
                  selectedYears.includes(year) && (
                    <Area
                      key={year}
                      type="monotone"
                      dataKey={year}
                      stroke={COLORS[year]}
                      fill={COLORS[year]}
                      fillOpacity={0.4}
                      strokeWidth={year === '1976' ? 3 : 2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  )
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-container">
            {selectedYears.map(year => {
              const stats = trendData.find(s => s.year === year);
              if (!stats || stats.tempCount === 0) return null;
              
              return (
                <div key={`stats-${year}`} className="stat-card" style={{ borderTop: `4px solid ${COLORS[year]}` }}>
                  <h3 className="stat-title">{year} Season</h3>
                  <div className="stat-grid">
                    <div className="stat-item">
                      <span className="stat-label">Avg Max Temp</span>
                      <span className="stat-value">{stats.avgTemp}°C</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Heatwave Days</span>
                      <span className="stat-value">{stats.heatwaveDays}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Dry Days</span>
                      <span className="stat-value">{stats.dryDays}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Longest Dry Spell</span>
                      <span className="stat-value">{stats.maxDrySpell} days</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="controls-container">
            {YEARS.map(year => {
              const isActive = selectedYears.includes(year);
              return (
                <button
                  key={year}
                  className={`year-toggle ${isActive ? 'active' : ''}`}
                  onClick={() => toggleYear(year)}
                  style={isActive ? {
                    backgroundColor: COLORS[year],
                    borderColor: COLORS[year],
                    color: 'white'
                  } : {}}
                >
                  {year}
                </button>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'avgTemp' && renderTrendChart('avgTemp', 'var(--chart-2016)', ['dataMin - 1', 'dataMax + 1'], '°C')}
      {activeTab === 'heatwaves' && renderTrendChart('heatwaveDays', 'var(--chart-1976)')}
      {activeTab === 'dryDays' && renderTrendChart('dryDays', 'var(--chart-2019)')}

      <div className="table-container">
        <h2 className="table-title">Historical Season Rankings</h2>
        <div className="table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('year')}>Year {sortConfig.key === 'year' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('avgTemp')}>Avg Max Temp {sortConfig.key === 'avgTemp' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('heatwaveDays')}>Heatwave Days {sortConfig.key === 'heatwaveDays' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('dryDays')}>Dry Days {sortConfig.key === 'dryDays' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('maxDrySpell')}>Longest Dry Spell {sortConfig.key === 'maxDrySpell' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map(stat => (
                <tr key={`table-${stat.year}`}>
                  <td style={{fontWeight: 600, color: COLORS[stat.year]}}>{stat.year}</td>
                  <td>{stat.avgTemp}°C</td>
                  <td>{stat.heatwaveDays}</td>
                  <td>{stat.dryDays}</td>
                  <td>{stat.maxDrySpell} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
