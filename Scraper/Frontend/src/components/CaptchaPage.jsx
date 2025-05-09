import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

function CaptchaPage() {
  const location = useLocation();
  const { selectedSite, keyword } = location.state || {};
  const [captchaImage, setCaptchaImage] = useState(null);
  const [captchaText, setCaptchaText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch CAPTCHA image when component mounts
  useEffect(() => {
    const fetchCaptcha = async () => {
      try {
        setError(''); // Clear any previous errors
        setSuccess('');
        const res = await axios.post('http://localhost:5000/get-captcha', {
          keyword,
          selectedSite,
        });

        if (res.data?.captchaImage) {
          setCaptchaImage(res.data.captchaImage); // base64 or URL
        } else {
          setError('Captcha image could not be fetched.');
        }
      } catch (err) {
        console.error('Failed to load captcha:', err);
        setError('Failed to load captcha. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCaptcha();
  }, [keyword, selectedSite]);

  const handleCaptchaSubmit = async () => {
    if (!captchaText.trim()) {
      alert('Please enter the captcha text.');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/submit-captcha', {
        keyword,
        selectedSite,
        captchaText,
      });

      if (res.data?.message) {
        setSuccess(res.data.message); // Display success message
      } else {
        setError('Captcha submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Error submitting captcha:', err);
      setError('Failed to submit captcha. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-indigo-400">
          Solve Captcha
        </h1>

        <p className="text-center mb-4 text-gray-300">
          Site: {selectedSite || 'None'} | Keyword: {keyword || 'None'}
        </p>

        {loading ? (
          <p className="text-center text-gray-400">Loading captcha...</p>
        ) : captchaImage ? (
          <>
            <img
              src={`data:image/png;base64,${captchaImage}`}
              alt="Captcha"
              className="w-full mb-4 rounded-lg"
            />
            <input
              type="text"
              className="w-full p-3 mb-4 rounded bg-gray-700 text-white"
              placeholder="Enter captcha text"
              value={captchaText}
              onChange={(e) => setCaptchaText(e.target.value)}
            />
            <button
              onClick={handleCaptchaSubmit}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300"
            >
              Submit Captcha
            </button>
          </>
        ) : (
          <p className="text-center text-red-400">{error || 'Failed to load captcha.'}</p>
        )}

        {/* Success or error message */}
        {success && <p className="text-green-500 text-center mt-4">{success}</p>}
        {error && !loading && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
}

export default CaptchaPage;
