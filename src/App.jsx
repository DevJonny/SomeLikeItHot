import React, { useState, useEffect, useMemo } from 'react';
import { fetchWeatherData } from './weatherService';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
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

const LOCATIONS = [
  { id: 'london', name: 'London', lat: 51.5072, lon: -0.1276, tz: 'Europe/London', threshold: 28 },
  { id: 'birmingham', name: 'Birmingham', lat: 52.4862, lon: -1.8904, tz: 'Europe/London', threshold: 27 },
  { id: 'cardiff', name: 'Cardiff', lat: 51.4816, lon: -3.1791, tz: 'Europe/London', threshold: 26 },
  { id: 'manchester', name: 'Manchester', lat: 53.4808, lon: -2.2426, tz: 'Europe/London', threshold: 25 },
  { id: 'belfast', name: 'Belfast', lat: 54.5973, lon: -5.9301, tz: 'Europe/London', threshold: 25 },
  { id: 'edinburgh', name: 'Edinburgh', lat: 55.9533, lon: -3.1883, tz: 'Europe/London', threshold: 25 },
];

const DECADE_PERIODS = [
  { id: '1976', label: '1976', type: 'year', years: ['1976'], color: '#ef4444' },
  { id: '1940s', label: '1940s', type: 'decade', years: Array.from({length: 10}, (_, i) => String(1940 + i)), color: '#94a3b8' },
  { id: '1950s', label: '1950s', type: 'decade', years: Array.from({length: 10}, (_, i) => String(1950 + i)), color: '#8b5cf6' },
  { id: '1960s', label: '1960s', type: 'decade', years: Array.from({length: 10}, (_, i) => String(1960 + i)), color: '#3b82f6' },
  { id: '1970s', label: '1970s', type: 'decade', years: Array.from({length: 10}, (_, i) => String(1970 + i)), color: '#0ea5e9' },
  { id: '1980s', label: '1980s', type: 'decade', years: Array.from({length: 10}, (_, i) => String(1980 + i)), color: '#10b981' },
  { id: '1990s', label: '1990s', type: 'decade', years: Array.from({length: 10}, (_, i) => String(1990 + i)), color: '#84cc16' },
  { id: '2000s', label: '2000s', type: 'decade', years: Array.from({length: 10}, (_, i) => String(2000 + i)), color: '#eab308' },
  { id: '2010s', label: '2010s', type: 'decade', years: Array.from({length: 10}, (_, i) => String(2010 + i)), color: '#f97316' },
  { id: '2020s', label: '2020s', type: 'decade', years: ['2020','2021','2022','2023','2024','2025','2026'], color: '#ec4899' },
];

const YEAR_PERIODS = Array.from({length: 87}, (_, i) => {
  const year = String(1940 + i);
  // Color palette cycling through hues to ensure distinct colors for each year
  const hue = (i * 137.5) % 360;
  return {
    id: year,
    label: year,
    type: 'year',
    years: [year],
    color: `hsl(${hue}, 70%, 50%)`
  };
});

