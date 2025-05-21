import React from 'react';
import { fetchData } from '../api';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';

const ManageWeatherModal = ({ setWeatherInfo, setTimestamps }) => {
  const getLocations = async () => {
    const location = document.getElementById('weather-location').value.trim();
    if (!location) {
      alert('Please fill in the location field.');
      return;
    }

    const international = document.getElementById('weather-international').checked;
    
    // Clear previous results
    const locationResultElement = document.getElementById('location-result');
    locationResultElement.innerHTML = '';

    try {
      // Call the external REST endpoint
      const url = 'http://localhost:5000/searchLocation';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationName: location, international }),
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

  const addWeatherLocation = async () => {
    // Get the selected location from the radio buttons
    const selectedLocation = document.querySelector('input[name="locationRadio"]:checked');
    if (!selectedLocation) {
      alert('Please select a location to add.');
      return;
    }

    // Extract location details from the selected radio button's value
    const [locationName, latitude, longitude] = selectedLocation.value.split('|').map((value) => value.trim());
    const days = document.getElementById('weather-days').value.trim();

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
        body: JSON.stringify({ locationName, latitude, longitude, days }),
      });
      const result = await response.json();

      if (result.success) {
        alert(result.message);
        // Refresh the weather data after adding the location
        fetchData('/weatherUpdate', setWeatherInfo, 'weather', 'weather', setTimestamps);

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

  return (
    <div id="manage-weather" className="modal">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Weather Locations</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <form id="add-weather-location-form">
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr style={{ paddingBottom: "12px", height: "48px" }}>
                    <td style={{ width: "120px", verticalAlign: "middle" }}>
                      <label htmlFor="weather-days" className="form-label me-2">Days</label>                      
                    </td>
                    <td style={{ verticalAlign: "middle" }} colSpan="2">
                      <input id="weather-days" className="form-control" type="number" min="1" max="7" defaultValue="3" style={{ width: "80px" }} />
                    </td>
                  </tr>
                  <tr style={{ paddingBottom: "12px", height: "48px" }}>
                    <td style={{ verticalAlign: "middle" }}>
                      <label htmlFor="weather-location" className="form-label me-2">Location</label>
                    </td>
                    <td style={{ verticalAlign: "middle" }} colSpan="2">
                      <input id="weather-location" className="form-control" type="text" placeholder="Enter city or zip" style={{ flex: 1 }} />                      
                    </td>
                  </tr>                  
                  <tr style={{ paddingBottom: "12px", height: "48px" }}>
                    <td style={{ verticalAlign: "middle" }}>
                      <label className="form-check-label" htmlFor="weather-international">International</label>
                    </td>
                    <td style={{ verticalAlign: "middle" }}>
                      <input id="weather-international" className="form-check-input" type="checkbox" /> 
                    </td>
                    <td style={{ verticalAlign: "middle" }} align="right">
                      <button type="button" className="btn btn-secondary ms-2" onClick={getLocations} >Lookup Location</button>
                    </td>
                  </tr>
                </tbody>
              </table>               
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
              onClick={addWeatherLocation}               
            >
              Add Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageWeatherModal;
