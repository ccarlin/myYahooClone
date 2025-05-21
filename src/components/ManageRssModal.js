import React from 'react';
import { fetchData } from '../api';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';

const ManageRssModal = ({ setNewsFeeds, setTimestamps }) => {
  const addRSSFeed = async () => {
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
        fetchData('/newsUpdate', setNewsFeeds, 'news', 'news', setTimestamps);
      
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

  return (
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
            <button type="button" className="btn btn-primary" onClick={addRSSFeed}>Add Feed</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageRssModal;
