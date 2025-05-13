import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
    const [selectedSiteKey, setSelectedSiteKey] = useState('');
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

    const handleStart = () => {
        if (!selectedSiteKey) {
            alert('Please select an e-commerce site');
            return;
        }
        navigate('/keyword', { state: { selectedSite: selectedSiteKey } });
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center text-indigo-400">
                    E-commerce Scraper
                </h1>
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2 text-white">
                        Select E-commerce Site
                    </label>
                    <select
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        value={selectedSiteKey}
                        onChange={(e) => setSelectedSiteKey(e.target.value)}
                    >
                        <option value="" disabled>Select a site</option>
                        {sites.map(site => (
                            <option key={site.value} value={site.value}>{site.label}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleStart}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                >
                    Start
                </button>
            </div>
        </div>
    );
}

export default HomePage;


// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// function HomePage() {
//   const [selectedSiteKey, setSelectedSiteKey] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const sites = [
//     { label: 'Amazon', value: 'amazon' },
//     { label: 'Flipkart', value: 'flipkart' },
//     { label: 'Alibaba', value: 'alibaba' },
//     { label: 'DHgate', value: 'dhgate' },
//     { label: 'IndiaMart', value: 'indiamart' },
//     { label: 'MadeInChina', value: 'madeinchina' },
//     { label: 'eBay', value: 'ebay' },
//   ];

//   const handleStart = async () => {
//     if (!selectedSiteKey) {
//       alert('Please select an e-commerce site');
//       return;
//     }

//     setLoading(true);
//     try {
//       // Make a request to your backend to scrape data for the selected site
//       const response = await axios.post('http://localhost:5000/scrape', {
//         site: selectedSiteKey,
//         keyword: 'sample',  // You can pass a default keyword or get it from input
//         pageCount: 5,       // Example, you can update this as needed
//         retries: 3,         // Example, you can update this as needed
//       });

//       if (response.status === 200 && response.data.success) {
//         // After successful scraping, navigate to the next page with the result
//         navigate('/keyword', {
//           state: { selectedSite: selectedSiteKey }
//         });
//       } else {
//         alert('Failed to scrape from the selected site. Please try again later.');
//       }
//     } catch (error) {
//       console.error('Error during scraping:', error);
//       alert('Error during scraping. Please try again later.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900">
//       <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
//         <h1 className="text-3xl font-bold mb-6 text-center text-indigo-400">
//           E-commerce Scraper
//         </h1>
//         <div className="mb-6">
//           <label className="block text-sm font-medium mb-2 text-white">
//             Select E-commerce Site
//           </label>
//           <select
//             className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
//             value={selectedSiteKey}
//             onChange={(e) => setSelectedSiteKey(e.target.value)}
//           >
//             <option value="" disabled>
//               Select a site
//             </option>
//             {sites.map((site) => (
//               <option key={site.value} value={site.value}>
//                 {site.label}
//               </option>
//             ))}
//           </select>
//         </div>
//         <button
//           onClick={handleStart}
//           className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
//           disabled={loading}
//         >
//           {loading ? 'Connecting...' : 'Start'}
//         </button>
//       </div>
//     </div>
//   );
// }

// export default HomePage;