function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedLocation, setSelectedLocation] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const locParam = params.get('loc');
    
    if (locParam && locParam.startsWith('custom_')) {
      const parts = locParam.split('_');
      if (parts.length >= 5) {
        return {
          id: locParam,
          name: decodeURIComponent(parts[1]),
          lat: parseFloat(parts[2]),
          lon: parseFloat(parts[3]),
          tz: decodeURIComponent(parts.slice(4).join('_')),
          threshold: 30
        };
      }
    }
    
    return LOCATIONS.find(l => l.id === locParam) || LOCATIONS[0];
  });
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  
  const [sortConfig, setSortConfig] = useState({ key: 'periodId', direction: 'asc' });
  
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'daily';
  });
  
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('mode') || 'decades';
  });
  
  const [selectedPeriods, setSelectedPeriods] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode') || 'decades';
    const periodsParam = params.get('periods');
    if (periodsParam) return periodsParam.split(',');
    return mode === 'decades' ? ['1976', '2020s'] : ['1976', '2026'];
  });

  const PERIODS = viewMode === 'decades' ? DECADE_PERIODS : YEAR_PERIODS;

  // Sync state to URL for deeplinking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('loc', selectedLocation.id);
    params.set('tab', activeTab);
    params.set('mode', viewMode);
    params.set('periods', selectedPeriods.join(','));
    
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [selectedLocation.id, activeTab, viewMode, selectedPeriods]);

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

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'decades') {
      setSelectedPeriods(['1976', '2020s']);
    } else {
      setSelectedPeriods(['1976', '2026']);
    }
  };

  const togglePeriod = (id) => {
    setSelectedPeriods(prev => 
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearchingApi(true);
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=en&format=json`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setIsSearchingApi(false);
    }
  };

  const selectSearchResult = (result) => {
    // We use "_" as a delimiter, so encode parts that might contain underscores (not likely for these fields but safe)
    const customId = `custom_${encodeURIComponent(result.name)}_${result.latitude}_${result.longitude}_${encodeURIComponent(result.timezone)}`;
    
    const newLoc = {
      id: customId,
      name: result.name,
      lat: result.latitude,
      lon: result.longitude,
      tz: result.timezone,
      threshold: 30 // Flat default for global locations
    };
    
    setSelectedLocation(newLoc);
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const chartData = useMemo(() => {
    let globalMin = Infinity;
    let globalMax = -Infinity;
    
    const mappedData = data.map(dayData => {
      const newDay = { day: dayData.day };
      PERIODS.forEach(period => {
        let sum = 0;
        let count = 0;
        period.years.forEach(y => {
          if (dayData[y] !== undefined && dayData[y] !== null) {
            sum += dayData[y];
            count++;
          }
        });
        if (count > 0) {
          const val = Number((sum / count).toFixed(1));
          newDay[period.id] = val;
          if (val < globalMin) globalMin = val;
          if (val > globalMax) globalMax = val;
        }
      });
      return newDay;
    });
    
    return { 
      data: mappedData, 
      min: globalMin !== Infinity ? Math.floor(globalMin) - 5 : 0,
      max: globalMax !== -Infinity ? Math.ceil(globalMax) + 2 : 40
    };
  }, [data, viewMode]);

  const getHeatwavesForChart = (periodId) => {
    const heatwaves = [];
    let currentStreak = [];
    const HEATWAVE_THRESHOLD = selectedLocation.threshold;
    
    chartData.data.forEach((dayData) => {
      if (dayData[periodId] >= HEATWAVE_THRESHOLD) {
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

  const getStatsForYear = (year) => {
    let tempSum = 0; let tempCount = 0;
    let dryDays = 0; let currentDrySpell = 0; let maxDrySpell = 0;
    let heatwaveDays = 0;
    const threshold = selectedLocation.threshold;
    
    data.forEach(day => {
      const temp = day[year];
      const precip = day[`${year}_precip`];
      if (temp != null) {
        tempSum += temp; tempCount++;
        if (temp >= threshold) heatwaveDays++;
      }
      if (precip != null) {
        if (precip === 0) {
          dryDays++; currentDrySpell++;
          if (currentDrySpell > maxDrySpell) maxDrySpell = currentDrySpell;
        } else {
          currentDrySpell = 0;
        }
      }
    });
    return { 
      avgTemp: tempCount > 0 ? (tempSum / tempCount) : null,
      dryDays, maxDrySpell, heatwaveDays, tempCount 
    };
  };

  const trendData = useMemo(() => {
    return PERIODS.map(period => {
      let totalAvgTemp = 0, totalDryDays = 0, totalMaxDrySpell = 0, totalHeatwaves = 0, validYears = 0;
      
      period.years.forEach(year => {
        const stats = getStatsForYear(year);
        if (stats.tempCount > 0) {
          totalAvgTemp += stats.avgTemp;
          totalDryDays += stats.dryDays;
          totalMaxDrySpell += stats.maxDrySpell;
          totalHeatwaves += stats.heatwaveDays;
          validYears++;
        }
      });
      
      if (validYears === 0) return { periodId: period.id, tempCount: 0 };
      
      return {
        periodId: period.id,
        label: period.label,
        color: period.color,
        tempCount: 1,
        avgTemp: Number((totalAvgTemp / validYears).toFixed(1)),
        dryDays: Math.round(totalDryDays / validYears),
        maxDrySpell: Math.round(totalMaxDrySpell / validYears),
        heatwaveDays: Math.round(totalHeatwaves / validYears)
      };
    }).filter(s => s.tempCount > 0);
  }, [data, selectedLocation, viewMode]);

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
      if (sortConfig.key === 'periodId') {
        aVal = a.label;
        bVal = b.label;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return statsArray;
  }, [trendData, sortConfig]);

  const renderTrendChart = (dataKey, domain = [0, 'auto'], unit = '') => {
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
            <XAxis dataKey="label" tick={{fill: 'var(--text-secondary)', fontSize: 12}} axisLine={false} tickLine={false} />
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
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {trendData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading historical weather data (this may take a moment)...</p>
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
              onClick={() => { setSelectedLocation(loc); setIsSearching(false); }}
            >
              {loc.name}
            </button>
          ))}
          {selectedLocation.id.startsWith('custom_') && (
            <button 
              key={selectedLocation.id} 
              className="location-tab active"
            >
              {selectedLocation.name} (Custom)
            </button>
          )}
          <button 
            className={`location-tab search-btn ${isSearching ? 'active' : ''}`}
            onClick={() => setIsSearching(!isSearching)}
          >
            + Search
          </button>
        </div>

        {isSearching && (
          <div className="search-container">
            <form onSubmit={handleSearch} className="search-form">
              <input 
                type="text" 
                placeholder="Search any city globally..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
                autoFocus
              />
              <button type="submit" className="search-submit" disabled={isSearchingApi}>
                {isSearchingApi ? '...' : 'Search'}
              </button>
            </form>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(res => (
                  <button 
                    key={res.id} 
                    className="search-result-item"
                    onClick={() => selectSearchResult(res)}
                  >
                    <span className="res-name">{res.name}</span>
                    <span className="res-detail">{res.admin1 ? `${res.admin1}, ` : ''}{res.country}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="app-subtitle">Daily High Temperatures ({selectedLocation.name})</p>
        <p style={{fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem'}}>
          * Highlighted vertical bands indicate a heatwave (3+ consecutive days ≥ {selectedLocation.threshold}°C)
        </p>

        <div className="view-mode-toggle">
          <button className={viewMode === 'decades' ? 'active' : ''} onClick={() => handleViewModeChange('decades')}>Decades</button>
          <button className={viewMode === 'years' ? 'active' : ''} onClick={() => handleViewModeChange('years')}>Years</button>
        </div>

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
                data={chartData.data}
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
                  domain={[chartData.min, chartData.max]}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                {PERIODS.map(period => {
                  if (!selectedPeriods.includes(period.id)) return null;
                  const heatwaves = getHeatwavesForChart(period.id);
                  return heatwaves.map((wave, i) => (
                    <ReferenceArea
                      key={`hw-${period.id}-${i}`}
                      x1={wave.start}
                      x2={wave.end}
                      fill={period.color}
                      fillOpacity={0.15}
                      strokeOpacity={0}
                      ifOverflow="hidden"
                    />
                  ));
                })}

                {PERIODS.map(period => (
                  selectedPeriods.includes(period.id) && (
                    <Area
                      key={period.id}
                      name={period.label}
                      type="monotone"
                      dataKey={period.id}
                      stroke={period.color}
                      fill={period.color}
                      fillOpacity={0.4}
                      strokeWidth={period.id === '1976' ? 3 : 2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      baseValue={chartData.min}
                    />
                  )
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="stats-container">
            {selectedPeriods.map(periodId => {
              const stats = trendData.find(s => s.periodId === periodId);
              if (!stats || stats.tempCount === 0) return null;
              
              return (
                <div key={`stats-${periodId}`} className="stat-card" style={{ borderTop: `4px solid ${stats.color}` }}>
                  <h3 className="stat-title">{stats.label} {stats.periodId.includes('s') ? 'Average' : 'Season'}</h3>
                  <div className="stat-grid">
                    <div className="stat-item">
                      <span className="stat-label">Avg Max Temp</span>
                      <span className="stat-value">{stats.avgTemp}°C</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Heatwave Days{viewMode === 'decades' ? ' / Yr' : ''}</span>
                      <span className="stat-value">{stats.heatwaveDays}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Dry Days{viewMode === 'decades' ? ' / Yr' : ''}</span>
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

          <div className={`controls-container ${viewMode === 'years' ? 'compact' : ''}`}>
            {PERIODS.map(period => {
              const isActive = selectedPeriods.includes(period.id);
              return (
                <button
                  key={period.id}
                  className={`year-toggle ${isActive ? 'active' : ''}`}
                  onClick={() => togglePeriod(period.id)}
                  style={isActive ? {
                    backgroundColor: period.color,
                    borderColor: period.color,
                    color: 'white'
                  } : {}}
                >
                  {period.label}
                </button>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'avgTemp' && renderTrendChart('avgTemp', ['dataMin - 1', 'dataMax + 1'], '°C')}
      {activeTab === 'heatwaves' && renderTrendChart('heatwaveDays')}
      {activeTab === 'dryDays' && renderTrendChart('dryDays')}

      <div className="table-container">
        <h2 className="table-title">Historical Season Rankings</h2>
        <div className="table-wrapper">
          <table className="stats-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('periodId')}>Period {sortConfig.key === 'periodId' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('avgTemp')}>Avg Max Temp {sortConfig.key === 'avgTemp' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('heatwaveDays')}>Heatwave Days{viewMode === 'decades' ? ' / Yr' : ''} {sortConfig.key === 'heatwaveDays' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('dryDays')}>Dry Days{viewMode === 'decades' ? ' / Yr' : ''} {sortConfig.key === 'dryDays' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
                <th onClick={() => handleSort('maxDrySpell')}>Longest Dry Spell {sortConfig.key === 'maxDrySpell' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}</th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map(stat => (
                <tr key={`table-${stat.periodId}`}>
                  <td style={{fontWeight: 600, color: stat.color}}>{stat.label}</td>
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
