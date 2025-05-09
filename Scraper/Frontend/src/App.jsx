import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import KeywordPage from './components/KeywordPage';
import CaptchaPage from './components/CaptchaPage';
import FieldSelectorPage from './components/FieldSelectorPage'; 
import FinalPage from './components/FinalPage'; //

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/keyword" element={<KeywordPage />} />
        <Route path="/captcha" element={<CaptchaPage />} />
        <Route path="/fields" element={<FieldSelectorPage />} />
        <Route path="/final" element={<FinalPage />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;
