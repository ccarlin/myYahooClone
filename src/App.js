import React, { useState, useEffect } from 'react';
import './MyYahoo.css';

const App = () => {  
  const [stockInfo, setStockInfo] = useState([]);
  const [newsFeeds, setNewsFeeds] = useState([]);
  const [sportsFeeds, setSportsFeeds] = useState([]);
  const [weatherInfo, setWeatherInfo] = useState([]);
  const [timestamps, setTimestamps] = useState({
    stock: '',
    news: '',
    sports: '',
    weather: '',
  });

  const [visibleTables, setVisibleTables] = useState({}); // State to track table visibility
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light'); // Load theme from localStorage

  // Initialize visibility state for all tables
  const initializeVisibility = (data, prefix) => {
    const visibility = {};
    data.forEach((_, index) => {
      visibility[`${prefix}-${index}`] = true; // Set all tables to visible
    });
    return visibility;
  };

  // Toggle table visibility
  const toggleTable = (key) => {
    setVisibleTables((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.body.className = theme; // Apply theme to the body
  }, [theme]);

  let sportsTimer = null; // Variable to store the timer ID
  let stockTimer = null; // Variable to store the timer ID
  let newsTimer = null; // Variable to store the timer ID
  let weatherTimer = null; // Variable to store the timer ID
  
  const updateSportsData = () => {
      // Clear any existing timer
    if (sportsTimer) 
      clearTimeout(sportsTimer);
    
    const now = new Date();
  
    // Fetch sports data
    fetchData('/myYahoo/sportsUpdate', setSportsFeeds, 'sports', 'sports');
    
    if (now.getHours() < 19) 
      sportsTimer = setTimeout(updateSportsData, 3600000);
    else
    sportsTimer = setTimeout(updateSportsData, 600000);
  };

  const updateStockData = () => {
    if (stockTimer)
      clearTimeout(stockTimer);
    const now = new Date();
    
    // Fetch stock data
    fetchData('/myYahoo/stockUpdate', setStockInfo, 'stock', 'stock');

    // Determine the next timeout duration
    if (now.getHours() < 9 || now.getHours() > 15) 
      stockTimer = setTimeout(updateStockData, 3600000);
    else
      stockTimer = setTimeout(updateStockData, 600000);
  };     
  
  const updateNewsData = () => {
    if (newsTimer)
      clearTimeout(newsTimer);
    const now = new Date();
    
    // Fetch news data
    fetchData('/myYahoo/newsUpdate', setNewsFeeds, 'news', 'news');

    // Determine the next timeout duration
    if (now.getHours() < 7 || now.getHours() > 20) 
      newsTimer = setTimeout(updateNewsData, 3600000);
    else
      newsTimer = setTimeout(updateNewsData, 1800000);
  };   
  
  const updateWeatherData = () => {
    if (weatherTimer)
      clearTimeout(weatherTimer);
    const now = new Date();
    
    // Fetch news data
    fetchData('/myYahoo/weatherUpdate', setWeatherInfo, 'weather', 'weather');

    // Determine the next timeout duration
    if (now.getHours() < 7 || now.getHours() > 20) 
      weatherTimer = setTimeout(updateWeatherData, 3600000);
    else
      weatherTimer = setTimeout(updateWeatherData, 900000);
  };  

  // Fetch data for each section
  const fetchData = async (endpoint, setState, timestampKey, prefix) => {
    try {
      // Append debug=true as a query parameter
      const url = `http://localhost:5000${endpoint}`;

      const response = await fetch(url, { method: 'POST' });
      const data = await response.json();
      setState(data);

      // Initialize visibility for the fetched data
      setVisibleTables((prev) => ({
        ...prev,
        ...initializeVisibility(data, prefix),
      }));

      setTimestamps((prev) => ({
        ...prev,
        [timestampKey]: new Date().toLocaleString(),
      }));
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
    }
  };

  useEffect(() => {
    updateStockData();
    updateNewsData();
    updateSportsData();
    updateWeatherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <button className="theme-toggle" onClick={toggleTheme}>
        Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
      </button>
      <table style={{ width: '100%' }}>
        <tr>
          <td valign="top" width="30%" rowSpan="2">
            <h2>
              Stock Information - <span className="small-text">{timestamps.stock}</span>
              <button className="myMiniButton" onClick={() => fetchData('/myYahoo/stockUpdate', setStockInfo, 'stock', 'stock')}>Update Stocks</button>
            </h2>
            {buildStockTables(stockInfo, toggleTable, visibleTables)}
          </td>
          <td valign="top" width="35%" style={{ paddingLeft: '10px' }} rowSpan="2">
            <h2>
              News Feed - <span className="small-text">{timestamps.news}</span>
              <button className="myMiniButton" onClick={() => fetchData('/myYahoo/newsUpdate', setNewsFeeds, 'news', 'news')}>Update News</button>
            </h2>
            {buildNewsTables(newsFeeds, toggleTable, visibleTables)}
          </td>
          <td valign="top" width="35%" style={{ paddingLeft: '10px' }}>
            <h2>
              Sports Feed - <span className="small-text">{timestamps.sports}</span>
              <button className="myMiniButton" onClick={() => fetchData('/myYahoo/sportsUpdate', setSportsFeeds, 'sports', 'sports')}>Update Sports</button>
            </h2>
            {buildSportsTables(sportsFeeds, toggleTable, visibleTables)}
            <h2>
              Weather Information - <span className="small-text">{timestamps.weather}</span>
              <button className="myMiniButton" onClick={() => fetchData('/myYahoo/weatherUpdate', setWeatherInfo, 'weather', 'weather')}>Update Weather</button>
            </h2>
            {buildWeatherTables(weatherInfo, toggleTable, visibleTables)}
          </td>
        </tr>
      </table>
    </div>
  );
};  

// Updated helper functions
const buildStockTables = (stockInfo, toggleTable, visibleTables) => {
  return stockInfo.map((portfolio, index) => (
    <div key={index}>
      <div className="data-header" onClick={() => toggleTable(`stock-${index}`)}>
        {portfolio.name}
      </div>
      {visibleTables[`stock-${index}`] && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Symbol</th>
              <th>Price</th>
              <th>Change</th>
              <th>Change %</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.portfolioData.map((stock, idx) => (
              <tr key={idx} className={getRowClass(stock.change)}>
                <td>
                  <a href={`https://finance.yahoo.com/quote/${stock.symbol}/`} target="_blank" rel="noopener noreferrer">
                    {stock.name}
                  </a>
                </td>
                <td>{stock.symbol}</td>
                <td>{formatCurrency(stock.price)}</td>
                <td>{formatCurrency(stock.change || 0)}</td>
                <td>{stock.changePercent !== undefined ? stock.changePercent.toFixed(2) + '%' : 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ));
};

const buildNewsTables = (newsFeeds, toggleTable, visibleTables) => {
  return newsFeeds.map((feed, index) => (
    <div key={index}>
      <div className="data-header" onClick={() => toggleTable(`news-${index}`)}>
        {feed.name}
      </div>
      {visibleTables[`news-${index}`] && (
        <table className="data-table">
          <tbody>
            {feed.items.map((item, idx) => (
              <tr key={idx}>
                <td>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ));
};

const buildSportsTables = (sportsFeeds, toggleTable, visibleTables) => {
  return sportsFeeds
    .filter(
      (sport) =>
        sport.sportData && // Ensure sportData exists
        sport.sportData.some((data) => data.items && data.items.length > 0) // Filter out sports with no items
    )
    .map((sport, index) => (
      <div key={index}>
        <div className="data-header" onClick={() => toggleTable(`sports-${index}`)}>
          {sport.name}
        </div>
        {visibleTables[`sports-${index}`] && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date/Event</th>
                <th>Home</th>
                <th>Away</th>
                <th>Status</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {sport.sportData.map((data, dataIndex) =>
                data.items.map((item, itemIndex) => (
                  <tr key={`${dataIndex}-${itemIndex}`} className={getRowClass(item.result)}>
                    <td>
                      {item.date} /{' '}
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    </td>
                    <td>
                      <img src={item.home_logo} alt="Home Logo" width="42" /> {item.home_score}
                    </td>
                    <td>
                      <img src={item.away_logo} alt="Away Logo" width="42" /> {item.away_score}
                    </td>
                    <td>
                      {item.box_score ? (
                        <a href={item.box_score} target="_blank" rel="noopener noreferrer">
                          {item.status}
                        </a>
                      ) : (
                        item.status
                      )}
                    </td>
                    <td>
                      {item.recap ? (
                        <a href={item.recap} target="_blank" rel="noopener noreferrer">
                          {item.result}
                        </a>
                      ) : (
                        item.result
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    ));
};

const buildWeatherTables = (weatherInfo, toggleTable, visibleTables) => {
  return weatherInfo.map((area, index) => (
    <div key={index}>
      <div className="data-header" onClick={() => toggleTable(`weather-${index}`)}>
        {area.name} - {buildDisplay(area.weatherData.current)}
      </div>
      {visibleTables[`weather-${index}`] && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Forecast</th>
              <th>Temp Range</th>
              <th>Wind</th>
              <th>Precipitation</th>
              <th>Sunshine</th>
            </tr>
          </thead>
          <tbody>
            {area.weatherData.daily.time.map((time, idx) => (
              <tr key={idx}>
                <td>{new Date(time).toLocaleDateString()}</td>
                <td>{area.weatherData.daily.weatherCode[idx]}</td>
                <td>
                  {Math.round(area.weatherData.daily.tempMax[idx])}°/{Math.round(area.weatherData.daily.tempMin[idx])}°
                </td>
                <td>
                  {degreesToCompass(area.weatherData.daily.windDirection[idx])} {Math.round(area.weatherData.daily.windSpeed[idx])} MPH
                </td>
                <td>{area.weatherData.daily.precipitation[idx]}%</td>
                <td>{formatSeconds(area.weatherData.daily.sun[idx])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ));
};

// Helper functions
const getRowClass = (value) => {
  if (value > 0) return 'row-positive';
  if (value < 0) return 'row-negative';
  return 'row-neutral';
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

const degreesToCompass = (degrees) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

const formatSeconds = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;
};

const buildDisplay = (area) => {
    let display = `${area.weatherCode} ${Math.round(area.temp)}° Feels like: ${Math.round(area.feelsLike)}°`;
    display += ` Humidity: ${area.humidty}%`
    if (area.windSpeed > 9)
        display += `, ${degreesToCompass(area.windDirection)} ${Math.round(area.windSpeed)}MPH`;
    return display;
}

export default App;