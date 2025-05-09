import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function KeywordPage() {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const location = useLocation();
  const { selectedSite } = location.state || {};

  const handleSubmit = async () => {
    if (!keyword.trim()) {
      alert('Please enter a keyword');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      // Adjust the API URL to match the backend where the scraper is located
      const response = await axios.post('http://localhost:5000/run-scrapers', {
        keyword,
        site: selectedSite // Send the selected site along with the keyword
      });

      const data = response.data;

      // Check the response status from the backend
      if (data.status === 'done') {
        setResults(data.results);
      } else {
        setError('Scraping failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error or scraper crashed.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-indigo-400">
          Enter Keyword
        </h1>
        <p className="text-center mb-4">Selected Site: {selectedSite || 'None'}</p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-white">Keyword</label>
          <input
            type="text"
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., smartphone"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
        >
          {loading ? 'Scraping...' : 'Submit'}
        </button>

        {error && <p className="text-red-500 mt-4 text-center">{error}</p>}

        {results && (
          <div className="mt-6 text-white">
            <h2 className="text-lg font-semibold mb-2">Results:</h2>
            <pre className="bg-gray-900 p-2 rounded overflow-x-auto text-sm">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default KeywordPage;
