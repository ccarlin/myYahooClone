import React from 'react';
import { fetchData } from '../api';
import { updateCollapsedState, toggleTableData } from '../utils';

const NewsFeed = ({ newsFeeds, setNewsFeeds, showTrashIcons, setTimestamps }) => {
  const removeRSSFeed = async (categoryName, feedName) => {
    try {
      const url = 'http://localhost:5000/removeRSSFeed';
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryName, feedName }),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        // Refresh the news feeds after deletion
        fetchData('/newsUpdate', setNewsFeeds, 'news', 'news', setTimestamps);
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
        onClick={() => {
          const categoryContainer = document.getElementById(`category-container-${categoryIndex}`);
          if (categoryContainer) {
            // Toggle visibility of all tables in this category
            const isCollapsed = categoryContainer.style.display === 'none' ? false : true;
            categoryContainer.style.display = isCollapsed ? 'none' : 'block';

            // Update the collapsed state in the database
            updateCollapsedState('NewsCategories', category.category, !isCollapsed);
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        {category.category}
      </h3>

      {/* Category Content */}
      <div id={`category-container-${categoryIndex}`} style={{ display: category.collapsed ? 'none' : 'block' }}>
        {category.feeds.map((feed, feedIndex) => (
          <div key={feedIndex}>
            {/* Feed Table */}
            <table className="data-table">
              <thead>
                <tr className="data-header">
                  <th
                    colSpan="1"
                    onClick={(e) => toggleTableData(e.target, feed.name, category.category)} // Call toggleTableData
                    style={{ cursor: 'pointer', textAlign: 'left', position: 'relative' }}
                  >
                    {feed.name}
                    <span
                      className="trash-icon"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent click from bubbling to the header
                        removeRSSFeed(category.category, feed.name);
                      }}
                      style={{
                        cursor: 'pointer',
                        color: 'red',
                        display: showTrashIcons ? 'inline' : 'none',
                        position: 'absolute',
                        right: '10px',
                      }}
                      title="Remove RSS Feed"
                    >
                      🗑️
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {feed.feedData.items.map((item, itemIndex) => (
                  <tr
                    key={item.guid || itemIndex}
                    style={{ display: feed.feedData.collapsed ? 'none' : '' }} // Conditionally hide the row
                  >
                    <td colSpan="2">
                      <a href={item.link} target="_blank" rel="noopener noreferrer">
                        {item.title}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  ));
};

export default NewsFeed;
