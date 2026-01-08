// src/components/Spinner/Spinner.js
import React from 'react';
import PropTypes from 'prop-types';
import voyageGif from '../../assets/images/avion.gif'; // Import du GIF
import './Spinner.css';

const Spinner = ({ size = 100, message = 'Chargement ...' }) => {
    return (
        <div className="spinner-container">
            <img
                src={voyageGif} // Utilisation du GIF importé
                alt="Loading animation"
                className="spinner-gif"
                style={{ width: `${size}px`, height: `${size}px` }}
            />
            {message && <p className="spinner-message">{message}</p>}
        </div>
    );
};

Spinner.propTypes = {
    size: PropTypes.number,
    message: PropTypes.string,
};

export default Spinner;

