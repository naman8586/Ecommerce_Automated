import React, { useState } from 'react';
import axios from 'axios';

const fields = [
  "url", "original_title", "title", "currency", "exact_price", "description",
  "min_order", "supplier", "origin", "feedback.rating", "feedback.review",
  "image_url", "images", "videos", "dimensions", "website_name",
  "discount_information", "brand_name"
];

export default function FieldSelectorPage() {
  const [selectedFields, setSelectedFields] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCheckboxChange = (field) => {
    setSelectedFields((prev) =>
      prev.includes(field)
        ? prev.filter((f) => f !== field)
        : [...prev, field]
    );
  };

  const handleSubmit = async () => {
    if (!keyword.trim()) {
      alert("Please enter a keyword.");
      return;
    }

    if (selectedFields.length === 0) {
      alert("Please select at least one field.");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post("http://localhost:5000/run-scraper", {
        keyword,
        fields: selectedFields,
      });

      // Assuming the response indicates the scraper was successfully started
      console.log("Scraper response:", response.data);

      setSuccess('Scraper started successfully. Check the logs for results.');
    } catch (error) {
      console.error("Error triggering scraper:", error);
      setError('Error occurred while starting the scraper. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 to-purple-200 p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center text-purple-700 mb-6">Select Data Fields</h1>

        {/* Keyword Input */}
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-2">Enter Keyword</label>
          <input
            type="text"
            className="w-full p-3 border border-purple-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g., smartphone"
          />
        </div>

        {/* Fields */}
        <form className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((field) => (
            <label
              key={field}
              className="flex items-center bg-purple-50 px-3 py-2 rounded-lg shadow-sm hover:bg-purple-100 cursor-pointer"
            >
              <input
                type="checkbox"
                value={field}
                checked={selectedFields.includes(field)}
                onChange={() => handleCheckboxChange(field)}
                className="mr-2 accent-purple-500"
              />
              {field}
            </label>
          ))}
        </form>

        {/* Selected Fields */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Selected Fields:</h2>
          <div className="bg-gray-100 p-4 rounded-lg shadow-inner">
            {selectedFields.length > 0 ? (
              <ul className="list-disc pl-6 text-gray-800">
                {selectedFields.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No fields selected.</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-6 text-center">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
          >
            {loading ? 'Starting Scraper...' : 'Start Scraper'}
          </button>
        </div>

        {/* Feedback */}
        {success && <p className="text-green-500 text-center mt-4">{success}</p>}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}
