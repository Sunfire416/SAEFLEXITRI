import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import axios from 'axios';
import './WalletHistory.css';

const WalletHistory = () => {
    const { user } = useContext(AuthContext);
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('all'); // all, sent, received

    useEffect(() => {
        if (user?.user_id) {
            fetchWalletData();
        }
    }, [user]);

    const fetchWalletData = async () => {
        try {
            setLoading(true);
            setError(null);

            const API_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            };

            // 1. Récupérer le solde (Route sans ID à la fin)
            const balanceRes = await axios.get(`${API_URL}/blockchain/balance`, config);
            setBalance(balanceRes.data.balance || 0);

            // 2. Récupérer l'historique (Route /history et non /historic)
            const historyRes = await axios.get(`${API_URL}/blockchain/history`, config);

            // On s'assure de prendre les données de la blockchain
            const txData = historyRes.data.history || historyRes.data || [];
            setTransactions(txData);

        } catch (err) {
            console.error('Erreur:', err);
            setError('Impossible de charger les données');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatAmount = (amount) => {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const getTransactionType = (transaction) => {
        const userId = String(user.user_id);
        if (transaction.sender === userId) return 'sent';
        if (transaction.receiver === userId) return 'received';
        return 'unknown';
    };

    const getFilteredTransactions = () => {
        if (filter === 'all') return transactions;
        return transactions.filter(t => getTransactionType(t) === filter);
    };

    const exportToPDF = () => {
        alert('Génération de facture PDF - Fonctionnalité en développement');
        // TODO: Implémenter la génération PDF avec jsPDF ou html2pdf
    };

    const downloadCSV = () => {
        const csvContent = [
            ['Date', 'Type', 'Montant', 'Expéditeur', 'Destinataire'],
            ...transactions.map(t => [
                formatDate(t.timestamp || t.createdAt),
                getTransactionType(t) === 'sent' ? 'Envoyé' : 'Reçu',
                t.amount,
                t.sender,
                t.receiver
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    if (loading) {
        return (
            <div className="wallet-history-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Chargement de l'historique...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="wallet-history-container">
                <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    <p>{error}</p>
                    <button onClick={fetchWalletData} className="retry-button">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const filteredTransactions = getFilteredTransactions();

    return (
        <div className="wallet-history-container">
            <div className="wallet-header">
                <h1>💰 Historique du Portefeuille</h1>
                <div className="balance-card">
                    <span className="balance-label">Solde actuel</span>
                    <span className="balance-amount">{formatAmount(balance)}</span>
                </div>
            </div>

            <div className="wallet-actions">
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        📋 Toutes ({transactions.length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'sent' ? 'active' : ''}`}
                        onClick={() => setFilter('sent')}
                    >
                        📤 Envoyées ({transactions.filter(t => getTransactionType(t) === 'sent').length})
                    </button>
                    <button
                        className={`filter-btn ${filter === 'received' ? 'active' : ''}`}
                        onClick={() => setFilter('received')}
                    >
                        📥 Reçues ({transactions.filter(t => getTransactionType(t) === 'received').length})
                    </button>
                </div>

                <div className="export-buttons">
                    <button onClick={downloadCSV} className="export-btn csv-btn">
                        📊 Exporter CSV
                    </button>
                    <button onClick={exportToPDF} className="export-btn pdf-btn">
                        📄 Facture PDF
                    </button>
                </div>
            </div>

            <div className="transactions-list">
                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📭</span>
                        <h3>Aucune transaction</h3>
                        <p>Vous n'avez pas encore effectué de transactions</p>
                    </div>
                ) : (
                    filteredTransactions.map((transaction, index) => {
                        const type = getTransactionType(transaction);
                        const isPositive = type === 'received';

                        return (
                            <div key={transaction._id || index} className={`transaction-card ${type}`}>
                                <div className="transaction-icon">
                                    {isPositive ? '📥' : '📤'}
                                </div>
                                <div className="transaction-details">
                                    <div className="transaction-main">
                                        <span className="transaction-type">
                                            {isPositive ? 'Reçu de' : 'Envoyé à'}
                                        </span>
                                        <span className="transaction-party">
                                            {isPositive
                                                ? `Utilisateur ${transaction.sender}`
                                                : `Utilisateur ${transaction.receiver}`
                                            }
                                        </span>
                                    </div>
                                    <div className="transaction-date">
                                        {formatDate(transaction.timestamp || transaction.createdAt)}
                                    </div>
                                </div>
                                <div className={`transaction-amount ${isPositive ? 'positive' : 'negative'}`}>
                                    {isPositive ? '+' : '-'}{formatAmount(Math.abs(transaction.amount))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {filteredTransactions.length > 0 && (
                <div className="wallet-summary">
                    <div className="summary-item">
                        <span className="summary-label">Total transactions :</span>
                        <span className="summary-value">{filteredTransactions.length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="summary-label">Montant total :</span>
                        <span className="summary-value">
                            {formatAmount(
                                filteredTransactions.reduce((sum, t) =>
                                    sum + Math.abs(t.amount), 0
                                )
                            )}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WalletHistory;
