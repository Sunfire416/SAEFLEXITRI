import React, { useState } from 'react';
import SNCFReservation from '../../components/SNCFReservation/SNCFReservation';
import AFReservation from '../../components/AFReservation/AFReservation';
import RATPReservation from '../../components/RATPReservation/RATPReservation';
import './TripInfo.css';

function MyTrip() {
    const [activeTab, setActiveTab] = useState('sncf'); // Onglet actif par défaut

    const renderContent = () => {
        switch (activeTab) {
            case 'sncf':
                return <SNCFReservation />;
            case 'airfrance':
                return <AFReservation />;
            case 'ratp':
                return <RATPReservation />;
            default:
                return <SNCFReservation />;
        }
    };

    return (
        <div className="my-trip-container">
            <h2>My Trip</h2>
            <div className="tabs">
                <button
                    className={`tab-button ${activeTab === 'sncf' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sncf')}
                >
                    SNCF
                </button>
                <button
                    className={`tab-button ${activeTab === 'airfrance' ? 'active' : ''}`}
                    onClick={() => setActiveTab('airfrance')}
                >
                    Air France
                </button>
                <button
                    className={`tab-button ${activeTab === 'ratp' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ratp')}
                >
                    RATP
                </button>
            </div>
            <div className="tab-content">
                {renderContent()} {/* Affiche le contenu de l'onglet actif */}
            </div>
        </div>
    );
}

export default MyTrip;




