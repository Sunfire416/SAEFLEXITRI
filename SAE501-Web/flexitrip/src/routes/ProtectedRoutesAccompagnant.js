/* src/routes/ProtectedRoutesAccompagnant.js */
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import RouteProtect from "../utils/RouteProtect";
import AccompagnantHome from "../components/AccompagnantHome/AccompagnantHome";
import SecurityPage from "../pages/SecurityPage";

const ProtectedRoutesAccompagnant = () => {
    return (
        <Routes>
            <Route
                path="/accompagnant/home"
                element={<RouteProtect><AccompagnantHome /></RouteProtect>}
            />
            <Route
                path="/security"
                element={<RouteProtect><SecurityPage /></RouteProtect>}
            />
        </Routes>
    );
};

export default ProtectedRoutesAccompagnant;
