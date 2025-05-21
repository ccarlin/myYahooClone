export const getRowClass = (value) => {
  let rowClass = 'row-neutral';
  if (value === "Win")
    rowClass = 'row-positive';
  else if (value === "Loss")
    rowClass = 'row-negative';
  return rowClass;
};

export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export const degreesToCompass = (degrees) => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const formatSeconds = (totalSeconds) => {
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

export const buildDisplay = (area) => {
    let display = `${area.weatherCode} ${Math.round(area.temp)}° Feels like: ${Math.round(area.feelsLike)}°`;
    display += ` Humidity: ${area.humidty}%`
    if (area.windSpeed > 9)
        display += `, ${degreesToCompass(area.windDirection)} ${Math.round(area.windSpeed)}MPH`;
    return display;
};

export const updateCollapsedState = async (section, name, collapsed) => {
  try {
    const url = 'http://localhost:5000/updateCollapsedState';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section, name, collapsed: !collapsed }),
    });
    const result = await response.json();
    if (!result.success) {
      alert(result.message);
    }
  } catch (error) {
    alert('An error occurred while updating the collapsed state.');
  }
};

export function toggleTableData(header, name, category) {
  const table = header.closest('table');
  const alltr = table.querySelectorAll("tr");
  const isCollapsed = alltr[1].style.display === "none" ? true : false; 
  for (var i = 1; i < alltr.length; i++) {
      alltr[i].style.display = (alltr[i].style.display === "none") ? "" : "none";
  }
  
  updateCollapsedState("NewsFeeds", category + ":" + name, isCollapsed); // Update the collapsed state in the database            
}
