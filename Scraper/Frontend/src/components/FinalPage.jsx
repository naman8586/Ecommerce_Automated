import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function FinalPage() {
  const location = useLocation();
  const { selectedSite, keyword } = location.state || {};
  const [scrapedData, setScrapedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchScrapedData = async () => {
      try {
        setError('');
        setLoading(true);
        const res = await axios.post('http://localhost:5000/get-scraped-data', {
          selectedSite,
          keyword,
        });

        if (res.data?.scrapedData) {
          setScrapedData(res.data.scrapedData);
        } else {
          setError('No data found for this request.');
        }
      } catch (err) {
        console.error('Failed to fetch scraped data:', err);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchScrapedData();
  }, [selectedSite, keyword]);

  const downloadData = () => {
    if (!scrapedData) {
      alert('No data to download.');
      return;
    }

    const json = JSON.stringify(scrapedData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedSite}-${keyword}-scraped-data.json`;
    link.click();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-center text-indigo-400">
          Scraped Data for "{keyword}"
        </h1>

        <p className="text-center mb-4 text-gray-300">
          Site: {selectedSite || 'None'} | Keyword: {keyword || 'None'}
        </p>

        {loading ? (
          <p className="text-center text-gray-400">Loading scraped data...</p>
        ) : error ? (
          <p className="text-center text-red-400">{error}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto text-white">
                <thead className="bg-indigo-600">
                  <tr>
                    <th className="px-4 py-2 text-left">Field</th>
                    <th className="px-4 py-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-700">
                  {Object.keys(scrapedData).map((field) => (
                    <tr key={field}>
                      <td className="px-4 py-2 font-semibold">{field}</td>
                      <td className="px-4 py-2">{scrapedData[field]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={downloadData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
              >
                Download Data (JSON)
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FinalPage;
