import React, { useContext } from 'react';
import './LanguageSelector.css'; // Créez ce fichier CSS pour le style
import { LanguageContext } from '../../context/LanguageContext';

const languages = [
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'FR', name: 'Français', flag: '🇫🇷' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'RU', name: 'Русский', flag: '🇷🇺' },
   
];

const LanguageSelector = () => {
    const { language, toggleLanguage } = useContext(LanguageContext);

    return (
        <div className="language-selector">
            <button className="language-button">
                {languages.find((lang) => lang.code === language)?.flag} {language}
                <span className="language-arrow">▼</span>
            </button>
            <ul className="language-menu">
                {languages.map((lang) => (
                    <li
                        key={lang.code}
                        className={`language-item ${lang.code === language ? 'active' : ''}`}
                        onClick={() => toggleLanguage(lang.code)}
                    >
                        <span className="flag">{lang.flag}</span> {lang.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default LanguageSelector;
