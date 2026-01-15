import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useQrCode } from "../../context/QrCodeContext";
import { useBaggage } from "../../context/BaggageContext";
import { QRCodeSVG } from "qrcode.react";
import "./ewallet.css";
import ewallet from "../../assets/images/ewallet.png";

function Ewallet() {
  const { user } = useContext(AuthContext);
  const { qrCodes, setQrCodes } = useQrCode();
  const { baggageQrCodes, setBaggageQrCodes } = useBaggage();
  const [token, setToken] = useState(null);
  const [balance, setBalance] = useState(0);
  const [error, setError] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [receiverId, setReceiverId] = useState(1);

  // Fetch token from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Fetch balance and payment history
  useEffect(() => {
    if (!token || !user || !user.user_id) return;
    const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

    const fetchBalance = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/blockchain/balance`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setBalance(response.data.balance);
      } catch {
        setError("❌ Impossible de récupérer le solde.");
      }
    };

    const fetchPaymentHistory = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/blockchain/history`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setPaymentHistory(response.data);
      } catch {
        setError("❌ Impossible de récupérer l'historique des paiements.");
      }
    };


    fetchBalance();
    fetchPaymentHistory();
  }, [token, user]);


  // Handle payment
  const handlePayment = async () => {
    if (!paymentAmount || paymentAmount <= 0) {
      setError("❌ Veuillez entrer un montant valide.");
      return;
    }

    if (paymentAmount > balance) {
      setError("❌ Solde insuffisant.");
      return;
    }

    try {
      const paymentData = {
        sender: user.user_id,
        receiver: receiverId,
        amount: paymentAmount,
        description: "Paiement"
      };

      const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';
      const response = await axios.post(
        `${API_BASE_URL}/transactions/pay`,
        paymentData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200) {
        setBalance((prevBalance) => prevBalance - paymentAmount);
        setPaymentHistory((prevHistory) => [
          {
            id: Date.now(),
            date: new Date().toISOString(),
            amount: paymentAmount,
            receiver: receiverId,
          },
          ...prevHistory,
        ]);
        setError(null);
        setPaymentAmount(0);
      }
    } catch (error) {
      console.error("Erreur lors du paiement :", error);
      setError("❌ Erreur lors du paiement. Veuillez réessayer.");
    }
  };

  // Delete a transaction from payment history
  const handleDeleteTransaction = (index) => {
    setPaymentHistory((prevHistory) =>
      prevHistory.filter((_, i) => i !== index)
    );
  };

  // Delete a baggage QR code
  const handleDeleteBaggageQr = (index) => {
    setBaggageQrCodes((prev) => prev.filter((_, i) => i !== index));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return null; // Retourne null si la date est invalide
    }
    return new Date(dateString).toLocaleDateString("fr-FR", {
      timeZone: "Europe/Paris",
    });
  };

  return (
    <div className="ewallet-container">
      {/* E-wallet Card */}
      <div className="ewallet-card">
        <div className="ewallet-header">
          <img src={ewallet} alt="E-wallet Logo" className="ewallet-logo" />
          <h2 className="ewallet-title">Mon Portefeuille</h2>
        </div>
        <div className="balance-section">
          <span className="balance-amount">{balance} $</span>
          <span className="balance-label">Solde disponible</span>
        </div>
      </div>

      {/* User Profile */}
      {user && (
        <div className="user-profile">
          <h2 className="profile-title">Mon Profil</h2>
          <div className="profile-card">
            <div className="profile-info">
              <p><strong>Nom :</strong> {user.name}</p>
              <p><strong>Prénom :</strong> {user.surname}</p>
              <p><strong>Email :</strong> {user.email}</p>
              <p><strong>Adresse :</strong> {user.address}</p>
              <p><strong>Téléphone :</strong> {user.phone}</p>
              <p><strong>Rôle :</strong> <span className="user-role">{user.role}</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="payment-history-section">
        <h2 className="payment-history-title">Historique des Paiements</h2>
        {paymentHistory.length > 0 ? (
          <div className="payment-history-list">
            {paymentHistory.map((payment, index) => {
              const formattedDate = formatDate(payment.date);
              return (
                <div key={payment.id || index} className="payment-history-item">
                  {formattedDate && <p><strong>Date :</strong> {formattedDate}</p>}
                  <p><strong>Montant :</strong> {payment.amount} $</p>
                  <p><strong>Destinataire :</strong> {payment.receiver}</p>

                </div>
              );
            })}
          </div>
        ) : (
          <p className="no-payment-history-message">Aucun historique de paiement disponible.</p>
        )}
      </div>

      {/* QR Codes Section */}
      {qrCodes.length > 0 ? (
        <div className="qr-section">
          <h2 className="qr-title">Mes QR Codes</h2>
          <div className="qr-container">
            {qrCodes.map((qr, index) => (
              <div key={index} className="qr-card">
                <QRCodeSVG value={qr} size={150} />
                <p>{qr}</p>
              </div>
            ))}
          </div>
          <button className="clear-qr-button" onClick={() => setQrCodes([])}>
            Supprimer tous les QR Codes
          </button>
        </div>
      ) : (
        <p className="no-qr-message">Aucun QR Code enregistré.</p>
      )}

      {/* Baggage QR Codes Section */}
      {baggageQrCodes.length > 0 ? (
        <div className="baggage-qr-section">
          <h2 className="baggage-qr-title">QR Codes des Bagages</h2>
          <div className="baggage-qr-container">
            {baggageQrCodes.map((qrCode, index) => (
              <div key={index} className="baggage-qr-card">
                <button
                  className="delete-baggage-qr-button"
                  onClick={() => handleDeleteBaggageQr(index)}
                >
                  ×
                </button>
                <QRCodeSVG value={qrCode} size={150} />
                <p>Bagage {index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="no-baggage-qr-message">Aucun QR Code de bagage enregistré.</p>
      )}

      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default Ewallet;