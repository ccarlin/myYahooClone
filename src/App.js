import React, { useState, useEffect } from 'react';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MyYahoo.css';
import $ from 'jquery';

const fetchData = async (endpoint, setState, timestampKey, prefix, setVisibleTables, setTimestamps) => {
  try {
    const url = `http://localhost:5000${endpoint}`;
    const response = await fetch(url, { method: 'POST' });
    const data = await response.json();
    setState(data);

    // Initialize visibility for the fetched data
    const initializeVisibility = (data, prefix) => {
      const visibility = {};
      data.forEach((_, index) => {
        visibility[`${prefix}-${index}`] = true; // Set all tables to visible
      });
      return visibility;
    };

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
  const [collapsedCategories, setCollapsedCategories] = useState({}); // Move state here
  const [showTrashIcons, setShowTrashIcons] = useState(true); // State to toggle trash icons

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

  const toggleCategory = (categoryIndex) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryIndex]: !prev[categoryIndex],
    }));
  };

  useEffect(() => {
    document.body.className = theme; // Apply theme to the body
  }, [theme]);

  const updateStockData = () => {
    fetchData('/stockUpdate', setStockInfo, 'stock', 'stock', setVisibleTables, setTimestamps);
  };

  const updateNewsData = () => {
    fetchData('/newsUpdate', setNewsFeeds, 'news', 'news', setVisibleTables, setTimestamps);
  };

  const updateSportsData = () => {
    fetchData('/sportsUpdate', setSportsFeeds, 'sports', 'sports', setVisibleTables, setTimestamps);
  };

  const updateWeatherData = () => {
    fetchData('/weatherUpdate', setWeatherInfo, 'weather', 'weather', setVisibleTables, setTimestamps);
  };

  useEffect(() => {
    updateStockData();
    updateNewsData();
    updateSportsData();
    updateWeatherData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Initialize visibility for news feeds
    const initializeNewsVisibility = () => {
      const visibility = {};
      newsFeeds.forEach((category, categoryIndex) => {
        category.feeds.forEach((feed, feedIndex) => {
          visibility[`news-${categoryIndex}-${feedIndex}`] = true; // Set all news tables to visible
        });
      });
      return visibility;
    };

    setVisibleTables((prev) => ({
      ...prev,
      ...initializeNewsVisibility(),
    }));
  }, [newsFeeds]);

  useEffect(() => {
    // Initialize Bootstrap modals
    const bootstrap = require('bootstrap/dist/js/bootstrap.bundle.min.js');
    const modalElements = document.querySelectorAll('.modal');
    modalElements.forEach((modal) => {
      new bootstrap.Modal(modal);
    });
  }, []);

  return (
    <div>
      <table style={{ width: '100%' }}>
        <tr>
          <td valign="top" width="30%" rowSpan="2">
            <h2>
              Stock Information - <span className="small-text">{timestamps.stock}</span>
              <img src="refresh.png" alt="Refresh" className="refresh-icon"
                onClick={() => fetchData('/stockUpdate', setStockInfo, 'stock', 'stock', setVisibleTables, setTimestamps)}
              />
              <img src="config.png" title="Configure Stocks" data-bs-toggle="modal" data-bs-target="#manage-stocks" 
                width="20px" className="img-link" alt="Manage Stocks" 
              />
            </h2>
            {buildStockTables(stockInfo, toggleTable, visibleTables, setStockInfo, showTrashIcons, setVisibleTables, setTimestamps)}
          </td>
          <td valign="top" width="35%" style={{ paddingLeft: '10px' }} rowSpan="2">
            <h2>
              News Feed - <span className="small-text">{timestamps.news}</span>
              <img src="refresh.png" alt="Refresh" className="refresh-icon" 
                onClick={() => fetchData('/newsUpdate', setNewsFeeds, 'news', 'news', setVisibleTables, setTimestamps)}
              />
              <img src="config.png" title="Configure Feeds" data-bs-toggle="modal" data-bs-target="#manage-rss" 
                width="20px" className="img-link" alt="Manage Feeds" 
              />
            </h2>
            {buildNewsTables(newsFeeds, toggleTable, visibleTables, collapsedCategories, toggleCategory, fetchData, setNewsFeeds, showTrashIcons, setVisibleTables, setTimestamps)}
          </td>
          <td valign="top" width="35%" style={{ paddingLeft: '10px' }}>
            <h2>
              Sports - <span className="small-text">{timestamps.sports}</span>
              <img src="refresh.png" alt="Refresh" className="refresh-icon"
                onClick={() => fetchData('/sportsUpdate', setSportsFeeds, 'sports', 'sports', setVisibleTables, setTimestamps)}
              />
              <img src="config.png" title="Configure Sports" data-bs-toggle="modal" data-bs-target="#manage-sports" 
                width="20px" className="img-link" alt="Manage Sports" 
              />
              <button className="theme-toggle" onClick={toggleTheme}>
                Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
              </button>
              <button className="theme-toggle" onClick={() => setShowTrashIcons((prev) => !prev)}>
                {showTrashIcons ? 'Hide Trash Icons' : 'Show Trash Icons'}
              </button>
            </h2>        
            {buildSportsTables(sportsFeeds, toggleTable, visibleTables)}
            <h2>
              Weather Information - <span className="small-text">{timestamps.weather}</span>
              <img src="refresh.png" alt="Refresh" className="refresh-icon"
                onClick={() => fetchData('/weatherUpdate', setWeatherInfo, 'weather', 'weather', setVisibleTables, setTimestamps)}
              />
              <img src="config.png" title="Configure Weather" data-bs-toggle="modal" data-bs-target="#manage-weather" 
                width="20px" className="img-link" alt="Manage Weather" />
            </h2>
            {buildWeatherTables(weatherInfo, toggleTable, visibleTables, setWeatherInfo, showTrashIcons, setVisibleTables, setTimestamps)}
          </td>
        </tr>
      </table>

      {/* Modals */}
      <div id="manage-stocks" className="modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Stocks/Portfolios</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form id="add-stock-form">
                <div className="mb-3">
                  <label htmlFor="portfolio-name" className="form-label">Portfolio Name</label>
                  <input id="portfolio-name" className="form-control" type="text" placeholder="Enter Portfolio name" />
                </div>
                <div className="mb-3">
                  <label htmlFor="stock-symbol" className="form-label">Stock Symbols (comma separated)</label>
                  <input id="stock-symbol" className="form-control" type="text" placeholder="Enter Stock Symbols (e.g., AAPL,GOOGL)" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" onClick={() => addStock(setVisibleTables, setTimestamps)}>Add Stock</button>
            </div>
          </div>
        </div>
      </div>

      <div id="manage-sports" className="modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Manage Sports Teams</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form id="manage-sports-form">
                <div className="mb-3">
                  <label htmlFor="league-selector" className="form-label">Select League</label>
                  <select id="league-selector" className="form-select" onChange={() => fetchTeamsForLeague()}>
                    <option value="" disabled selected>-- Select a League --</option>
                    <option value="NBA">NBA</option>
                    <option value="NHL">NHL</option>
                    <option value="MLB">MLB</option>
                    <option value="NFL">NFL</option>
                  </select>
                </div>
                <div id="team-list-container" className="row">
                  <p>Select a league to view its teams.</p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" onClick={() => saveSelectedTeams(setVisibleTables, setTimestamps, setSportsFeeds)}>Save changes</button>
            </div>
          </div>
        </div>
      </div>

      <div id="manage-rss" className="modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add RSS Feeds</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form id="add-rss-feed-form">
                <div className="mb-3">
                  <label htmlFor="rss-category" className="form-label">Category</label>
                  <input id="rss-category" className="form-control" type="text" placeholder="Enter category name" />
                </div>
                <div className="mb-3">
                  <label htmlFor="rss-name" className="form-label">RSS Feed Name</label>
                  <input id="rss-name" className="form-control" type="text" placeholder="Enter RSS feed name" />
                </div>
                <div className="mb-3">
                  <label htmlFor="rss-url" className="form-label">RSS Feed URL</label>
                  <input id="rss-url" className="form-control" type="text" placeholder="Enter RSS feed URL" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" className="btn btn-primary" onClick={() => addRSSFeed(setVisibleTables, setTimestamps, setNewsFeeds)}>Add Feed</button>
            </div>
          </div>
        </div>
      </div>

      <div id="manage-weather" className="modal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Add Weather Locations</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form id="add-weather-location-form">
                <div className="mb-3 d-flex align-items-center">
                  <label htmlFor="weather-location" className="form-label me-2">Location</label>
                  <input
                    id="weather-location"
                    className="form-control"
                    type="text"
                    placeholder="Enter city or zip"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary ms-2"
                    onClick={() => getLocations()}
                  >
                    Lookup Location
                  </button>
                </div>
                <div id="location-result">
                  <p>Search for a location first in order to add one!</p>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => addWeatherLocation(setWeatherInfo, setVisibleTables, setTimestamps)}               
              >
                Add Location
              </button>
            </div>
          </div>
        </div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
};  

