import React, { useState, useEffect } from 'react';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MyYahoo.css';
import { fetchData } from './api';
import StockInfo from './components/StockInfo';
import NewsFeed from './components/NewsFeed';
import Sports from './components/Sports';
import WeatherInfo from './components/WeatherInfo';
import ManageStocksModal from './components/ManageStocksModal';
import ManageSportsModal from './components/ManageSportsModal';
import ManageRssModal from './components/ManageRssModal';
import ManageWeatherModal from './components/ManageWeatherModal';

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

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light'); // Load theme from localStorage
  const [showTrashIcons, setShowTrashIcons] = useState(true); // State to toggle trash icons

  // Toggle theme and save to localStorage
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.body.className = theme; // Apply theme to the body
  }, [theme]);

  const updateStockData = () => {
    fetchData('/stockUpdate', setStockInfo, 'stock', 'stock', setTimestamps);
  };

  const updateNewsData = () => {
    fetchData('/newsUpdate', setNewsFeeds, 'news', 'news', setTimestamps);
  };

  const updateSportsData = () => {
    fetchData('/sportsUpdate', setSportsFeeds, 'sports', 'sports', setTimestamps);
  };

  const updateWeatherData = () => {
    fetchData('/weatherUpdate', setWeatherInfo, 'weather', 'weather', setTimestamps);
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
      <table style={{ width: '100%' }}>
        <tr>
          <td valign="top" width="30%" rowSpan="2">
            <h2>
              Stock Information - <span className="small-text">{timestamps.stock}</span>
              <img src="refresh.png" alt="Refresh" className="refresh-icon"
                onClick={() => fetchData('/stockUpdate', setStockInfo, 'stock', 'stock', setTimestamps)}
              />
              <img src="config.png" title="Configure Stocks" data-bs-toggle="modal" data-bs-target="#manage-stocks" 
                width="20px" className="img-link" alt="Manage Stocks" 
              />
            </h2>
            <StockInfo stockInfo={stockInfo} showTrashIcons={showTrashIcons} setStockInfo={setStockInfo} setTimestamps={setTimestamps} />
          </td>
          <td valign="top" width="35%" style={{ paddingLeft: '10px' }} rowSpan="2">
            <h2>
              News Feed - <span className="small-text">{timestamps.news}</span>
              <img src="refresh.png" alt="Refresh" className="refresh-icon" 
                onClick={() => fetchData('/newsUpdate', setNewsFeeds, 'news', 'news', setTimestamps)}
              />
              <img src="config.png" title="Configure Feeds" data-bs-toggle="modal" data-bs-target="#manage-rss" 
                width="20px" className="img-link" alt="Manage Feeds" 
              />
            </h2>
            <NewsFeed newsFeeds={newsFeeds} fetchData={fetchData} setNewsFeeds={setNewsFeeds} showTrashIcons={showTrashIcons} setTimestamps={setTimestamps} />
          </td>
          <td valign="top" width="35%" style={{ paddingLeft: '10px' }}>
            <h2>
              Sports - <span className="small-text">{timestamps.sports}</span>
              <img src="refresh.png" alt="Refresh" className="refresh-icon"
                onClick={() => fetchData('/sportsUpdate', setSportsFeeds, 'sports', 'sports', setTimestamps)}
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
            <Sports sportsFeeds={sportsFeeds} />
            <h2>
              Weather Information - <span className="small-text">{timestamps.weather}</span>
              <img src="refresh.png" alt="Refresh" className="refresh-icon"
                onClick={() => fetchData('/weatherUpdate', setWeatherInfo, 'weather', 'weather', setTimestamps)}
              />
              <img src="config.png" title="Configure Weather" data-bs-toggle="modal" data-bs-target="#manage-weather" 
                width="20px" className="img-link" alt="Manage Weather" />
            </h2>
            <WeatherInfo weatherInfo={weatherInfo} showTrashIcons={showTrashIcons} setWeatherInfo={setWeatherInfo} setTimestamps={setTimestamps} />
          </td>
        </tr>
      </table>

      {/* Modals */}
      {/* Modals */}
      <ManageStocksModal setStockInfo={setStockInfo} setTimestamps={setTimestamps} />
      <ManageSportsModal setSportsFeeds={setSportsFeeds} setTimestamps={setTimestamps} />
      <ManageRssModal setNewsFeeds={setNewsFeeds} setTimestamps={setTimestamps} />
      <ManageWeatherModal setWeatherInfo={setWeatherInfo} setTimestamps={setTimestamps} />
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    </div>
  );
};  

 
export default App;