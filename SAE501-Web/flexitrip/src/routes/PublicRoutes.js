/* src/routes/PublicRoutes.js */
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import HomePage from "../pages/HomePage";
import Support from "../components/Support/Support";
import LoginPage from "../components/Login/Login";
import Signup from "../components/Signup/Signup";
import EwalletPage from "../pages/EwalletPage";
import MyTrip from "../components/TripInfo/TripInfo";
import BagagePage from "../pages/BagagePage";
import PmrAssisPage from "../pages/PmrAssisPage";

const PublicRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/support" element={<Support />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/ewallet" element={<EwalletPage />} />
            <Route path="/mytrip" element={<MyTrip />} />
            <Route path="/baggage-tracking" element={<BagagePage />} />
            <Route path="/pmr-assistance" element={<PmrAssisPage />} />
        </Routes>
    );
};

export default PublicRoutes;