// Updated helper functions
const buildStockTables = (stockInfo, toggleTable, visibleTables, setStockInfo, showTrashIcons, setVisibleTables, setTimestamps) => {
  const removeStock = async (portfolioName, stockSymbol, setVisibleTables, setTimestamps) => {
    try {
      const url = 'http://localhost:5000/removeStock';
      const response = await fetch(url, {      
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioName, stockSymbol })
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        // Refresh the stock data after deletion
        fetchData('/stockUpdate', setStockInfo, 'stock', 'stock', setVisibleTables, setTimestamps);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error removing stock:', error);
      alert('An error occurred while removing the stock.');
    }
  };

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
              <th></th>
            </tr>
          </thead>
          <tbody>
            {portfolio.portfolioData.map((stock, idx) => (
              <tr key={idx} className={getRowClass(stock.change)}>
                <td>
                  <a
                    href={`https://finance.yahoo.com/quote/${stock.symbol}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {stock.name}
                  </a>
                </td>
                <td>{stock.symbol}</td>
                <td>{formatCurrency(stock.price)}</td>
                <td>{formatCurrency(stock.change || 0)}</td>
                <td>{stock.changePercent !== undefined ? stock.changePercent.toFixed(2) + '%' : 'N/A'}</td>
                <td>
                  <span
                    className="trash-icon"
                    onClick={() => removeStock(portfolio.name, stock.symbol, setVisibleTables, setTimestamps)}
                    style={{
                      cursor: 'pointer',
                      color: 'red',
                      display: showTrashIcons ? 'inline' : 'none', 
                    }}
                    title="Remove Stock"
                  >
                    🗑️
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  ));
};

const buildNewsTables = (newsFeeds, toggleTable, visibleTables, collapsedCategories, toggleCategory, fetchData, setNewsFeeds, showTrashIcons, setVisibleTables, setTimestamps) => {
  const removeRSSFeed = async (categoryName, feedName) => {
    try {
      const url = 'http://localhost:5000/removeRSSFeed';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryName, feedName })
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        // Refresh the news feeds after deletion
        fetchData('/newsUpdate', setNewsFeeds, 'news', 'news', setVisibleTables, setTimestamps);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error removing RSS feed:', error);
      alert('An error occurred while removing the RSS feed.');
    }
  };

  return newsFeeds.map((category, categoryIndex) => (
    <div key={categoryIndex}>
      {/* Category Header */}
      <h3
        className="data-header"
        onClick={() => toggleCategory(categoryIndex)}
        style={{ cursor: 'pointer' }}
      >
        {category.category}
      </h3>

      {/* Category Content */}
      {!collapsedCategories[categoryIndex] &&
        category.feeds.map((feed, feedIndex) => (
          <div key={feedIndex}>
            {/* Feed Table */}
            <table className="data-table">
              <thead>
                <tr className="data-header">
                  <th
                    colSpan="1"
                    onClick={() => toggleTable(`news-${categoryIndex}-${feedIndex}`)}
                    style={{ cursor: 'pointer', textAlign: 'left', position: 'relative' }}
                  >
                    {feed.name}
                    <span
                      className="trash-icon"
                      onClick={() => removeRSSFeed(category.category, feed.name)}
                      style={{
                        cursor: 'pointer',
                        color: 'red',
                        display: showTrashIcons ? 'inline' : 'none', 
                        position: 'absolute',
                        right: '10px'
                      }}
                      title="Remove RSS Feed"
                    >
                      🗑️
                    </span>
                  </th>
                </tr>
              </thead>
              {visibleTables[`news-${categoryIndex}-${feedIndex}`] && (
                <tbody>
                  {feed.feedData.items.map((item, itemIndex) => (
                    <tr key={item.guid || itemIndex}>
                      <td colSpan="2">
                        <a href={item.link} target="_blank" rel="noopener noreferrer">
                          {item.title}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        ))}
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
                    <td style={{ fontSize: '28px' }} width="112px">
                      <img src={item.home_logo} alt="Home Logo" width="42" /> {item.home_score}
                    </td>
                    <td style={{ fontSize: '28px' }} width="112px">
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

const buildWeatherTables = (weatherInfo, toggleTable, visibleTables, setWeatherInfo, showTrashIcons, setVisibleTables, setTimestamps) => {
  const removeWeatherLocation = async (locationName) => {
    try {
      const url = 'http://localhost:5000/removeWeatherLocation';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName })
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        // Refresh the weather data after deletion
        fetchData('/weatherUpdate', setWeatherInfo, 'weather', 'weather', setVisibleTables, setTimestamps);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Error removing weather location:', error);
      alert('An error occurred while removing the weather location.');
    }
  };

  return weatherInfo.map((area, index) => (
    <div key={index}>
      <div className="data-header">
        <span onClick={() => toggleTable(`weather-${index}`)} style={{ cursor: 'pointer' }}>
          {area.name} - {buildDisplay(area.weatherData.current)}
        </span>
        <span
          className="trash-icon ms-2"
          onClick={() => removeWeatherLocation(area.name)}
          style={{
            cursor: 'pointer',
            color: 'red',
            display: showTrashIcons ? 'inline' : 'none', 
            position: 'absolute',
            right: '10px'
          }}
          title="Remove Weather Location"
        >
          🗑️
        </span>
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
                  {Math.round(area.weatherData.daily.tempMax[idx])}°/
                  {Math.round(area.weatherData.daily.tempMin[idx])}°
                </td>
                <td>
                  {degreesToCompass(area.weatherData.daily.windDirection[idx])}{' '}
                  {Math.round(area.weatherData.daily.windSpeed[idx])} MPH
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

  let rowClass = 'row-neutral';
  if (value === "Win")
    rowClass = 'row-positive';
  else if (value === "Loss")
    rowClass = 'row-negative';

  return rowClass;
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
  totalSeconds = Math.round(totalSeconds);

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  if (hours > 0) {
      return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  } else {
      return `${formattedMinutes}:${formattedSeconds}`;
  }
};

const buildDisplay = (area) => {
    let display = `${area.weatherCode} ${Math.round(area.temp)}° Feels like: ${Math.round(area.feelsLike)}°`;
    display += ` Humidity: ${area.humidty}%`
    if (area.windSpeed > 9)
        display += `, ${degreesToCompass(area.windDirection)} ${Math.round(area.windSpeed)}MPH`;
    return display;
}

const addStock = async (setVisibleTables, setTimestamps) => {
  const portfolioName = document.getElementById('portfolio-name').value.trim();
  const stockSymbol = document.getElementById('stock-symbol').value.trim();
  const setStockInfo = (data) => console.log('setStockInfo is not defined in this scope. Replace this with actual implementation.');

  if (!portfolioName || !stockSymbol) {
    alert('Please enter both a portfolio name and stock symbols.');
    return;
  }

  try {
    const url = 'http://localhost:5000/addStock';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify({ portfolioName, stockSymbol })
    });

    const result = await response.json();
    if (result.success) {
      alert(result.message);
      // Refresh the stock data after adding
      fetchData('/stockUpdate', setStockInfo, 'stock', 'stock', setVisibleTables, setTimestamps);

      // Close the modal
      const modalElement = document.getElementById('manage-stocks');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance.hide();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error adding stock:', error);
    alert('An error occurred while adding the stock.');
  }
};

const addRSSFeed = async (setVisibleTables, setTimestamps, setNewsFeeds) => {
  const category = document.getElementById('rss-category').value.trim();
  const name = document.getElementById('rss-name').value.trim();
  const rssUrl = document.getElementById('rss-url').value.trim();

  if (!category || !name || !rssUrl) {
    alert('Please fill out all fields: Category, RSS Feed Name, and RSS Feed URL.');
    return;
  }

  try {
    const url = 'http://localhost:5000/addRSSFeed';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, name, rssUrl })
    });

    const result = await response.json();
    if (result.success) {
      alert(result.message);
      // Refresh the news feeds after adding
      fetchData('/newsUpdate', setNewsFeeds, 'news', 'news', setVisibleTables, setTimestamps);
    
      // Close the modal
      const modalElement = document.getElementById('manage-rss');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance.hide();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error adding RSS feed:', error);
    alert('An error occurred while adding the RSS feed.');
  }
};

const getLocations = async () => {
  const location = document.getElementById('weather-location').value.trim();
  if (!location) {
    alert('Please fill in the location field.');
    return;
  }

  // Clear previous results
  const locationResultElement = document.getElementById('location-result');
  locationResultElement.innerHTML = '';

  try {
    // Call the external REST endpoint
    const url = 'http://localhost:5000/searchLocation';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationName: location })
    });

    const result = await response.json();
    if (result.success) {
      // Populate the location-result field with a list of radio buttons
      const resultList = document.createElement('div');
      resultList.className = 'list-group';

      result.locations.forEach((location, index) => {
        const radioItem = document.createElement('div');
        radioItem.className = 'form-check';

        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'radio';
        input.name = 'locationRadio';
        input.id = `location-${index}`;
        input.value = `${location.name}, ${location.admin1 || ''} | ${location.latitude} | ${location.longitude}`;

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `location-${index}`;
        label.textContent = `${location.name}, ${location.admin1 || ''}, ${location.country} (Lat: ${location.latitude}, Lon: ${location.longitude})`;

        radioItem.appendChild(input);
        radioItem.appendChild(label);
        resultList.appendChild(radioItem);
      });

      locationResultElement.appendChild(resultList);
    } else {
      locationResultElement.textContent = result.message;
    }
  } catch (error) {
    console.error('Error searching for locations:', error);
    locationResultElement.textContent = 'An error occurred while searching for locations.';
  }
};

const addWeatherLocation = async (setWeatherInfo, setVisibleTables, setTimestamps) => {
  // Get the selected location from the radio buttons
  const selectedLocation = document.querySelector('input[name="locationRadio"]:checked');
  if (!selectedLocation) {
    alert('Please select a location to add.');
    return;
  }

  // Extract location details from the selected radio button's value
  const [locationName, latitude, longitude] = selectedLocation.value.split('|').map((value) => value.trim());

  if (!locationName || !latitude || !longitude) {
    alert('Invalid location data. Please try again.');
    return;
  }

  try {
    // Send the location data to the server
    const url = 'http://localhost:5000/addWeatherLocation';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locationName, latitude, longitude }),
    });
    const result = await response.json();

    if (result.success) {
      alert(result.message);
      // Refresh the weather data after adding the location
      fetchData('/weatherUpdate', setWeatherInfo, 'weather', 'weather', setVisibleTables, setTimestamps);

      // Close the modal
      const modalElement = document.getElementById('manage-weather');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance.hide();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error adding weather location:', error);
    alert('An error occurred while adding the weather location.');
  }
};

const fetchTeamsForLeague = async () => {
  const leagueSelector = document.getElementById('league-selector');
  const selectedLeague = leagueSelector.value;

  if (!selectedLeague) {
    alert('Please select a league.');
    return;
  }

  try {
    // Call the server-side getTeamList method
    const url = "http://localhost:5000/getTeamList";
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league: selectedLeague }),
    });
    const responseData = await response.json();

    const teamListContainer = document.getElementById('team-list-container');
    teamListContainer.innerHTML = ''; // Clear previous results

    if (responseData.success) {
      // Create a row container for two-column layout
      var row = document.createElement('div');
      row.className = 'row';

      responseData.teams.forEach((team, index) => {
        // Create a column for each team
        const col = document.createElement('div');
        col.className = 'col-md-6'; // Two columns per row

        const teamItem = document.createElement('div');
        teamItem.className = 'form-check d-flex align-items-center';

        const input = document.createElement('input');
        input.className = 'form-check-input me-2';
        input.type = 'checkbox';
        input.id = `team-${team.id}`;
        input.value = `${team.id}|${team.logo}`;;
        input.checked = team.selected;

        const logo = document.createElement('img');
        logo.src = team.logo; // Use the team logo URL
        logo.alt = `${team.name} Logo`;
        logo.style.width = '30px';
        logo.style.height = '30px';
        logo.className = 'me-2';

        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = `team-${team.id}`;
        label.textContent = team.name;

        // Append elements to the team item
        teamItem.appendChild(input);
        teamItem.appendChild(logo);
        teamItem.appendChild(label);

        // Append the team item to the column
        col.appendChild(teamItem);

        // Append the column to the row
        row.appendChild(col);

        // Add a new row after every two columns
        if ((index + 1) % 2 === 0) {
          teamListContainer.appendChild(row);
          row = document.createElement('div');
          row.className = 'row';
        }
      });

      // Append the last row if it has remaining columns
      if (row.children.length > 0) {
        teamListContainer.appendChild(row);
      }
    } else {
      teamListContainer.textContent = responseData.message;
    }
  } catch (error) {
    console.error('Error fetching teams:', error);
    const teamListContainer = document.getElementById('team-list-container');
    teamListContainer.textContent = `An error occurred while fetching teams. ${error}`;
  }
};

const saveSelectedTeams = async (setVisibleTables, setTimestamps, setSportsFeeds) => {
  const leagueSelector = document.getElementById('league-selector');
  const selectedLeague = leagueSelector.value;

  if (!selectedLeague) {
    alert('Please select a league.');
    return;
  }

  const selectedTeams = [];
  document.querySelectorAll('#team-list-container .form-check-input:checked').forEach(checkbox => {
    const [teamId, teamLogo] = checkbox.value.split('|');
    const teamName = document.querySelector(`label[for="team-${teamId}"]`).textContent.trim();
    selectedTeams.push({ id: teamId, logo: teamLogo, name: teamName });
  });

  if (selectedTeams.length === 0) {
    alert('No teams selected to save.');
    return;
  }

  try {
    const url = 'http://localhost:5000/saveSelectedTeams';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league: selectedLeague, selectedTeams }),
    });
    const result = await response.json();
    if (result.success) {
      alert(result.message);
      fetchData('/sportsUpdate', setSportsFeeds, 'sports', 'sports', setVisibleTables, setTimestamps);
      
      // Close the modal
      const modalElement = document.getElementById('manage-sports');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance.hide();
    } else {
      alert(result.message);
    }
  } catch (error) {
    console.error('Error saving selected teams:', error);
    alert('An error occurred while saving the selected teams.');
  }
};

function updateCollapsedState(section, name, collapsed) {
  const fileName = sessionStorage.getItem('fileName'); // Retrieve the file name from session storage

  $.post('/myYahoo/updateCollapsedState', { section, name, collapsed, fileName }, function (response) {
    if (!response.success) {
      alert(response.message);
    }
  }).fail(function () {
    alert('An error occurred while updating the collapsed state.');
  });
}

export default App;