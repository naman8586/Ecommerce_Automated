import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SUPPORTED_FIELDS } from '../constants';

function FieldSelectorPage() {
    const [selectedFields, setSelectedFields] = useState(['url', 'title', 'exact_price', 'images']); // Changed 'image_url' to 'images'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaData, setCaptchaData] = useState(null);
    const [captchaInput, setCaptchaInput] = useState('');
    const [sessionId, setSessionId] = useState('');
    const location = useLocation();
    const navigate = useNavigate();
    const { selectedSite, keyword, pageCount, retries } = location.state || {};

    useEffect(() => {
        if (!selectedSite || !keyword) navigate('/');
    }, [selectedSite, keyword, navigate]);

    const handleCheckboxChange = (field) => {
        setSelectedFields((prev) =>
            prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
        );
    };

    const handleSelectAll = () => setSelectedFields([...SUPPORTED_FIELDS]);
    const handleSelectNone = () => setSelectedFields([]);

    const handleSubmit = async () => {
        if (!selectedFields.length) {
            setError('Please select at least one field.');
            return;
        }
        if (!Array.isArray(selectedFields) || !selectedFields.every((f) => SUPPORTED_FIELDS.includes(f))) {
            setError('Invalid field selection. Please try again.');
            return;
        }

        setLoading(true);
        setError('');
        setCaptchaInput('');
        setCaptchaData(null);
        setSessionId('');

        // 20% chance to trigger CAPTCHA (or always if backend requires)
        if (Math.random() < 0.2) {
            await fetchCaptcha();
        } else {
            await performScrape();
        }
    };

    const fetchCaptcha = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/scrape', {
                site: selectedSite,
                keyword,
                pageCount,
                retries,
                fields: selectedFields.join(','),
            });

            if (response.data.message === 'CAPTCHA required') {
                setCaptchaData(response.data.captcha);
                setSessionId(response.data.sessionId);
                setShowCaptcha(true);
                setLoading(false);
            } else if (response.data.message.includes('completed')) {
                navigate('/results', {
                    state: { selectedSite, keyword, scrapedData: response.data.products },
                });
            } else {
                setError(response.data.message || 'Failed to initiate scraping.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Scrape error:', error);
            setError(error.response?.data?.message || `Error initiating scraping: ${error.message}`);
            setLoading(false);
        }
    };

    const handleCaptchaSubmit = async () => {
        if (!captchaInput && captchaData?.type === 'image') {
            setError('Please enter the CAPTCHA text.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const validationResponse = await axios.post('http://localhost:5000/api/captcha', {
                site: selectedSite,
                captchaInput,
                sessionId,
            });

            if (validationResponse.data.message === 'CAPTCHA validated successfully') {
                await performScrape();
            } else {
                setError(validationResponse.data.message || 'Invalid CAPTCHA.');
                setLoading(false);
            }
        } catch (error) {
            console.error('CAPTCHA validation error:', error);
            setError(error.response?.data?.message || `Failed to validate CAPTCHA: ${error.message}`);
            setLoading(false);
        }
    };

    const performScrape = async () => {
        try {
            const response = await axios.post('http://localhost:5000/api/scrape', {
                site: selectedSite,
                keyword,
                pageCount,
                retries,
                fields: selectedFields.join(','),
            });

            if (response.data.message.includes('completed')) {
                navigate('/results', {
                    state: { selectedSite, keyword, scrapedData: response.data.products },
                });
            } else if (response.data.message === 'CAPTCHA required') {
                setCaptchaData(response.data.captcha);
                setSessionId(response.data.sessionId);
                setShowCaptcha(true);
                setLoading(false);
            } else {
                setError(response.data.message || 'Failed to scrape data.');
                setLoading(false);
            }
        } catch (error) {
            console.error('Scrape error:', error);
            setError(error.response?.data?.message || `Error occurred while scraping: ${error.message}`);
            setLoading(false);
        }
    };

    const renderCaptcha = () => {
        if (!captchaData) return null;

        switch (captchaData.type) {
            case 'image':
                return (
                    <div className="mb-4">
                        <img
                            src={captchaData.url}
                            alt="CAPTCHA"
                            className="w-full h-32 object-contain bg-gray-700 rounded-lg mb-4"
                            onError={(e) => (e.target.src = 'https://via.placeholder.com/300x100?text=CAPTCHA+Failed')}
                        />
                        <input
                            type="text"
                            value={captchaInput}
                            onChange={(e) => setCaptchaInput(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter CAPTCHA text"
                        />
                    </div>
                );
            case 'audio':
                return (
                    <div className="mb-4">
                        <audio controls className="w-full mb-4">
                            <source src={captchaData.url} type="audio/mpeg" />
                            Your browser does not support the audio element.
                        </audio>
                        <input
                            type="text"
                            value={captchaInput}
                            onChange={(e) => setCaptchaInput(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter audio CAPTCHA text"
                        />
                    </div>
                );
            case 'interactive':
                return (
                    <div className="mb-4">
                        <p className="text-gray-300 mb-2">Complete the CAPTCHA below:</p>
                        <iframe
                            src={captchaData.url}
                            title="CAPTCHA"
                            className="w-full h-64 border-0"
                        ></iframe>
                        <input
                            type="text"
                            value={captchaInput}
                            onChange={(e) => setCaptchaInput(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Enter CAPTCHA token (if required)"
                        />
                    </div>
                );
            default:
                return <p className="text-red-500">Unsupported CAPTCHA type.</p>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 p-8 font-sans">
            <div className="max-w-3xl mx-auto bg-gray-800 rounded-2xl shadow-xl p-6">
                <h1 className="text-3xl font-bold text-center text-indigo-400 mb-6">Select Data Fields</h1>

                {error && (
                    <div className="mb-6 p-3 bg-red-600 text-white rounded-lg">{error}</div>
                )}

                <div className="mb-6">
                    <div className="bg-gray-700 rounded-lg p-4 mb-4">
                        <h2 className="text-lg font-medium text-white mb-2">Scraping Configuration</h2>
                        <p className="text-gray-300">
                            Site: <span className="font-semibold">{selectedSite}</span>
                        </p>
                        <p className="text-gray-300">
                            Keyword: <span className="font-semibold">{keyword}</span>
                        </p>
                        <p className="text-gray-300">
                            Pages: <span className="font-semibold">{pageCount}</span>
                        </p>
                        <p className="text-gray-300">
                            Retries: <span className="font-semibold">{retries}</span>
                        </p>
                    </div>
                </div>

                <div className="mb-4 flex justify-between">
                    <h2 className="text-xl font-semibold text-white">Available Fields:</h2>
                    <div className="space-x-3">
                        <button
                            onClick={handleSelectAll}
                            className="px-3 py-1 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                        >
                            Select All
                        </button>
                        <button
                            onClick={handleSelectNone}
                            className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                        >
                            Select None
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {SUPPORTED_FIELDS.map((field) => (
                        <label
                            key={field}
                            className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedFields.includes(field)
                                    ? 'bg-indigo-700 hover:bg-indigo-800'
                                    : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                        >
                            <input
                                type="checkbox"
                                value={field}
                                checked={selectedFields.includes(field)}
                                onChange={() => handleCheckboxChange(field)}
                                className="mr-3 w-4 h-4 accent-indigo-500"
                            />
                            <span className="text-white">{field}</span>
                        </label>
                    ))}
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={() => navigate('/keyword', { state: { selectedSite } })}
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
                        {loading ? 'Starting Scraper...' : 'Start Scraping'}
                    </button>
                </div>

                {/* CAPTCHA Modal */}
                {showCaptcha && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                            <h2 className="text-2xl font-bold mb-6 text-center text-indigo-400">
                                CAPTCHA Verification
                            </h2>
                            <p className="text-gray-300 mb-4">
                                A CAPTCHA verification is required for {selectedSite}.
                            </p>
                            {renderCaptcha()}
                            {error && (
                                <div className="mb-4 p-3 bg-red-600 text-white rounded-lg">{error}</div>
                            )}
                            <div className="flex space-x-3 mt-4">
                                <button
                                    onClick={() => setShowCaptcha(false)}
                                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCaptchaSubmit}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300"
                                    disabled={loading}
                                >
                                    {loading ? 'Verifying...' : 'Submit'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default FieldSelectorPage;