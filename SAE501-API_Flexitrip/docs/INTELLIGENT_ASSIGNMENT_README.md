# Système d'Assignation Intelligente IA - Guide d'utilisation

## Introduction

Ce système permet l'assignation automatique et intelligente des agents PMR aux missions, avec priorisation dynamique et réassignation en temps réel.

## Caractéristiques Principales

✅ **Assignation Automatique** - Algorithme de scoring multi-critères (disponibilité, compétences, proximité, charge, priorité)  
✅ **Priorisation Dynamique** - Réévaluation en temps réel selon incidents, retards, correspondances critiques  
✅ **Réassignation Intelligente** - Changement d'agent automatique en situation critique  
✅ **Monitoring Continu** - Surveillance des missions actives avec alertes  
✅ **API RESTful** - Endpoints complets pour intégration

## Démarrage Rapide

### 1. Initialiser un Agent

```bash
# Créer la disponibilité d'un agent
curl -X PUT http://localhost:3000/api/intelligent-assignment/agent-availability/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "available",
    "current_location": {
      "lat": 48.8566,
      "lng": 2.3522,
      "location_name": "Gare de Lyon"
    },
    "shift_start": "08:00:00",
    "shift_end": "16:00:00",
    "max_missions_per_day": 8
  }'

# Définir les compétences
curl -X PUT http://localhost:3000/api/intelligent-assignment/agent-skills/1 \
  -H "Content-Type: application/json" \
  -d '{
    "disability_types": ["wheelchair", "visual"],
    "certifications": ["railway", "medical"],
    "languages": ["fr", "en"],
    "experience_level": "senior",
    "transport_modes": ["train", "bus"]
  }'
```

### 2. Assigner un Agent à une Mission

```bash
curl -X POST http://localhost:3000/api/intelligent-assignment/assign \
  -H "Content-Type: application/json" \
  -d '{
    "prise_en_charge_id": 100,
    "user_id": 50,
    "location": {
      "lat": 48.8447,
      "lng": 2.3736
    },
    "transport_type": "train",
    "is_critical_connection": false,
    "priority_level": "normal"
  }'
```

**Réponse:**
```json
{
  "success": true,
  "assignment": {
    "agent": {
      "id": 1,
      "name": "Jean Dupont",
      "phone": "0612345678"
    },
    "score": {
      "totalScore": 87.5,
      "breakdown": {
        "availability": 84.0,
        "skills": 97.0,
        "proximity": 85.0,
        "workload": 75.0,
        "priority": 60.0
      }
    }
  }
}
```

### 3. Surveillance des Missions

```bash
# Lancer le monitoring
curl -X POST http://localhost:3000/api/intelligent-assignment/monitor

# Résultat
{
  "success": true,
  "monitoring": {
    "total": 15,
    "reevaluated": 15,
    "priority_changed": 3,
    "actions_required": 2,
    "reassignments": 1
  }
}
```

### 4. Réévaluer une Mission Spécifique

```bash
curl -X POST http://localhost:3000/api/intelligent-assignment/reevaluate-priority \
  -H "Content-Type: application/json" \
  -d '{
    "prise_en_charge_id": 100
  }'
```

### 5. Réassigner un Agent

```bash
curl -X POST http://localhost:3000/api/intelligent-assignment/reassign \
  -H "Content-Type: application/json" \
  -d '{
    "prise_en_charge_id": 100,
    "reason": "critical_delay"
  }'
```

## Algorithme de Scoring

### Formule

```
Score Total = (Disponibilité × 0.30) + (Compétences × 0.25) + 
              (Proximité × 0.25) + (Charge × 0.15) + (Priorité × 0.05)
```

### Critères de Disponibilité (30%)

- Statut agent (available, busy, on_mission, etc.)
- Charge de travail actuelle
- Missions en cours
- Capacité restante

### Critères de Compétences (25%)

- Type de handicap pris en charge
- Niveau d'assistance maximum
- Mode de transport maîtrisé
- Niveau d'expérience
- Note moyenne

### Critères de Proximité (25%)

- Distance GPS (Haversine)
- < 2 km : 100 points
- < 5 km : 85 points
- < 10 km : 70 points
- < 20 km : 50 points

### Critères de Charge (15%)

- Nombre de missions en cours
- Total missions du jour
- Temps de repos depuis dernière mission

### Critères de Priorité PMR (5%)

- Niveau de dépendance du PMR
- Correspondance critique ou non

## Priorisation Dynamique

### Niveaux de Priorité

```
LOW → NORMAL → HIGH → URGENT → CRITICAL
```

### Déclencheurs d'Escalade

- **Incidents actifs** : Sévérité critique/élevée
- **Correspondances critiques** : < 30 minutes
- **Retards** : > 30 minutes
- **Dépendance élevée** : Complete/Full

## Réassignation Automatique

### Raisons de Réassignation

- `agent_unavailable` - Agent plus disponible
- `critical_delay` - Retard critique détecté
- `incident` - Incident bloquant
- `connection_risk` - Risque correspondance
- `better_agent_available` - Meilleur agent disponible
- `escalation_required` - Besoin d'expertise supérieure

## Intégration

### Monitoring Automatique (Cron)

Configurez un cron job pour surveiller les missions régulièrement :

```bash
# Toutes les 5 minutes
*/5 * * * * curl -X POST http://localhost:3000/api/intelligent-assignment/monitor
```

### Webhooks

Intégrez les événements d'assignation dans votre système :

```javascript
// Après assignation
const assignment = await intelligentAssignmentService.assignBestAgent(...);
await webhookService.send('agent.assigned', assignment);
```

### Notifications Temps Réel

Utilisez les notifications déjà intégrées ou ajoutez WebSocket :

```javascript
io.to(`agent_${agent_id}`).emit('new_mission', missionData);
io.to(`user_${user_id}`).emit('agent_assigned', agentData);
```

## Statistiques

```bash
# Récupérer les statistiques
curl http://localhost:3000/api/intelligent-assignment/statistics?period=today

# Réponse
{
  "success": true,
  "statistics": {
    "missions": {
      "total": 50,
      "assigned": 48,
      "unassigned": 2,
      "critical": 5,
      "reassigned": 3,
      "assignment_rate": "96.00"
    },
    "agents": {
      "available": 15,
      "busy": 10,
      "total": 25
    }
  }
}
```

## Bonnes Pratiques

1. **Initialisez les agents** avec leurs disponibilités et compétences
2. **Mettez à jour régulièrement** les localisations GPS
3. **Surveillez les missions** toutes les 5-10 minutes
4. **Configurez les alertes** pour les priorités critiques
5. **Analysez les statistiques** pour optimiser le système

## Dépannage

### Aucun agent disponible

- Vérifiez que des agents ont `status='available'`
- Vérifiez les horaires de service (shift_start/shift_end)
- Augmentez le `max_missions_per_day` si nécessaire

### Score trop faible

- Ajustez les compétences des agents
- Vérifiez la proximité géographique
- Réduisez la charge de travail existante

### Réassignation échoue

- Vérifiez qu'il existe d'autres agents disponibles
- Vérifiez les logs pour identifier la cause
- Contactez les opérateurs manuellement

## Support

Pour plus de détails, consultez :
- `/docs/INTELLIGENT_ASSIGNMENT_ARCHITECTURE.md` - Architecture complète
- `/services/intelligentAssignmentService.js` - Code source algorithme
- `/services/dynamicPriorityService.js` - Code source priorisation

## Licence

Partie du projet SAE FlexiTrip
