import React from 'react';
import { getRowClass, updateCollapsedState } from '../utils';

const Sports = ({ sportsFeeds }) => {
  return sportsFeeds
    .filter(
      (sport) =>
        sport.sportData && // Ensure sportData exists
        sport.sportData.some((data) => data.items && data.items.length > 0) // Filter out sports with no items
    )
    .map((sport, index) => (
      <div key={index}>
        <div
          className="data-header"
          onClick={() => {
            const tableId = `sports-${index}`;
            const table = document.getElementById(tableId);

            if (table) {
              // Toggle the table's visibility
              const isCollapsed = table.style.display === 'none' ? false : true;
              table.style.display = isCollapsed ? 'none' : 'table';

              // Update the collapsed state in the database
              updateCollapsedState('Sports', sport.name, !isCollapsed);
            }
          }}
        >
          {sport.name}
        </div>
        <table
          id={`sports-${index}`}
          className="data-table"
          style={{ display: sport.collapsed ? 'none' : 'table' }} // Conditionally hide the table
        >
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
      </div>
    ));
};

export default Sports;
