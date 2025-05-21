import React from 'react';
import { fetchData } from '../api';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';

const ManageSportsModal = ({ setSportsFeeds, setTimestamps }) => {
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

  const saveSelectedTeams = async () => {
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
        fetchData('/sportsUpdate', setSportsFeeds, 'sports', 'sports', setTimestamps);
        
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

  return (
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
                <select id="league-selector" className="form-select" onChange={fetchTeamsForLeague}>
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
            <button type="button" className="btn btn-primary" onClick={saveSelectedTeams}>Save changes</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageSportsModal;
