/**
 * Script d'initialisation des utilisateurs par défaut
 * 
 * Ce script lit la variable d'environnement DEFAULT_USERS et crée automatiquement
 * les utilisateurs dans la base de données au démarrage de l'API.
 * 
 * Format de DEFAULT_USERS:
 * NAME|SURNAME|EMAIL|PHONE|PASSWORD|ROLE|ADDRESS|PMR_ASSISTANCE
 * 
 * Pour plusieurs utilisateurs, séparez-les par des virgules.
 */

const { User } = require('../models');
const bcrypt = require('bcrypt');

/**
 * Initialise les utilisateurs par défaut depuis les variables d'environnement
 */
async function initDefaultUsers() {
    try {
        const defaultUsersStr = process.env.DEFAULT_USERS;
        
        // Si aucune variable n'est définie, on ne fait rien
        if (!defaultUsersStr || defaultUsersStr.trim() === '') {
            console.log('[InitUsers] Aucun utilisateur par défaut configuré dans DEFAULT_USERS');
            return;
        }

        // Séparer les utilisateurs (séparés par des virgules)
        const usersArray = defaultUsersStr.split(',').map(u => u.trim()).filter(u => u !== '');
        
        if (usersArray.length === 0) {
            console.log('[InitUsers] Aucun utilisateur valide trouvé dans DEFAULT_USERS');
            return;
        }

        console.log(`[InitUsers] Initialisation de ${usersArray.length} utilisateur(s) par défaut...`);

        let createdCount = 0;
        let skippedCount = 0;

        // Traiter chaque utilisateur
        for (const userStr of usersArray) {
            try {
                // Parser les données utilisateur (format: NAME|SURNAME|EMAIL|PHONE|PASSWORD|ROLE|ADDRESS|PMR_ASSISTANCE)
                const parts = userStr.split('|').map(p => p.trim());
                
                // Vérifier qu'on a au moins les champs obligatoires (6 minimum)
                if (parts.length < 6) {
                    console.warn(`[InitUsers] Format invalide pour l'utilisateur: ${userStr}`);
                    console.warn(`[InitUsers] Format attendu: NAME|SURNAME|EMAIL|PHONE|PASSWORD|ROLE|ADDRESS|PMR_ASSISTANCE`);
                    skippedCount++;
                    continue;
                }

                // Extraire les champs (valeurs par défaut pour les optionnels)
                const [name, surname, email, phone, password, role, address = '', pmr_assistance = ''] = parts;

                // Vérifier que les champs obligatoires sont présents
                if (!name || !surname || !email || !phone || !password || !role) {
                    console.warn(`[InitUsers] Champs manquants pour l'utilisateur: ${userStr}`);
                    skippedCount++;
                    continue;
                }

                // Vérifier que le rôle est valide
                const validRoles = ['PMR', 'Accompagnant', 'Agent'];
                if (!validRoles.includes(role)) {
                    console.warn(`[InitUsers] Rôle invalide '${role}' pour l'utilisateur: ${email}`);
                    console.warn(`[InitUsers] Rôles valides: ${validRoles.join(', ')}`);
                    skippedCount++;
                    continue;
                }

                // Vérifier si l'utilisateur existe déjà (par email, qui est unique)
                const existingUser = await User.findOne({ where: { email } });
                
                if (existingUser) {
                    console.log(`[InitUsers] Utilisateur ${email} existe déjà, ignoré.`);
                    skippedCount++;
                    continue;
                }

                // Hacher le mot de passe avec bcrypt (10 rounds de salt)
                const hashedPassword = await bcrypt.hash(password, 10);

                // Créer l'utilisateur dans la base de données
                const newUser = await User.create({
                    name,
                    surname,
                    email,
                    phone,
                    address: address || null,
                    role,
                    password: hashedPassword,
                    pmr_assistance: pmr_assistance || null,
                });

                console.log(`[InitUsers] ✓ Utilisateur créé: ${name} ${surname} (${email}) - Rôle: ${role}`);
                createdCount++;
            } catch (error) {
                console.error(`[InitUsers] Erreur lors de la création de l'utilisateur "${userStr}":`, error.message);
                skippedCount++;
            }
        }

        // Résumé
        if (createdCount > 0) {
            console.log(`[InitUsers] ✓ ${createdCount} utilisateur(s) créé(s) avec succès.`);
        }
        if (skippedCount > 0) {
            console.log(`[InitUsers] ⚠ ${skippedCount} utilisateur(s) ignoré(s) (existant ou invalide).`);
        }
        if (createdCount === 0 && skippedCount === 0) {
            console.log('[InitUsers] Aucun utilisateur à créer.');
        }

    } catch (error) {
        console.error('[InitUsers] Erreur lors de l\'initialisation des utilisateurs par défaut:', error);
    }
}

module.exports = { initDefaultUsers };
