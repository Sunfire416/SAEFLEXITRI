/* src/routes/ProtectedRoutes.js */
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import RouteProtect from "../utils/RouteProtect";
import HomePage from "../pages/HomePage";
import MyTrip from "../components/TripInfo/TripInfo";
import PmrAssisPage from "../pages/PmrAssisPage";
import BagagePage from "../pages/BagagePage";
import EwalletPage from "../pages/EwalletPage";
import Support from "../components/Support/Support";
import ProfilePage from "../components/Profile/Profile";
import UserSettingsPage from "../components/User_settings/User_settings";
import EditUser from '../components/EditerProfil/EditProfil';
import ContactPage from "../components/Contact/Contact";
import BoardingPage from '../pages/BoardingPage';
import SecurityPage from "../pages/SecurityPage"; 
import AccompagnantHome from '../components/AccompagnantHome/AccompagnantHome';
import EditReservationPage from "../pages/EditReservationPage"; // ✅ Assure-toi que c'est bien ce fichier
const ProtectedRoutes = () => {
    return (
        <Routes>
            <Route
                path="/user/home"
                element={<RouteProtect><HomePage /></RouteProtect>}
            />
            <Route
                path="/user/mytrip"
                element={<RouteProtect><MyTrip /></RouteProtect>}
            />
            <Route
                path="/user/pmr-assistance"
                element={<RouteProtect><PmrAssisPage /></RouteProtect>}
            />
            <Route
                path="/user/baggage-tracking"
                element={<RouteProtect><BagagePage /></RouteProtect>}
            />
            <Route
                path="/user/ewallet"
                element={<RouteProtect><EwalletPage /></RouteProtect>}
            />
            <Route
                path="/user/support"
                element={<RouteProtect><Support /></RouteProtect>}
            />
            <Route
                path="/user/profile"
                element={<RouteProtect><ProfilePage /></RouteProtect>}
            />
            <Route 
                path="/user/edit-profile"
                element={<RouteProtect><EditUser /></RouteProtect>}
            />
            <Route
                path="/user/User_settings"
                element={<RouteProtect><UserSettingsPage /></RouteProtect>}
            />
            <Route
                path="/user/contact"
                element={<RouteProtect><ContactPage /></RouteProtect>}
            />
            <Route
                path="/user/boarding" // Correction de la casse
                element={<RouteProtect><BoardingPage /></RouteProtect>}
            />
            <Route
                path="/security"
                element={<RouteProtect><SecurityPage /></RouteProtect>}
            />
            <Route path="/accompagnant/home"
                element={<RouteProtect><AccompagnantHome /></RouteProtect>}
            />
             <Route 
             path="/edit-reservation/:id" 
             element={<RouteProtect><EditReservationPage /></RouteProtect>} />
        </Routes>
    );
};

export default ProtectedRoutes;
