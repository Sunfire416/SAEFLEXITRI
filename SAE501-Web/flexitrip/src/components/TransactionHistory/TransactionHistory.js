import React from 'react';

function TransactionHistory({ transactions }) {
    return (
        <div className="transaction-history">
            <h2>Historique des Transactions</h2>
            <ul>
                {transactions.map((transaction, index) => (
                    <li key={index} className="transaction-item">
                        {transaction}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TransactionHistory;
