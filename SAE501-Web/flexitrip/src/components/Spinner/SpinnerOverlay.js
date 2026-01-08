// src/components/Spinner/SpinnerOverlay.js
import React from 'react';
import PropTypes from 'prop-types';
import voyageGif from '../../assets/images/avion.gif';  // Import du GIF
import './SpinnerOverlay.css'; // Import des styles CSS

const SpinnerOverlay = ({ size = 400, message = 'Chargement ...' }) => {
    return (
        <div className="spinner-overlay">
            <div className="spinner-container">
                <img
                    src={voyageGif} // Utilisation du GIF importé
                    alt="Loading animation"
                    className="spinner-gif"
                    style={{ width: `${size}px`, height: `${size}px` }} // Taille dynamique
                />
                {message && <p className="spinner-message">{message}</p>}
            </div>
        </div>
    );
};

SpinnerOverlay.propTypes = {
    size: PropTypes.number, // Taille du GIF
    message: PropTypes.string, // Message de chargement
};

export default SpinnerOverlay;
