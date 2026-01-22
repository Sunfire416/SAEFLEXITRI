import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { QrCodeProvider } from "./context/QrCodeContext";
import { BaggageProvider } from "./context/BaggageContext";
import { NotificationProvider } from "./context/NotificationContext";
import Spinner from "./components/Spinner/Spinner";
import RouteProtect from "./utils/RouteProtect";

// Pages
import HomePage from "./pages/HomePage";
import EwalletPage from "./pages/EwalletPage";
import BoardingPage from "./pages/BoardingPage";
import BoardingGatePage from "./pages/BoardingGatePage";
import BookingResult from "./pages/BookingResult";
import BagagePage from "./pages/BagagePage";
import UserAccessPage from "./pages/UserAccessPage";
import PriseEnChargeValidation from "./pages/PriseEnChargeValidation";
import SuiviPriseEnCharge from "./pages/SuiviPriseEnCharge";
import AgentAssignmentPage from "./pages/AgentAssignmentPage";
import BaggageDashboard from "./pages/BaggageDashboard";
import BaggageDetail from "./pages/BaggageDetail";
import BaggageScan from "./pages/BaggageScan";
import ChatPage from "./pages/ChatPage";

// Components
import ProfilePage from "./components/Profile/Profile";
import UserSettingsPage from "./components/User_settings/User_settings";
import Enrollment from "./components/Enrollment/Enrollment";
import CheckInKiosk from "./components/CheckIn/CheckInKiosk";
import CheckInInterface from "./components/CheckIn/CheckInInterface";
import NotificationCenter from "./components/Notifications/NotificationCenter";
import VoyageHistory from "./components/Voyages/VoyageHistory";
import LoginPage from "./components/Login/Login";
import Signup from "./components/Signup/Signup";
import EditUser from "./components/EditerProfil/EditProfil";
import WalletHistory from "./components/Wallet/WalletHistory";
import FeedbackForm from "./components/Feedback/FeedbackForm";
import VoyageTracking from "./components/Tracking/VoyageTracking";
import AgentDashboard from "./pages/AgentDashboard";
import PmrAssistance from "./components/PmrAssistance/PmrAssistance";
import PmrHome from "./components/Pmr_home/Pmr_home";

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
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/ewallet" element={<EwalletPage />} />
                        <Route path="/enrollment" element={<Enrollment />} />
                        <Route path="/checkin" element={<CheckInKiosk />} />
                        <Route path="/baggage-tracking" element={<BagagePage />} />
                        <Route path="/pmr-assistance" element={<PmrAssistance />} />
                        <Route path="/prise-en-charge/validate/:token" element={<PriseEnChargeValidation />} />

                        {/* Protected Routes */}
                        <Route path="/user/home" element={<RouteProtect><HomePage /></RouteProtect>} />
                        <Route path="/user/ewallet" element={<RouteProtect><EwalletPage /></RouteProtect>} />
                        <Route path="/user/profile" element={<RouteProtect><ProfilePage /></RouteProtect>} />
                        <Route path="/user/edit-profile" element={<RouteProtect><EditUser /></RouteProtect>} />
                        <Route path="/user/settings" element={<RouteProtect><UserSettingsPage /></RouteProtect>} />
                        <Route path="/user/access" element={<RouteProtect><UserAccessPage /></RouteProtect>} />
                        <Route path="/user/boarding" element={<RouteProtect><BoardingPage /></RouteProtect>} />
                        <Route path="/user/boarding-gate" element={<RouteProtect><BoardingGatePage /></RouteProtect>} />
                        <Route path="/user/enrollment" element={<RouteProtect><Enrollment /></RouteProtect>} />
                        <Route path="/user/checkin" element={<RouteProtect><CheckInKiosk /></RouteProtect>} />
                        <Route path="/user/checkin/:reservationId" element={<RouteProtect><CheckInInterface /></RouteProtect>} />
                        <Route path="/user/notifications" element={<RouteProtect><NotificationCenter /></RouteProtect>} />
                        <Route path="/user/voyages" element={<RouteProtect><VoyageHistory /></RouteProtect>} />
                        <Route path="/user/booking-result" element={<RouteProtect><BookingResult /></RouteProtect>} />
                        <Route path="/user/wallet/history" element={<RouteProtect><WalletHistory /></RouteProtect>} />
                        <Route path="/feedback/:reservationId" element={<RouteProtect><FeedbackForm /></RouteProtect>} />
                        <Route path="/user/tracking/:reservationId" element={<RouteProtect><VoyageTracking /></RouteProtect>} />
                        <Route path="/user/pmr-assistance" element={<RouteProtect><PmrAssistance /></RouteProtect>} />
                        <Route path="/pmr/home" element={<RouteProtect><PmrHome /></RouteProtect>} />
                        <Route path="/user/agent-assignment" element={<RouteProtect><AgentAssignmentPage /></RouteProtect>} />
                        <Route path="/suivi-prise-en-charge/:reservationId" element={<RouteProtect><SuiviPriseEnCharge /></RouteProtect>} />

                        {/* Chat (PMR / Agent) */}
                        <Route path="/chat/reservation/:reservationId/etape/:etapeNumero" element={<RouteProtect allowedRoles={["PMR", "Agent"]}><ChatPage /></RouteProtect>} />

                        {/* Bagages (PMR / Accompagnant) */}
                        <Route path="/user/bagages" element={<RouteProtect allowedRoles={["PMR", "Accompagnant"]}><BaggageDashboard /></RouteProtect>} />
                        <Route path="/user/bagages/:bagageId" element={<RouteProtect allowedRoles={["PMR", "Accompagnant"]}><BaggageDetail /></RouteProtect>} />

                        {/* Agent PMR Dashboard */}
                        <Route path="/agent/dashboard" element={<RouteProtect allowedRoles={["Agent"]}><AgentDashboard /></RouteProtect>} />

                        {/* Agent: scan bagage */}
                        <Route path="/agent/bagages/scan" element={<RouteProtect allowedRoles={["Agent"]}><BaggageScan /></RouteProtect>} />
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