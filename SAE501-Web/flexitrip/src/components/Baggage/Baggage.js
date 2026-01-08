import React, { useState, useContext, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useBaggage } from "../../context/BaggageContext";
import { useQrCode } from "../../context/QrCodeContext";
import "./Baggage.css";

function Ewallet() {
  const { baggageQrCodes, setBaggageQrCodes } = useBaggage();
  const [baggageWeight, setBaggageWeight] = useState("");
  const [baggageDescription, setBaggageDescription] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const [transferMessage, setTransferMessage] = useState("");

  // Fonction pour générer et stocker un QR Code
  const generateBaggageQrCode = () => {
    if (!baggageWeight || !baggageDescription || !departure || !arrival) {
      alert("Veuillez renseigner tous les champs");
      return;
    }
    
    const baggageData = {
      weight: baggageWeight,
      description: baggageDescription,
      departure,
      arrival,
      timestamp: Date.now()
    };
    
    const qrCodeData = JSON.stringify(baggageData);
    if (qrCodeData.length > 2953) { // Limite max d'un QR Code standard
      alert("Les données sont trop volumineuses pour être encodées en QR Code.");
      return;
    }
    setBaggageQrCodes([...baggageQrCodes, qrCodeData]);
    setBaggageWeight("");
    setBaggageDescription("");
    setDeparture("");
    setArrival("");
    setTransferMessage("✅ QR Code généré et enregistré avec succès !");
    setTimeout(() => setTransferMessage(""), 3000);
  };

  // Fonction pour supprimer un QR Code spécifique
  const deleteBaggageQrCode = (index) => {
    setBaggageQrCodes((prevCodes) => prevCodes.filter((_, i) => i !== index));
  };

  return (
    <div className="ewallet-container">
      <h2 className="ewallet-title">Gestion des Bagages</h2>
      
      <div className="baggage-form">
        <input
          type="text"
          placeholder="Poids du bagage (kg)"
          value={baggageWeight}
          onChange={(e) => setBaggageWeight(e.target.value)}
        />
        
        <textarea
          placeholder="Description du bagage"
          value={baggageDescription}
          onChange={(e) => setBaggageDescription(e.target.value)}
        ></textarea>

        <input
          type="text"
          placeholder="Lieu de départ"
          value={departure}
          onChange={(e) => setDeparture(e.target.value)}
        />

        <input
          type="text"
          placeholder="Lieu d'arrivée"
          value={arrival}
          onChange={(e) => setArrival(e.target.value)}
        />
        
        <button onClick={generateBaggageQrCode}>Générer QR Code</button>
      </div>

      {baggageQrCodes.length > 0 && (
        <div className="baggage-qr-section">
          <h2>QR Codes des Bagages</h2>
          <div className="baggage-qr-container">
            {baggageQrCodes.map((qrCode, index) => {
              const baggageData = JSON.parse(qrCode);
              return (
                <div key={index} className="baggage-qr-card">
                  <QRCodeSVG value={qrCode} size={150} />
                  <p>Poids : {baggageData.weight} kg</p>
                  <p>Description : {baggageData.description}</p>
                  <p>Départ : {baggageData.departure}</p>
                  <p>Arrivée : {baggageData.arrival}</p>
                  <button onClick={() => deleteBaggageQrCode(index)}>🗑 Supprimer</button>
                </div>
              );
            })}
          </div>
          {transferMessage && <p className="transfer-message">{transferMessage}</p>}
        </div>
      )}
    </div>
  );
}

export default Ewallet;
