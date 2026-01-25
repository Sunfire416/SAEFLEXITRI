# ✅ CHECKLIST DE TEST MANUEL - FlexiTrip Mode DEMO
**Durée estimée : 5-10 minutes**

## 🎯 Objectif
Vérifier que le mode DEMO fonctionne correctement et que le parcours des 8 User Stories est navigable.

---

## 📋 Tests à effectuer

### 1. Activation du Mode DEMO ✅
- [ ] Ouvrir le navigateur sur `http://localhost:3000`
- [ ] Vérifier que le badge "DEMO" apparaît dans la navbar (coin supérieur droit)
- [ ] Cliquer sur le badge "DEMO" → La page recharge
- [ ] Vérifier que le mode bascule (badge disparaît/réapparaît)

**Résultat attendu** : Le badge est cliquable et bascule le mode DEMO

---

### 2. Authentification (Mode DEMO) ✅
- [ ] Aller sur `/login`
- [ ] Entrer n'importe quel email/mot de passe (ex: `pmr@demo.com` / `demo123`)
- [ ] Cliquer "Connexion"
- [ ] Vérifier la redirection vers la page d'accueil
- [ ] Vérifier que le nom "Martin Dupont" apparaît dans la navbar

**Résultat attendu** : Connexion réussie sans erreur, utilisateur PMR affiché

---

### 3. Navigation Principale (Navbar simplifiée) ✅
- [ ] Vérifier que la navbar contient **exactement 3 items** :
  - "Réserver"
  - "Mon trajet"
  - "Wallet & QR"
- [ ] Vérifier l'absence d'emojis décoratifs (🏠, ✈️, etc.)
- [ ] Cliquer sur chaque item et vérifier qu'il n'y a pas d'erreur 404

**Résultat attendu** : Navigation fluide, design épuré

---

### 4. Page "Mon Trajet" (⭐ Pièce maîtresse) ✅

#### a) Affichage initial
- [ ] Aller sur `/mon-trajet`
- [ ] Vérifier l'alert "Mode DEMO activé" en haut de page
- [ ] Vérifier l'affichage du trajet "Paris Gare de Lyon → Nice Côte d'Azur"
- [ ] Vérifier le stepper des **8 User Stories** en haut
- [ ] Vérifier l'affichage des **3 segments** (Train / Bus / Avion)

#### b) Informations des segments
- [ ] **Segment 1** (Train) :
  - [ ] Icône train visible
  - [ ] "SNCF TGV" affiché
  - [ ] Agent "Marie Lefevre (TRAIN)" affiché avec téléphone
  - [ ] Badge "✅ Étape terminée" (handover completed)
  
- [ ] **Segment 2** (Bus) :
  - [ ] Icône bus visible
  - [ ] "FlixBus" affiché
  - [ ] Agent "Claude Petit (BUS)" affiché
  - [ ] Bordure bleue (segment actif)
  - [ ] Boutons "J'approche" et "Valider handover" visibles

- [ ] **Segment 3** (Avion) :
  - [ ] Icône avion visible
  - [ ] "Air France" affiché
  - [ ] Agent "Sophie Durand (FLIGHT)" affiché
  - [ ] Grisé (pas encore commencé)

#### c) Actions interactives
- [ ] Cliquer "J'approche" sur le segment bus
- [ ] Vérifier qu'un event apparaît dans "Traçabilité des événements" en bas
- [ ] Cliquer "Valider handover" sur le segment bus
- [ ] Vérifier que :
  - Le segment bus passe en "Étape terminée"
  - Le segment avion devient actif (bordure bleue)
  - Le stepper avance d'une étape

#### d) QR Code
- [ ] Scroller jusqu'en bas
- [ ] Vérifier l'affichage d'un QR code de voyage
- [ ] Le QR code doit être scannable (ou téléchargeable)

**Résultat attendu** : Parcours complet fluide, traçabilité visible, handovers fonctionnels

---

### 5. Page "Mes Voyages" ✅
- [ ] Aller sur `/user/voyages`
- [ ] Vérifier l'affichage du voyage "Paris → Nice"
- [ ] Vérifier les statistiques en haut (Total: 1, Confirmés: 1, etc.)
- [ ] Cliquer sur le voyage pour voir les détails
- [ ] Vérifier qu'aucune erreur rouge "Impossible de charger" n'apparaît

