# Architecture et Documentation : Système d'Assignation Intelligente IA

## Vue d'ensemble

Ce document décrit l'architecture et la logique de décision du système d'assignation intelligente pour les agents PMR (Personnes à Mobilité Réduite). Le système utilise un algorithme de scoring multi-critères avec priorisation dynamique et réassignation en temps réel.

## Architecture Fonctionnelle

### Composants Principaux

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYSTÈME D'ASSIGNATION IA                     │
└─────────────────────────────────────────────────────────────────┘
                               │
                ┌──────────────┼──────────────┐
                │              │              │
        ┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
        │  Assignment  │ │ Priority │ │ Monitoring │
        │   Service    │ │ Service  │ │  Service   │
        └───────┬──────┘ └────┬─────┘ └─────┬──────┘
                │              │              │
        ┌───────▼──────────────▼──────────────▼──────┐
        │          Scoring Algorithm Engine          │
        │  - Availability (30%)                      │
        │  - Skills Match (25%)                      │
        │  - Proximity (25%)                         │
        │  - Workload (15%)                          │
        │  - PMR Priority (5%)                       │
        └────────────────────────────────────────────┘
```

## Algorithme de Scoring

### Formule Globale

```
Score Total = (Disponibilité × 0.30) + (Compétences × 0.25) + 
              (Proximité × 0.25) + (Charge × 0.15) + (Priorité PMR × 0.05)
```

Chaque critère est évalué sur 100 points, puis pondéré selon son importance.

Pour plus de détails, voir le code source dans `/services/intelligentAssignmentService.js`

## API Endpoints

- POST `/api/intelligent-assignment/assign` - Assigne automatiquement un agent
- GET `/api/intelligent-assignment/available-agents` - Liste des agents avec scores
- POST `/api/intelligent-assignment/monitor` - Surveille les missions actives
- POST `/api/intelligent-assignment/reassign` - Réassigne un agent
- GET/PUT `/api/intelligent-assignment/agent-availability/:agent_id` - Gestion disponibilité
- GET/PUT `/api/intelligent-assignment/agent-skills/:agent_id` - Gestion compétences
- GET `/api/intelligent-assignment/statistics` - Statistiques d'assignation

## Scalabilité

Le système est conçu pour être scalable avec des services découplés et peut être intégré avec WebSocket/Kafka pour du temps réel.
