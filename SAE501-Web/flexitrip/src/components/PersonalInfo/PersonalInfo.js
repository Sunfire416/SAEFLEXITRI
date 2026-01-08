import React, { useState } from 'react';

function PersonalInfo() {
    const [personalInfo, setPersonalInfo] = useState({
        nom: "Hadrachi",
        prenom: "Nael",
        age: 19,
        poids: "72 kg",
        lieu: "Maroc",
        email: "nael@example.com",
        situation: "Personne âgée",
    });

    const [isEditing, setIsEditing] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setPersonalInfo({ ...personalInfo, [name]: value });
    };

    const toggleEdit = () => {
        setIsEditing(!isEditing);
    };

    return (
        <div className="personal-info-container">
            <h2>Informations Personnelles</h2>
            {Object.keys(personalInfo).map((key) => (
                <div key={key} className="info-field">
                    <label>{key.charAt(0).toUpperCase() + key.slice(1)} :</label>
                    {isEditing ? (
                        <input
                            type="text"
                            name={key}
                            value={personalInfo[key]}
                            onChange={handleInputChange}
                        />
                    ) : (
                        <span>{personalInfo[key]}</span>
                    )}
                </div>
            ))}
            <button onClick={toggleEdit} className="edit-button">
                {isEditing ? "Enregistrer" : "Modifier"}
            </button>
        </div>
    );
}

export default PersonalInfo;
