import React, { useState } from 'react';
import './Support.css';
import { Link } from 'react-router-dom';

const Support = () => {
    const [openFaqIndex, setOpenFaqIndex] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Toutes');

    const toggleFaq = (index) => {
        setOpenFaqIndex(openFaqIndex === index ? null : index);
    };

    const faqItems = [
        {
            category: "Transport",
            question: "Quelles options de transport sont disponibles pour les personnes à mobilité réduite (PMR) ?",
            answer: "Nous proposons une gamme d'options de transport adaptées, y compris des taxis, bus et navettes équipés de rampes et d'élévateurs pour assurer des déplacements sûrs et pratiques."
        },
        {
            category: "Réservation",
            question: "Comment puis-je réserver un transport adapté aux PMR ?",
            answer: "Vous pouvez réserver un transport PMR directement sur notre site ou en contactant notre service client. N'oubliez pas de préciser vos besoins spécifiques."
        },
        {
            category: "Coût",
            question: "Y a-t-il des frais supplémentaires pour les services PMR ?",
            answer: "Non, nous ne facturons pas de frais supplémentaires pour les services de transport accessibles. Notre objectif est de rendre les déplacements inclusifs et abordables."
        },
        {
            category: "Assistance",
            question: "Puis-je obtenir de l'aide pour monter et descendre des véhicules ?",
            answer: "Oui, notre personnel formé est disponible pour aider à monter et descendre des véhicules. Veuillez nous prévenir à l'avance pour organiser l'assistance nécessaire."
        },
        {
            category: "Annulation",
            question: "Que dois-je faire si je dois annuler mon transport PMR ?",
            answer: "En cas d'annulation ou de modification, contactez notre service client dès que possible. Nous vous aiderons à apporter les changements nécessaires."
        },
        {
            category: "Accessibilité",
            question: "Les véhicules sont-ils entièrement accessibles pour les fauteuils roulants ?",
            answer: "Oui, tous nos véhicules adaptés sont conçus pour accueillir les fauteuils roulants en toute sécurité."
        },
        {
            category: "Transport",
            question: "Quels types de véhicules sont disponibles pour les PMR ?",
            answer: "Nous disposons de taxis adaptés, de bus équipés et de minibus pouvant accueillir plusieurs passagers PMR."
        },
        {
            category: "Réservation",
            question: "Puis-je réserver un transport pour une autre personne ?",
            answer: "Oui, il est possible de réserver un transport pour un proche. Veuillez fournir les détails nécessaires pour garantir un service adapté."
        },
        {
            category: "Assistance",
            question: "Proposez-vous une assistance pour les bagages des PMR ?",
            answer: "Oui, notre personnel peut vous aider avec vos bagages lors de l'embarquement et du débarquement."
        },
        {
            category: "Coût",
            question: "Existe-t-il des subventions pour couvrir les frais de transport PMR ?",
            answer: "Certaines régions offrent des subventions ou des réductions pour le transport des PMR. Contactez les autorités locales pour plus d'informations."
        },
        {
            category: "Accessibilité",
            question: "Quels autres services sont disponibles pour les PMR en dehors du transport ?",
            answer: "Nous proposons des services d'accompagnement, des conseils pour les voyages accessibles et une assistance personnalisée."
        },
        {
            category: "Annulation",
            question: "Puis-je obtenir un remboursement en cas d'annulation ?",
            answer: "Oui, sous réserve de notre politique d'annulation, vous pouvez demander un remboursement."
        },
        // Ajoutez encore plus de questions ici
    ];

    // Filtrage des FAQs selon la recherche et la catégorie
    const filteredFaqItems = faqItems.filter(item =>
        (selectedCategory === 'Toutes' || item.category === selectedCategory) &&
        (item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="support-container">
            <h1 className="support-title">Bonjour. Comment pouvons-nous vous aider ?</h1>

            <div className="support-search-bar">
                <input
                    type="text"
                    placeholder="Rechercher des questions, des mots-clés, des sujets"
                    className="support-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="faq-container">
                {filteredFaqItems.map((item, index) => (
                    <div
                        className={`faq-item ${openFaqIndex === index ? 'open' : ''}`}
                        key={index}
                        onClick={() => toggleFaq(index)}
                    >
                        <div className="faq-question">{item.question}</div>
                        <div className="faq-answer">{item.answer}</div>
                    </div>
                ))}
                {filteredFaqItems.length === 0 && (
                    <div className="no-results">Aucun résultat trouvé pour "{searchQuery}" dans {selectedCategory}.</div>
                )}
            </div>

            <div className="support-category-filter">
                <label htmlFor="category">Filtrer par catégorie :</label>
                <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                >
                    <option value="Toutes">Toutes</option>
                    <option value="Transport">Transport</option>
                    <option value="Réservation">Réservation</option>
                    <option value="Coût">Coût</option>
                    <option value="Assistance">Assistance</option>
                    <option value="Annulation">Annulation</option>
                    <option value="Accessibilité">Accessibilité</option>
                </select>
            </div>
        </div>
    );
};

export default Support;
