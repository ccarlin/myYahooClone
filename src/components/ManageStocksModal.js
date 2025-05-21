import React from 'react';
import { fetchData } from '../api';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';

const ManageStocksModal = ({ setStockInfo, setTimestamps }) => {
  const addStock = async () => {
    const portfolioName = document.getElementById('portfolio-name').value.trim();
    const stockSymbol = document.getElementById('stock-symbol').value.trim();

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
        fetchData('/stockUpdate', setStockInfo, 'stock', 'stock', setTimestamps);

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

  return (
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
            <button type="button" className="btn btn-primary" onClick={addStock}>Add Stock</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStocksModal;
