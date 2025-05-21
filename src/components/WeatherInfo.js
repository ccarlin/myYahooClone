import React from 'react';
import { fetchData } from '../api';
import { buildDisplay, degreesToCompass, formatSeconds, updateCollapsedState } from '../utils';

const WeatherInfo = ({ weatherInfo, showTrashIcons, setWeatherInfo, setTimestamps }) => {
  const removeWeatherLocation = async (locationName) => {
    try {
      const url = 'http://localhost:5000/removeWeatherLocation';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName }),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        // Refresh the weather data after deletion
        fetchData('/weatherUpdate', setWeatherInfo, 'weather', 'weather', setTimestamps);
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
        <span
          onClick={() => {
            const tableId = `weather-${index}`;
            const table = document.getElementById(tableId);

            if (table) {
              // Toggle the table's visibility
              const isCollapsed = table.style.display === 'none' ? false : true;
              table.style.display = isCollapsed ? 'none' : 'table';

              // Update the collapsed state in the database
              updateCollapsedState('Weather', area.name, !isCollapsed);
            }
          }}
          style={{ cursor: 'pointer' }}
        >
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
            right: '10px',
          }}
          title="Remove Weather Location"
        >
          🗑️
        </span>
      </div>
      <table
        id={`weather-${index}`}
        className="data-table"
        style={{ display: area.collapsed ? 'none' : 'table' }} // Conditionally hide the table
      >
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
    </div>
  ));
};

export default WeatherInfo;
