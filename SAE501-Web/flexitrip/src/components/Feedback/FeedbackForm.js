import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import './FeedbackForm.css';

const FeedbackForm = () => {
    const { reservationId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [loading, setLoading] = useState(false);
    const [existingReview, setExistingReview] = useState(null);
    const [reservation, setReservation] = useState(null);

    const [formData, setFormData] = useState({
        ratings: {
            overall: 5,
            accessibility: 5,
            assistanceQuality: 5,
            punctuality: 5,
            comfort: 5
        },
        comment: '',
        issues: [],
        suggestions: '',
        wouldRecommend: true
    });

    const issuesOptions = [
        { value: 'rampe_absente', label: '🚧 Rampe d\'accès absente' },
        { value: 'personnel_non_forme', label: '👥 Personnel non formé PMR' },
        { value: 'delai_attente', label: '⏱️ Délai d\'attente excessif' },
        { value: 'equipement_defectueux', label: '🔧 Équipement défectueux' },
        { value: 'information_insuffisante', label: 'ℹ️ Information insuffisante' },
        { value: 'autre', label: '📝 Autre problème' }
    ];

    useEffect(() => {
        if (reservationId && user?.user_id) {
            fetchData();
        }
    }, [reservationId, user]);

    const fetchData = async () => {
        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const token = localStorage.getItem('token');

            // Récupérer la réservation
            const resResponse = await axios.get(
                `${API_URL}/voyages/details/${reservationId}?user_id=${user.user_id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setReservation(resResponse.data);

            // Vérifier si un avis existe déjà
            try {
                const reviewResponse = await axios.get(
                    `${API_URL}/api/review/reservation/${reservationId}?userId=${user.user_id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setExistingReview(reviewResponse.data);
                setFormData({
                    ratings: reviewResponse.data.ratings,
                    comment: reviewResponse.data.comment || '',
                    issues: reviewResponse.data.issues || [],
                    suggestions: reviewResponse.data.suggestions || '',
                    wouldRecommend: reviewResponse.data.wouldRecommend
                });
            } catch (err) {
                // Pas d'avis existant - normal
                if (err.response?.status !== 404) {
                    console.error('Erreur lors de la récupération de l\'avis:', err);
                }
            }
        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            alert('Impossible de charger la réservation');
        }
    };

    const handleRatingChange = (category, value) => {
        setFormData(prev => ({
            ...prev,
            ratings: {
                ...prev.ratings,
                [category]: value
            }
        }));
    };

    const handleIssueToggle = (issueValue) => {
        setFormData(prev => {
            const issues = prev.issues.includes(issueValue)
                ? prev.issues.filter(i => i !== issueValue)
                : [...prev.issues, issueValue];
            return { ...prev, issues };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:17777';
            const token = localStorage.getItem('token');

            const payload = {
                reservationId: parseInt(reservationId),
                userId: user.user_id,
                ...formData
            };

            if (existingReview) {
                // Mise à jour
                await axios.put(
                    `${API_URL}/api/review/${existingReview._id}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('✅ Avis mis à jour avec succès !');
            } else {
                // Création
                await axios.post(
                    `${API_URL}/api/review`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                alert('✅ Avis soumis avec succès !');
            }

            navigate('/user/voyages');
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
            alert('❌ Erreur lors de la soumission de l\'avis');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (category, currentValue) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        className={`star ${star <= currentValue ? 'active' : ''}`}
                        onClick={() => handleRatingChange(category, star)}
                    >
                        ★
                    </button>
                ))}
                <span className="rating-value">{currentValue}/5</span>
            </div>
        );
    };

    if (!reservation) {
        return (
            <div className="feedback-container">
                <div className="loading-state">Chargement...</div>
            </div>
        );
    }

    return (
        <div className="feedback-container">
            <div className="feedback-header">
                <h1>⭐ {existingReview ? 'Modifier votre avis' : 'Évaluer votre voyage'}</h1>
                <div className="reservation-info">
                    <p><strong>{reservation.Lieu_depart}</strong> → <strong>{reservation.Lieu_arrivee}</strong></p>
                    <span className="transport-badge">{reservation.Type_Transport}</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="feedback-form">
                {/* Évaluations par étoiles */}
                <div className="rating-section">
                    <h2>📊 Vos évaluations</h2>

                    <div className="rating-item">
                        <label>Note globale</label>
                        {renderStars('overall', formData.ratings.overall)}
                    </div>

                    <div className="rating-item">
                        <label>♿ Accessibilité PMR</label>
                        {renderStars('accessibility', formData.ratings.accessibility)}
                    </div>

                    <div className="rating-item">
                        <label>🤝 Qualité de l'assistance</label>
                        {renderStars('assistanceQuality', formData.ratings.assistanceQuality)}
                    </div>

                    <div className="rating-item">
                        <label>⏰ Ponctualité</label>
                        {renderStars('punctuality', formData.ratings.punctuality)}
                    </div>

                    <div className="rating-item">
                        <label>💺 Confort</label>
                        {renderStars('comfort', formData.ratings.comfort)}
                    </div>
                </div>

                {/* Problèmes rencontrés */}
                <div className="issues-section">
                    <h2>⚠️ Problèmes rencontrés (optionnel)</h2>
                    <div className="issues-grid">
                        {issuesOptions.map(issue => (
                            <label key={issue.value} className="issue-checkbox">
                                <input
                                    type="checkbox"
                                    checked={formData.issues.includes(issue.value)}
                                    onChange={() => handleIssueToggle(issue.value)}
                                />
                                <span>{issue.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Commentaire */}
                <div className="comment-section">
                    <h2>💬 Votre commentaire (optionnel)</h2>
                    <textarea
                        value={formData.comment}
                        onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        placeholder="Partagez votre expérience en détail..."
                        rows="5"
                        maxLength="1000"
                    />
                    <span className="char-count">{formData.comment.length}/1000</span>
                </div>

                {/* Suggestions */}
                <div className="suggestions-section">
                    <h2>💡 Suggestions d'amélioration (optionnel)</h2>
                    <textarea
                        value={formData.suggestions}
                        onChange={(e) => setFormData({ ...formData, suggestions: e.target.value })}
                        placeholder="Comment pouvons-nous améliorer nos services PMR ?"
                        rows="3"
                        maxLength="500"
                    />
                    <span className="char-count">{formData.suggestions.length}/500</span>
                </div>

                {/* Recommandation */}
                <div className="recommendation-section">
                    <h2>👍 Recommandation</h2>
                    <label className="recommendation-toggle">
                        <input
                            type="checkbox"
                            checked={formData.wouldRecommend}
                            onChange={(e) => setFormData({ 
                                ...formData, 
                                wouldRecommend: e.target.checked 
                            })}
                        />
                        <span>Je recommande ce service à d'autres personnes PMR</span>
                    </label>
                </div>

                {/* Boutons */}
                <div className="form-actions">
                    <button 
                        type="button" 
                        onClick={() => navigate('/user/voyages')}
                        className="cancel-btn"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit" 
                        className="submit-btn"
                        disabled={loading}
                    >
                        {loading ? 'Envoi...' : existingReview ? 'Mettre à jour' : 'Soumettre l\'avis'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FeedbackForm;
