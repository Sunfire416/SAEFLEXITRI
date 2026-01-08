import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css';
import AOS from 'aos'; // Importation de AOS pour les animations
import 'aos/dist/aos.css'; // Importation des styles de AOS
import './PMR.css';
import bus from '../../assets/images/bus.png';
import { FaTaxi, FaBus, FaPlane, FaRegCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';  // Importation de Link

mapboxgl.accessToken = 'pk.eyJ1IjoianJpcHBlcjc5IiwiYSI6ImNsaW9kbGozNDBldmszcHBjamZhaG00ZjUifQ.pTtXkitNS0RjYw3LGvf1CQ';

function PMRPage() {
    const mapContainer = useRef(null);

    useEffect(() => {
        // Initialisation des animations AOS
        AOS.init({ duration: 1000 });

        const map = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [2.333333, 48.866667],
            zoom: 4.2,
        });

        map.addControl(
            new MapboxDirections({
                accessToken: mapboxgl.accessToken,
                unit: 'metric',
            }),
            'top-right'
        );

        return () => {
            map.remove();
        };
    }, []);

    return (
        <div className="pmr-container">
            {/* Section bannière */}
            <section 
                className="banner"
                style={{
                    backgroundImage: `url(${bus})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    width: "100%",
                    minHeight: "800px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    textAlign: "center",
                }}
            >
                <div className="banner-text">
                    <h1>Visualisez vos voyages !</h1>
                    {/* Utilisation de Link pour rediriger vers Boarding.js */}
                    <Link to="/user/boarding">
                        <button className="btn-reserver">Réservez</button>
                    </Link>
                </div>
            </section>
            
            {/* Section étapes avec animations AOS */}
            <section className="steps-section">
                <h2>Comment ça fonctionne ?</h2>
                <div className="steps-container">
                    <div className="step" data-aos="fade-up">
                        <div className="step-icon">1</div>
                        <h3>Choisissez votre mode</h3>
                        <p>Sélectionnez le type de transport qui convient le mieux à votre voyage.</p>
                    </div>
                    <div className="step" data-aos="fade-up" data-aos-delay="200">
                        <div className="step-icon">2</div>
                        <h3>Réservez</h3>
                        <p>Planifiez votre trajet en quelques clics directement depuis la plateforme.</p>
                    </div>
                    <div className="step" data-aos="fade-up" data-aos-delay="400">
                        <div className="step-icon">3</div>
                        <h3>Recevez votre QR Code</h3>
                        <p>Obtenez un QR code pour simplifier votre embarquement ou trajet.</p>
                    </div>
                    <div className="step" data-aos="fade-up" data-aos-delay="600">
                        <div className="step-icon">4</div>
                        <h3>Voyagez sereinement</h3>
                        <p>Profitez d’un trajet agréable grâce à FlexiTrip.</p>
                    </div>
                </div>
            </section>

            {/* Section de bienvenue */}
            <section className="welcome-section">
                <h2>Bienvenue chez FlexiTrip !</h2>
                <div className="transport-options">
                    <div className="option" data-aos="fade-right">
                        <FaTaxi className="pmr-icon" />
                        <h3>Voiture</h3>
                        <p>Parfait pour vos déplacements rapides et confortables.</p>
                    </div>
                    <div className="option" data-aos="fade-right" data-aos-delay="200">
                        <FaBus className="pmr-icon" />
                        <h3>Transports en commun</h3>
                        <p>Une manière écologique et économique de voyager.</p>
                    </div>
                    <div className="option" data-aos="fade-right" data-aos-delay="400">
                        <FaPlane className="pmr-icon" />
                        <h3>Avion</h3>
                        <p>Des solutions pour rendre vos vols plus accessibles.</p>
                    </div>
                </div>
            </section>

            {/* Section carte */}
            <section className="map-section">
                <h2 className="map-title">Visualisez votre itinéraire</h2>
                <h3 className="map-subtitle">Trouvez le chemin parfait pour votre destination.</h3>
                <div className="map-container" ref={mapContainer}></div>
            </section>

            {/* Section solution */}
            <section className="solution-section">
                <div className="solution-text">
                    <h2>Pourquoi choisir FlexiTrip ?</h2>
                    <p>
                        FlexiTrip offre une plateforme simple et intuitive pour planifier vos trajets 
                        et garantir une assistance adaptée à vos besoins. Faites confiance à notre équipe pour 
                        vous aider à rendre vos déplacements plus agréables.
                    </p>
                    {/* Utilisation de Link pour rediriger vers Contact.js */}
                    <Link to="/user/contact">
                        <button className="btn-contact">Contactez-nous</button>
                    </Link>
                </div>
            </section>
        </div>
    );
}

export default PMRPage;