import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function KeywordPage() {
    const [keyword, setKeyword] = useState('');
    const [pageCount, setPageCount] = useState(1);
    const [retries, setRetries] = useState(3);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedSite } = location.state || {};

    useEffect(() => {
        if (!selectedSite) {
            navigate('/');
        }
    }, [selectedSite, navigate]);

    const handleSubmit = () => {
        if (!keyword.trim()) {
            setError('Please provide a search keyword.');
            return;
        }
        if (!Number.isInteger(pageCount) || pageCount < 1) {
            setError('Page count must be a positive integer.');
            return;
        }
        if (!Number.isInteger(retries) || retries < 1) {
            setError('Retries must be a positive integer.');
            return;
        }
        setLoading(true);
        setError('');
        navigate('/fields', {
            state: { selectedSite, keyword: keyword.trim(), pageCount, retries }
        });
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6 text-center text-indigo-400">
                    Enter Search Details
                </h1>
                {error && (
                    <div className="mb-4 p-3 bg-red-600 text-white rounded-lg">
                        {error}
                    </div>
                )}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-white">
                            Search Keyword
                        </label>
                        <input
                            type="text"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="e.g., Nike Shoes"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-white">
                            Page Count
                        </label>
                        <input
                            type="number"
                            value={pageCount}
                            onChange={(e) => setPageCount(parseInt(e.target.value) || 1)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            min="1"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Number of pages to scrape (higher values may take longer)
                        </p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-white">
                            Retries
                        </label>
                        <input
                            type="number"
                            value={retries}
                            onChange={(e) => setRetries(parseInt(e.target.value) || 1)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            min="1"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Number of retry attempts for failed requests
                        </p>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            onClick={() => navigate('/')}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                            disabled={loading}
                        >
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                            disabled={loading}
                        >
                            {loading ? 'Preparing...' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default KeywordPage;



// import React, { useState } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import axios from 'axios';

// function KeywordPage() {
//   const [keyword, setKeyword] = useState('');
//   const [pageCount, setPageCount] = useState(10);
//   const [retries, setRetries] = useState(3);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
  
//   const location = useLocation();
//   const navigate = useNavigate();
  
//   const { selectedSite } = location.state || {};
  
//   // Redirect to home if no site is selected
//   React.useEffect(() => {
//     if (!selectedSite) {
//       navigate('/');
//     }
//   }, [selectedSite, navigate]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Validation
//     if (!keyword.trim()) {
//       setError('Please provide a search keyword.');
//       return;
//     }
    
//     if (pageCount < 1 || retries < 1) {
//       setError('Page count and retries must be positive integers.');
//       return;
//     }

//     setLoading(true);
//     setError('');
    
//     try {
//       // Send the scraping request to the backend
//       const response = await axios.post('http://localhost:5000/api/scrape', {
//         keyword,
//         pageCount,
//         retries,
//         site: selectedSite,
//       });

//       // Check if captcha handling is needed
//       if (response.data.needsCaptcha) {
//         navigate('/captcha', { 
//           state: { 
//             selectedSite, 
//             keyword, 
//             pageCount, 
//             retries,
//             captchaUrl: response.data.captchaUrl 
//           } 
//         });
//       } else {
//         // If no captcha needed, go to field selection
//         navigate('/fields', { 
//           state: { 
//             selectedSite, 
//             keyword, 
//             pageCount, 
//             retries 
//           } 
//         });
//       }
//     } catch (err) {
//       console.error('Error starting scraper:', err);
//       setError('Failed to start scraping. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
//       <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
//         <h1 className="text-2xl font-bold mb-6 text-center text-indigo-400">
//           Enter Search Details
//         </h1>
        
//         {error && (
//           <div className="mb-4 p-3 bg-red-600 text-white rounded-lg">
//             {error}
//           </div>
//         )}
        
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium mb-2 text-white">
//               Search Keyword
//             </label>
//             <input
//               type="text"
//               value={keyword}
//               onChange={(e) => setKeyword(e.target.value)}
//               className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               placeholder="e.g., Caterpillar"
//               required
//             />
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium mb-2 text-white">
//               Page Count
//             </label>
//             <input
//               type="number"
//               value={pageCount}
//               onChange={(e) => setPageCount(parseInt(e.target.value, 10) || 1)}
//               className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               min="1"
//               required
//             />
//             <p className="text-xs text-gray-400 mt-1">
//               Number of pages to scrape (higher values may take longer)
//             </p>
//           </div>
          
//           <div>
//             <label className="block text-sm font-medium mb-2 text-white">
//               Retries
//             </label>
//             <input
//               type="number"
//               value={retries}
//               onChange={(e) => setRetries(parseInt(e.target.value, 10) || 1)}
//               className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//               min="1"
//               required
//             />
//             <p className="text-xs text-gray-400 mt-1">
//               Number of retry attempts for failed requests
//             </p>
//           </div>
          
//           <button
//             type="submit"
//             className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
//             disabled={loading}
//           >
//             {loading ? 'Preparing Scraper...' : 'Start Scraping'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default KeywordPage;