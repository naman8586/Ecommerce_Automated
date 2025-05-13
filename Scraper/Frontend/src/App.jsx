import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/Homepage';
import KeywordPage from './components/KeywordPage';
import FieldSelectorPage from './components/FieldSelectorPage';
import ResultsPage from './components/ResultPage';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/keyword" element={<KeywordPage />} />
                <Route path="/fields" element={<FieldSelectorPage />} />
                <Route path="/results" element={<ResultsPage />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;