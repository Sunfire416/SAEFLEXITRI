import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl"; // Import Mapbox
import "mapbox-gl/dist/mapbox-gl.css"; // Import Mapbox CSS
import "./BoardingPassGenerator.css"; // Fichier CSS pour le style de la carte

// Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoianJpcHBlcjc5IiwiYSI6ImNsaW9kbGozNDBldmszcHBjamZhaG00ZjUifQ.pTtXkitNS0RjYw3LGvf1CQ';

const MapboxMap = ({ departure, destination }) => {
  const mapContainer = useRef(null); // Référence pour le conteneur de la carte
  const map = useRef(null); // Référence pour la carte Mapbox
  const [coordinates, setCoordinates] = useState({
    departure: null,
    destination: null,
  });

  // Convertir les adresses en coordonnées géographiques
  useEffect(() => {
    if (!departure || !destination) return;

    const fetchCoordinates = async (address, type) => {
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();
        if (data.features && data.features.length > 0) {
          const [longitude, latitude] = data.features[0].center;
          const placeName = data.features[0].place_name; // Nom complet du lieu
          console.log(`Résultat de géocodage pour "${address}":`, placeName);
          setCoordinates((prev) => ({ ...prev, [type]: [longitude, latitude] }));
        } else {
          console.error("Aucun résultat trouvé pour l'adresse :", address);
          alert(`Adresse "${address}" non trouvée. Veuillez entrer une adresse valide.`);
        }
      } catch (error) {
        console.error("Erreur lors de la conversion de l'adresse en coordonnées :", error);
      }
    };

    fetchCoordinates(departure, "departure");
    fetchCoordinates(destination, "destination");
  }, [departure, destination]);

  // Initialisation de la carte et tracé de l'itinéraire
  useEffect(() => {
    if (!coordinates.departure || !coordinates.destination) return;

    if (!map.current) {
      // Initialisation de la carte
      map.current = new mapboxgl.Map({
        container: mapContainer.current, // Conteneur de la carte
        style: "mapbox://styles/mapbox/streets-v11", // Style de la carte
        center: coordinates.departure, // Centré sur le point de départ
        zoom: 10, // Niveau de zoom
      });

      // Ajouter des contrôles de navigation (optionnel)
      map.current.addControl(new mapboxgl.NavigationControl());

      // Attendre que la carte soit chargée
      map.current.on("load", () => {
        // Ajouter des marqueurs pour le départ et l'arrivée
        new mapboxgl.Marker({ color: "#3887be" })
          .setLngLat(coordinates.departure)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Départ:</strong> ${departure}`))
          .addTo(map.current);

        new mapboxgl.Marker({ color: "#ff0000" })
          .setLngLat(coordinates.destination)
          .setPopup(new mapboxgl.Popup().setHTML(`<strong>Arrivée:</strong> ${destination}`))
          .addTo(map.current);

        // Tracer l'itinéraire
        fetchRoute(coordinates.departure, coordinates.destination);
      });
    } else {
      // Mettre à jour l'itinéraire si les coordonnées changent
      fetchRoute(coordinates.departure, coordinates.destination);
    }

    // Nettoyage lors du démontage du composant
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [coordinates]);

  // Fonction pour tracer l'itinéraire
  const fetchRoute = async (start, end) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        // Si un itinéraire est trouvé, l'afficher
        const route = data.routes[0].geometry; // Géométrie de l'itinéraire
        addRouteToMap(route); // Ajouter l'itinéraire à la carte

        // Centrer la carte sur l'itinéraire
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(start);
        bounds.extend(end);
        map.current.fitBounds(bounds, { padding: 50 });
      } else {
        // Si aucun itinéraire n'est trouvé, tracer une ligne droite
        const straightLine = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [start, end], // Ligne droite entre les deux points
          },
        };
        addRouteToMap(straightLine.geometry); // Ajouter la ligne droite à la carte

        // Centrer la carte sur les deux points
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend(start);
        bounds.extend(end);
        map.current.fitBounds(bounds, { padding: 50 });

        console.warn("Aucun itinéraire routier trouvé. Affichage d'une ligne droite.");
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de l'itinéraire :", error);
    }
  };

  // Fonction pour ajouter l'itinéraire à la carte
  const addRouteToMap = (route) => {
    if (map.current.getSource("route")) {
      // Mettre à jour la source de données si elle existe déjà
      map.current.getSource("route").setData({
        type: "Feature",
        properties: {},
        geometry: route,
      });
    } else {
      // Ajouter une nouvelle source de données et une couche pour l'itinéraire
      map.current.addLayer({
        id: "route",
        type: "line",
        source: {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: route,
          },
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#3887be",
          "line-width": 5,
        },
      });
    }
  };

  return <div ref={mapContainer} className="map-container" />;
};

export default MapboxMap;