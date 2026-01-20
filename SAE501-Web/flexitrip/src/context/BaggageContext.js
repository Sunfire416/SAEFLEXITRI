import React, { createContext, useState, useContext, useEffect } from "react";

// Créer le contexte pour les QR codes des bagages
const BaggageContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useBaggage = () => useContext(BaggageContext);

// Provider pour stocker les QR codes des bagages
export const BaggageProvider = ({ children }) => {
  const [baggageQrCodes, setBaggageQrCodes] = useState(() => {
    const savedBaggageQrCodes = localStorage.getItem("baggageQrCodes");

    // Parse en sécurité pour éviter de casser la page si le JSON est corrompu
    if (!savedBaggageQrCodes) return [];
    try {
      const parsed = JSON.parse(savedBaggageQrCodes);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("baggageQrCodes localStorage invalide, on réinitialise", err);
      localStorage.removeItem("baggageQrCodes");
      return [];
    }
  });

  // Sauvegarder les QR codes dans localStorage lorsqu'ils changent
  useEffect(() => {
    localStorage.setItem("baggageQrCodes", JSON.stringify(baggageQrCodes));
  }, [baggageQrCodes]);

  return (
    <BaggageContext.Provider value={{ baggageQrCodes, setBaggageQrCodes }}>
      {children}
    </BaggageContext.Provider>
  );
};