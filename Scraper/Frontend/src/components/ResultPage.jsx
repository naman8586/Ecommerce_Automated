import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ResultsPage = () => {
  const [scrapingStatus, setScrapingStatus] = useState('loading');
  const [data, setData] = useState([]);
  const [error, setError] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedSite, keyword, scrapedData } = location.state || {};

  useEffect(() => {
    console.log('ResultsPage location.state:', location.state);

    if (!selectedSite || !keyword) {
      console.error('Missing selectedSite or keyword');
      setError('Missing site or keyword. Please start a new search.');
      setScrapingStatus('failed');
      navigate('/');
      return;
    }

    if (scrapedData && Array.isArray(scrapedData)) {
      console.log('Valid scrapedData received:', scrapedData);
      setData(scrapedData);
      setScrapingStatus('completed');
    } else {
      console.error('Invalid scrapedData:', scrapedData);
      setError('No valid data received. Please try again.');
      setScrapingStatus('failed');
      // Fallback: Use test data to confirm rendering
      setData([
        {
          title: 'Test Rolex Watch',
          images: ['https://via.placeholder.com/150'],
          website_name: 'IndiaMart',
          url: 'https://example.com',
          exact_price: '999'
        }
      ]);
    }
  }, [selectedSite, keyword, scrapedData, navigate,location.state]);

  const handleDownload = () => {
    const safeKeyword = keyword.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_');
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${safeKeyword}_${selectedSite}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderField = (field, value, isModal = false) => {
    if (!value) return 'N/A';
    if (field === 'images') return value.join(', ');
    if (field === 'feedback') return `Rating: ${value.rating || 'N/A'}, Reviews: ${value.review || 'N/A'}`;
    if (field === 'specifications') return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(', ');
    if (field === 'image_url' || field === 'url') {
      return (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className={`text-indigo-400 underline block ${isModal ? 'whitespace-normal break-words' : 'truncate overflow-hidden whitespace-nowrap max-w-full'}`}
        >
          {value}
        </a>
      );
    }
    return value.toString();
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-indigo-400 mb-6">Scraping Results</h1>
        <p className="text-center mb-6 text-gray-300">
          Site: {selectedSite || 'N/A'} | Keyword: {keyword || 'N/A'} | Items: {data.length}
        </p>

        {error && <div className="mb-6 p-3 bg-red-600 text-white rounded-lg">{error}</div>}
        {scrapingStatus === 'loading' && (
          <div className="mb-6 text-center text-gray-300">Loading results...</div>
        )}

        {scrapingStatus === 'completed' || scrapingStatus === 'failed' ? (
          <>
            <div
              className={`mb-6 p-4 ${
                scrapingStatus === 'completed' ? 'bg-green-600 bg-opacity-20 border-green-600' : 'bg-red-600 bg-opacity-20 border-red-600'
              } border rounded-lg`}
            >
              <div className="flex items-center justify-center mb-2">
                <svg
                  className={`w-6 h-6 ${scrapingStatus === 'completed' ? 'text-green-500' : 'text-red-500'} mr-2`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d={scrapingStatus === 'completed' ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
                  />
                </svg>
                <p
                  className={`${scrapingStatus === 'completed' ? 'text-green-500' : 'text-red-500'} font-medium`}
                >
                  {scrapingStatus === 'completed' ? 'Scraping completed successfully!' : 'Scraping failed'}
                </p>
              </div>
              <p className="text-center text-gray-300">
                {scrapingStatus === 'completed'
                  ? `Found ${data.length} items`
                  : 'Showing test data due to failure'}
              </p>
            </div>

            <button
              onClick={handleDownload}
              className="mb-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
            >
              Download JSON
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-4 rounded-lg shadow-lg cursor-pointer hover:scale-105 transition-transform duration-200"
                  onClick={() => setSelectedCard(item)}
                >
                  {item.images && item.images[0] && (
                    <img
                      src={item.images[0]}
                      alt={item.title || 'Product'}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                      onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
                    />
                  )}
                  {Object.entries(item).map(([field, value]) => (
                    field !== 'images' && (
                      <p key={field} className="text-gray-300 mb-2">
                        <span className="font-semibold">{field}:</span> {renderField(field, value)}
                      </p>
                    )
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : null}

        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
        >
          New Search
        </button>
      </div>

      {selectedCard && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6"
          onClick={() => setSelectedCard(null)}
        >
          <div
            className="bg-gray-800 max-w-2xl w-full p-6 rounded-lg shadow-2xl relative animate-scaleIn overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 text-white hover:text-red-400"
              onClick={() => setSelectedCard(null)}
            >
              ✕
            </button>
            {selectedCard.images && selectedCard.images[0] && (
              <img
                src={selectedCard.images[0]}
                alt={selectedCard.title || 'Product'}
                className="w-full h-64 object-cover rounded-lg mb-4"
                onError={(e) => (e.target.src = 'https://via.placeholder.com/150')}
              />
            )}
            {Object.entries(selectedCard).map(([field, value]) => (
              field !== 'images' && (
                <p key={field} className="text-gray-300 mb-2">
                  <span className="font-semibold">{field}:</span> {renderField(field, value, true)}
                </p>
              )
            ))}
          </div>
        </div>
      )}

      <style>{`
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }

        @keyframes scaleIn {
          0% { transform: scale(0.7); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ResultsPage;