**Résultat attendu** : Données mockées affichées, aucune erreur visible

---

### 6. Page "Mes Bagages" ✅
- [ ] Aller sur `/user/bagages`
- [ ] Vérifier l'affichage de 2 bagages :
  - FXT-BAG-001 (soute, 20kg, en transit)
  - FXT-BAG-002 (cabine, 8kg, checked-in)
- [ ] Cliquer sur un bagage pour voir la timeline
- [ ] Vérifier les événements (TAG_PRINTED, DROP_OFF, TRANSFER, etc.)

**Résultat attendu** : Bagages affichés avec leur statut et timeline

---

### 7. Page "Wallet & QR" ✅
- [ ] Aller sur `/user/access` ou `/user/ewallet`
- [ ] Vérifier le solde affiché : **105 €**
- [ ] Vérifier l'historique des transactions :
  - Recharge 200€
  - Paiement voyage -195€
  - Paiement bagages -30€
  - Recharge 100€
  - → Solde final 105€
- [ ] Vérifier les QR codes de bagages affichés

**Résultat attendu** : Wallet fonctionnel, historique cohérent

---

### 8. Check-in (optionnel) ✅
- [ ] Aller sur `/user/checkin`
- [ ] Vérifier l'affichage d'un QR code de test
- [ ] Cliquer "Simuler scan"
- [ ] Vérifier l'animation de loading (1.5s)
- [ ] Vérifier le message "✅ Check-in confirmé"
- [ ] Vérifier le bouton "Voir mon trajet"

**Résultat attendu** : UX fluide, pas de textarea JSON visible

---

### 9. Boarding Pass ✅
- [ ] Aller sur `/user/boarding`
- [ ] Vérifier l'affichage de **3 boarding passes** :
  - TGV 6601 (Paris → Lyon)
  - FB 1234 (Lyon → Marseille)
  - AF 7710 (Marseille → Nice)
- [ ] Chaque pass contient : QR code, siège, gate/car, horaires

**Résultat attendu** : 3 passes générés automatiquement, un par segment

---

### 10. Fallback Automatique (Test avancé) ✅
- [ ] **Arrêter le backend API** (si en cours d'exécution)
- [ ] Rafraîchir la page `/user/voyages`
- [ ] Vérifier que le mode DEMO s'active automatiquement
- [ ] Vérifier le message console : `[FALLBACK DEMO] API error...`
- [ ] Vérifier que le badge "DEMO" apparaît

**Résultat attendu** : L'app bascule en DEMO sans crasher

---

## 🎨 Tests Design (Bonus)

### Vérification de la charte graphique ✅
- [ ] Couleurs respectées :
  - Primary : `#2eb378` (vert)
  - Secondary : `#5bbcea` (bleu)
  - Text : `#393839` (gris foncé)
  - Background : `#F6F7F9` (gris clair)
- [ ] Tous les boutons ont `border-radius: 12px`
- [ ] Tous les Card/Paper ont `border-radius: 12px`
- [ ] Police Inter utilisée partout
- [ ] Absence d'emojis décoratifs dans l'UI principale
- [ ] Pas de dégradés violets/agressifs

**Résultat attendu** : UI cohérente et professionnelle

---

## ❌ Problèmes à signaler

Si l'un des tests échoue, noter :
1. **Page concernée** (URL exacte)
2. **Action effectuée** (clic sur bouton X, navigation vers Y)
3. **Erreur observée** (console, message d'erreur, comportement)
4. **Capture d'écran** (si possible)

---

## ✅ Validation finale

**Le démonstrateur est prêt si** :
- ✅ Mode DEMO activable/désactivable
- ✅ Authentification fonctionne
- ✅ Page "Mon Trajet" affiche les 3 segments + handovers
- ✅ Pas d'erreur rouge "Impossible de charger"
- ✅ Stepper des 8 US visible et fonctionnel
- ✅ QR codes générés partout
- ✅ Design propre (Inter, radius 12, couleurs charte)

---

**🎉 Prêt pour l'évaluation !**
