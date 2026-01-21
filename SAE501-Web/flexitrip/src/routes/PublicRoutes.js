/* src/routes/PublicRoutes.js */
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import HomePage from "../pages/HomePage";
import LoginPage from "../components/Login/Login";
import Signup from "../components/Signup/Signup";
import EwalletPage from "../pages/EwalletPage";
import BagagePage from "../pages/BagagePage";
import PmrAssistance from "../components/PmrAssistance/PmrAssistance";

const PublicRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/ewallet" element={<EwalletPage />} />
            <Route path="/baggage-tracking" element={<BagagePage />} />
            <Route path="/pmr-assistance" element={<PmrAssistance />} />
        </Routes>
    );
};

export default PublicRoutes;
