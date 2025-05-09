import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Import axios for API calls

function HomePage() {
  const [selectedSiteKey, setSelectedSiteKey] = useState('');
  const [loading, setLoading] = useState(false); // Loading state to show while fetching data
  const navigate = useNavigate();

  const sites = [
    { label: 'Amazon', value: 'amazon' },
    { label: 'Flipkart', value: 'flipkart' },
    { label: 'Alibaba', value: 'alibaba' },
    { label: 'DHgate', value: 'dhgate' },
    { label: 'IndiaMart', value: 'indiamart' },
    { label: 'MadeInChina', value: 'madeinchina' },
    { label: 'eBay', value: 'ebay' },
  ];

const handleStart = async () => {
  if (selectedSiteKey) {
    setLoading(true);
    try {
      // Call the backend API with the selected site key
      const response = await axios.post('http://localhost:5000/api/scrape', { site: selectedSiteKey });

      // Once the API call is successful, navigate to the next page
      navigate('/keyword', { state: { selectedSite: selectedSiteKey, data: response.data } });
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  } else {
    alert('Please select an e-commerce site');
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-indigo-400">
          E-commerce Scraper
        </h1>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-white">
            Select E-commerce Site
          </label>
          <select
            className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedSiteKey}
            onChange={(e) => setSelectedSiteKey(e.target.value)}
          >
            <option value="" disabled>
              Select a site
            </option>
            {sites.map((site) => (
              <option key={site.value} value={site.value}>
                {site.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleStart}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
          disabled={loading} // Disable button while loading
        >
          {loading ? 'Loading...' : 'Start'}
        </button>
      </div>
    </div>
  );
}

export default HomePage;
