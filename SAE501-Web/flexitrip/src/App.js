import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { QrCodeProvider } from "./context/QrCodeContext";
import { BaggageProvider } from "./context/BaggageContext";
import Spinner from "./components/Spinner/Spinner";
import BoardingPassGenerator from "./components/Boarding/BoardingPassGenerator";
import EditReservationPage from "./pages/EditReservationPage";
import RouteProtect from "./utils/RouteProtect";

// Public routes imports
import HomePage from "./pages/HomePage";
import Support from "./components/Support/Support";
import LoginPage from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import EwalletPage from "./pages/EwalletPage";
import MyTrip from "./components/TripInfo/TripInfo";
import BagagePage from "./pages/BagagePage";
import PmrAssisPage from "./pages/PmrAssisPage";

// Protected routes imports
import ProfilePage from "./components/Profile/Profile";
import UserSettingsPage from "./components/User_settings/User_settings";
import EditUser from './components/EditerProfil/EditProfil';
import ContactPage from "./components/Contact/Contact";
import BoardingPage from './pages/BoardingPage';
import SecurityPage from "./pages/SecurityPage";
import AccompagnantHome from './components/AccompagnantHome/AccompagnantHome';

// ==========================================
// 🆕 POINT 2 - NOUVEAUX IMPORTS
// ==========================================
import MultimodalSearch from './components/MultimodalSearch/MultimodalSearch';
import TripBuilder from './components/TripBuilder/TripBuilder';

// ==========================================
// 🆕 POINT 3 - NOUVEAUX IMPORTS
// ==========================================
import Enrollment from './components/Enrollment/Enrollment';
import CheckInKiosk from './components/CheckIn/CheckInKiosk';
import BoardingGate from './components/BoardingGate/BoardingGate';

// 🆕 POINT 4 & 5 - AJOUTER CES 3 LIGNES
import { NotificationProvider } from "./context/NotificationContext";
import NotificationCenter from "./components/Notifications/NotificationCenter";
import VoyageHistory from "./components/Voyages/VoyageHistory";

// 🆕 POINT 6 - Profil PMR & Dashboard Admin
import PMRProfilePage from "./pages/PMRProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

// 🆕 POINT 7 - Booking Result Page
import BookingResult from "./pages/BookingResult";

// 🆕 POINT 8 & 9 & 10 - NOUVELLES FONCTIONNALITÉS
import CheckInInterface from "./components/CheckIn/CheckInInterface";
import WalletHistory from "./components/Wallet/WalletHistory";
import FeedbackForm from "./components/Feedback/FeedbackForm";
import VoyageTracking from "./components/Tracking/VoyageTracking";
import AgentDashboard from "./components/Agent/AgentDashboard";


