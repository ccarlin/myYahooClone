import React from 'react';
import { fetchData } from '../api';
import { getRowClass, formatCurrency, updateCollapsedState } from '../utils';

const StockInfo = ({ stockInfo, showTrashIcons, setStockInfo, setTimestamps }) => {
  const removeStock = async (portfolioName, stockSymbol) => {
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
        fetchData('/stockUpdate', setStockInfo, 'stock', 'stock', setTimestamps);
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
      <div
        className="data-header"
        onClick={() => {
          const tableId = `stock-${index}`;
          const table = document.getElementById(tableId);

          if (table) {
            // Toggle the table's visibility
            const isCollapsed = table.style.display === 'none' ? false : true;
            table.style.display = isCollapsed ? 'none' : 'table';

            // Update the collapsed state in the database
            updateCollapsedState('Portfolios', portfolio.name, !isCollapsed);
          }
        }}
      >
        {portfolio.name}
      </div>
      <table
        id={`stock-${index}`}
        className="data-table"
        style={{ display: portfolio.collapsed ? 'none' : 'table' }} // Conditionally hide the table
      >
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
                  onClick={() => removeStock(portfolio.name, stock.symbol)}
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
    </div>
  ));
};

export default StockInfo;
