/**
 * GUIDE MIGRATION: MongoDB/MySQL/Sequelize → Supabase
 * ====================================================
 * 
 * ÉTAPES COMPLÉTÉES:
 * ✅ 1. Service centralisé Supabase créé (supabaseService.js)
 * ✅ 2. Types TypeScript définis (types/supabase.types.ts)
 * ✅ 3. Config database mise à jour
 * 
 * ÉTAPES À COMPLETER:
 * ⏳ 4. Adapter les Models → Services
 * ⏳ 5. Adapter les Controllers
 * ⏳ 6. Nettoyer package.json (supprimer mongoose, sequelize, mysql2)
 * ⏳ 7. Tester l'API
 * 
 * FICHIERS À IGNORER/GARDER TELS QUELS:
 * - /neo4j/* (Graph DB, peut rester si utilisé pour recommandations)
 * - /scripts/* (Garder pour migration données si nécessaire)
 * 
 * MODÈLES À REMPLACER (dans /models):
 * - User.js → Appeler supabaseService.createUser() au lieu de User.create()
 * - Voyage.js → Appeler supabaseService.createVoyage() au lieu de Voyage.create()
 * - Reservations.js → Appeler supabaseService.createReservation()
 * - Transaction.js → Appeler supabaseService.createTransaction()
 * - Notification.js → Appeler supabaseService.createNotification()
 * - Agent.js → Utiliser table users avec role='Agent'
 * - PriseEnCharge.js → Peut devenir une vue Supabase
 * - BoardingPass.js → Peut devenir une table ou vue Supabase
 * 
 * MIGRATION PATTERN:
 * 
 * AVANT (Sequelize):
 * ```
 * const user = await User.create({ name: 'John', email: 'john@example.com' });
 * ```
 * 
 * APRÈS (Supabase):
 * ```
 * const { supabase } = require('../config/database');
 * const user = await supabase.createUser({ name: 'John', email: 'john@example.com' });
 * ```
 * 
 * RECHERCHER/REMPLACER PATTERNS:
 * 
 * 1. Imports Sequelize:
 *    - FROM: const { DataTypes } = require('sequelize');
 *    - TO: // Utiliser des types depuis types/supabase.types.ts
 * 
 * 2. Model.create():
 *    - FROM: const result = await Model.create(data);
 *    - TO: const result = await supabase.create[Model](data);
 * 
 * 3. Model.findOne():
 *    - FROM: const result = await Model.findOne({ where: { id } });
 *    - TO: const result = await supabase.get[Model]ById(id);
 * 
 * 4. Model.findAll():
 *    - FROM: const results = await Model.findAll({ where: { status } });
 *    - TO: const results = await supabase.get[Model]sByStatus(status);
 * 
 * 5. Model.update():
 *    - FROM: await Model.update(data, { where: { id } });
 *    - TO: await supabase.update[Model](id, data);
 * 
 * 6. Transactions (OBSOLÈTE avec triggers Supabase):
 *    - FROM: Sequelize transactions
 *    - TO: Les triggers Supabase gèrent automatiquement
 * 
 * TABLES SUPABASE ACTUELLES:
 * - users (PK: user_id UUID)
 * - voyages (PK: id_voyage UUID)
 * - reservations (PK: reservation_id UUID, UK: num_reza_mmt)
 * - pmr_missions (PK: id UUID, UK: reservation_id)
 * - transactions (PK: id UUID)
 * - blockchain (PK: id UUID, UK: hash)
 * - notifications (PK: notification_id UUID)
 * 
 * VUES SUPABASE:
 * - blockchain_details (blockchain + user_name, user_email)
 * - reservations_completes (reservations + user + voyage)
 * - voyages_details (voyages + pmr identity + accompagnant identity)
 * 
 * RLS POLICIES:
 * - Tous les inserts généralement ouvert (public)
 * - SELECT/UPDATE limité par auth.uid() ou rôle
 * - Appels serveur utilisent service_role (bypasse RLS)
 * 
 * TRANSACTIONS FINANCER:
 * - Declenchées automatiquement par TRIGGER SQL
 * - Trigger: tr_wallet_sync (BEFORE INSERT sur transactions)
 * - Trigger: tr_update_balance (AFTER INSERT sur transactions)
 * - Trigger: tr_sync_blockchain (AFTER INSERT sur transactions)
 * 
 * CHECKLIST MIGRATION PAR FICHIER:
 * [ ] models/User.js - Remplacer Sequelize → supabaseService
 * [ ] models/Voyage.js
 * [ ] models/Reservations.js
 * [ ] models/Transaction.js
 * [ ] models/Notification.js
 * [ ] models/Agent.js
 * [ ] models/index.js - Supprimer associations Sequelize
 * [ ] controllers/userController.js
 * [ ] controllers/voyageController.js
 * [ ] controllers/reservationController.js
 * [ ] controllers/transactionController.js
 * [ ] controllers/notificationController.js
 * [ ] services/bookingService.js
 * [ ] package.json - Supprimer dépendances obsolètes
 */

module.exports = {};