function App() {
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>
        <QrCodeProvider>
          <BaggageProvider>
            <LanguageProvider>
              <Router>
                <div className="App">
                  {isLoading ? (
                    <Spinner size={200} message="Chargement en cours ..." />
                  ) : (
                    <>
                      <Navbar />
                      <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/ewallet" element={<EwalletPage />} />
                        <Route path="/mytrip" element={<MyTrip />} />
                        <Route path="/baggage-tracking" element={<BagagePage />} />
                        <Route path="/pmr-assistance" element={<PmrAssisPage />} />
                        <Route path="/reservation" element={<BoardingPassGenerator />} />

                        {/* ==========================================
                          🆕 POINT 2 - NOUVELLES ROUTES PUBLIQUES
                          ========================================== */}
                        <Route path="/search" element={<MultimodalSearch />} />
                        <Route path="/trip-builder" element={<TripBuilder />} />

                        {/* ==========================================
                          🆕 POINT 3 - NOUVELLES ROUTES PUBLIQUES
                          ========================================== */}
                        <Route path="/enrollment" element={<Enrollment />} />
                        <Route path="/checkin" element={<CheckInKiosk />} />
                        <Route path="/boarding" element={<BoardingGate />} />

                        {/* Protected Routes */}
                        <Route path="/user/home" element={<RouteProtect><HomePage /></RouteProtect>} />
                        <Route path="/user/mytrip" element={<RouteProtect><MyTrip /></RouteProtect>} />
                        <Route path="/user/pmr-assistance" element={<RouteProtect><PmrAssisPage /></RouteProtect>} />
                        <Route path="/user/baggage-tracking" element={<RouteProtect><BagagePage /></RouteProtect>} />
                        <Route path="/user/ewallet" element={<RouteProtect><EwalletPage /></RouteProtect>} />
                        <Route path="/user/support" element={<RouteProtect><Support /></RouteProtect>} />
                        <Route path="/user/profile" element={<RouteProtect><ProfilePage /></RouteProtect>} />
                        <Route path="/user/edit-profile" element={<RouteProtect><EditUser /></RouteProtect>} />
                        <Route path="/user/User_settings" element={<RouteProtect><UserSettingsPage /></RouteProtect>} />
                        <Route path="/user/contact" element={<RouteProtect><ContactPage /></RouteProtect>} />
                        <Route path="/user/boarding" element={<RouteProtect><BoardingPage /></RouteProtect>} />
                        <Route path="/security" element={<RouteProtect><SecurityPage /></RouteProtect>} />
                        <Route path="/accompagnant/home" element={<RouteProtect><AccompagnantHome /></RouteProtect>} />
                        <Route path="/edit-reservation/:id" element={<RouteProtect><EditReservationPage /></RouteProtect>} />

                        {/* ==========================================
                          🆕 POINT 2 - NOUVELLES ROUTES PROTÉGÉES
                          ========================================== */}
                        <Route path="/user/search" element={<RouteProtect><MultimodalSearch /></RouteProtect>} />
                        <Route path="/user/trip-builder" element={<RouteProtect><TripBuilder /></RouteProtect>} />

                        {/* ==========================================
                          🆕 POINT 3 - NOUVELLES ROUTES PROTÉGÉES
                          ========================================== */}
                        <Route path="/user/enrollment" element={<RouteProtect><Enrollment /></RouteProtect>} />
                        <Route path="/user/checkin" element={<RouteProtect><CheckInKiosk /></RouteProtect>} />
                        <Route path="/user/boarding-gate" element={<RouteProtect><BoardingGate /></RouteProtect>} />
                        {/* 🆕 Point 4 - Notifications */}
                        <Route
                          path="/user/notifications"
                          element={<RouteProtect><NotificationCenter /></RouteProtect>}
                        />

                        {/* 🆕 Point 5 - Voyages */}
                        <Route
                          path="/user/voyages"
                          element={<RouteProtect><VoyageHistory /></RouteProtect>}
                        />

                        {/* 🆕 Point 6 - Profil PMR */}
                        <Route
                          path="/user/pmr-profile"
                          element={<RouteProtect><PMRProfilePage /></RouteProtect>}
                        />

                        {/* 🆕 Point 7 - Dashboard Admin */}
                        <Route
                          path="/admin/dashboard"
                          element={<RouteProtect><AdminDashboardPage /></RouteProtect>}
                        />

                        {/* 🆕 Point 8 - Booking Result Page */}
                        <Route
                          path="/user/booking-result"
                          element={<RouteProtect><BookingResult /></RouteProtect>}
                        />

                        {/* ==========================================
                          🆕 POINT 9 & 10 - NOUVELLES ROUTES (Implémentation complète)
                          ========================================== */}

                        {/* Check-in Manuel */}
                        <Route
                          path="/user/checkin/:reservationId"
                          element={<RouteProtect><CheckInInterface /></RouteProtect>}
                        />

                        {/* Historique Wallet */}
                        <Route
                          path="/user/wallet/history"
                          element={<RouteProtect><WalletHistory /></RouteProtect>}
                        />

                        {/* Formulaire Feedback */}
                        <Route
                          path="/feedback/:reservationId"
                          element={<RouteProtect><FeedbackForm /></RouteProtect>}
                        />

                        {/* Suivi Temps Réel */}
                        <Route
                          path="/user/tracking/:reservationId"
                          element={<RouteProtect><VoyageTracking /></RouteProtect>}
                        />

                        {/* Dashboard Agent PMR */}
                        <Route
                          path="/agent/dashboard"
                          element={<RouteProtect><AgentDashboard /></RouteProtect>}
                        />
                      </Routes>
                      <Footer />
                    </>
                  )}
                </div>
              </Router>
            </LanguageProvider>
          </BaggageProvider>
        </QrCodeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;