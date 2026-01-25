import React, { useState, useEffect } from 'react';
import './AccompagnantHome.css';

const tasks = [
  {
    id: 1,
    label: 'Confirmer bagages du PAX',
    expectedStatus: 'Bagage vérifié',
    expectedEvent: 'Bagage Verification',
    required: true
  },
  {
    id: 2,
    label: 'Scanner QR Code PAX',
    expectedStatus: 'E-billet validé',
    expectedEvent: 'E-Billet Verification',
    required: true
  },
  {
    id: 3,
    label: 'Authentifier PAX',
    expectedStatus: 'Authentification réussie',
    expectedEvent: 'Facial Recognition',
    required: true
  },
  {
    id: 4,
    label: 'Filtrage du PAX',
    expectedStatus: 'Filtrage réussi',
    expectedEvent: 'Security Check',
    required: true
  },
  {
    id: 5,
    label: 'Exception',
    expectedStatus: 'Exception traitée',
    expectedEvent: 'Exception Handling',
    required: false
  },
  {
    id: 6,
    label: 'Confirmer dépôt PMR',
    expectedStatus: 'Dépôt confirmé',
    expectedEvent: 'PMR Deposit',
    required: true
  }
];

const TaskItem = ({ task, completed, isLast }) => (
  <>
    <div className={`task-item ${completed ? 'completed' : task.required ? 'incomplete' : 'pending'}`}>
      <span className="task-number">{task.id}</span>
      {task.label}
      {completed && <span className="task-status">✓</span>}
    </div>
    {!isLast && <div className="task-arrow" />}
  </>
);

function AccompagnantHome() {
  const [groupedNotifications, setGroupedNotifications] = useState({});
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:17777') + '/api';

  const processNotifications = (notifications) => {
    return notifications.reduce((acc, notification) => {
      const notifData = typeof notification.value === 'string'
        ? JSON.parse(notification.value)
        : notification;

      const reservationId = notifData.reservationId || 'default';
      const agentId = notifData.agentId || 'unknown';
      const groupKey = `${reservationId}-${agentId}`;

      if (!acc[groupKey]) {
        acc[groupKey] = {
          reservationId,
          agentId,
          pmrId: notifData.pmrId,
          completedTasks: {},
          lastUpdated: notifData.timestamp
        };
      }

      let event = '';
      let status = '';

      if (notifData.status === 'Bagage vérifié') {
        event = 'Bagage Verification';
        status = 'Bagage vérifié';
      }
      else if ('success' in notifData && 'confidence' in notifData) {
        event = 'Facial Recognition';
        status = notifData.success ? 'Authentification réussie' : 'Authentification échouée';
      }
      else if (notifData.status === 'Filtrage réussi') {
        event = 'Security Check';
        status = 'Filtrage réussi';
      }
      else if (notifData.status === 'Dépôt confirmé') {
        event = 'PMR Deposit';
        status = 'Dépôt confirmé';
      }
      else if (notifData.event === 'E-Billet Verification') {
        event = 'E-Billet Verification';
        status = notifData.status;
      }

      if (event) {
        acc[groupKey].completedTasks[event] = {
          status: status,
          timestamp: notifData.timestamp
        };
      }

      if (notifData.timestamp && new Date(notifData.timestamp) > new Date(acc[groupKey].lastUpdated)) {
        acc[groupKey].lastUpdated = notifData.timestamp;
      }

      return acc;
    }, {});
  };

  const consumeMessages = async () => {
    // TODO DEMO: Kafka supprimé - Remplacer par Supabase Realtime
    console.warn('TODO DEMO: Endpoint /kafka/messages supprimé - Utiliser Supabase Realtime');
    // Exemple d'implémentation :
    // const channel = supabase.channel('missions')
    //   .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pmr_missions' }, 
    //     payload => {
    //       const grouped = processNotifications([payload.new]);
    //       setGroupedNotifications(grouped);
    //     })
    //   .subscribe();
    
    // Pour implémentation future : charger les notifications depuis Supabase
    // const { data, error } = await supabase
    //   .from('notifications')
    //   .select('*')
    //   .eq('user_id', userId);
    
    setLoading(false);
  };

  useEffect(() => {
    consumeMessages();
    const interval = setInterval(consumeMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const isTaskCompleted = (task, completedTasks) => {
    return completedTasks[task.expectedEvent]?.status === task.expectedStatus;
  };

  const areAllRequiredTasksCompleted = (completedTasks) => {
    return tasks
      .filter(task => task.required)
      .every(task => isTaskCompleted(task, completedTasks));
  };

  if (loading) {
    return <p className="loading">Chargement des messages...</p>;
  }

  return (
    <div className="notifications-container">
      <h1>Bienvenue sur votre site pour les accompagnateurs !</h1>
      <h2>Suivi des notifications des PMR</h2>

      <div className="notifications-list">
        {Object.values(groupedNotifications).length > 0 ? (
          Object.values(groupedNotifications)
            .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
            .map((reservation) => {
              const allRequiredCompleted = areAllRequiredTasksCompleted(reservation.completedTasks);

              return (
                <div
                  key={`${reservation.reservationId}-${reservation.agentId}`}
                  className={`notification-card ${allRequiredCompleted ? 'valid' : 'invalid'}`}
                >
                  <div className="card-content">
                    <div className="message">
                      <div>
                        <strong>Réservation:</strong> #{reservation.reservationId}
                      </div>
                      <div>
                        <strong>PMR ID:</strong> {reservation.pmrId}
                      </div>
                      <div>
                        <strong>Agent ID:</strong> {reservation.agentId}
                      </div>
                      <div>
                        <strong>Dernière mise à jour:</strong>{' '}
                        {new Date(reservation.lastUpdated).toLocaleString('fr-FR')}
                      </div>
                    </div>

                    <div className="tasks-list">
                      {tasks.map((task, index) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          completed={isTaskCompleted(task, reservation.completedTasks)}
                          isLast={index === tasks.length - 1}
                        />
                      ))}
                    </div>

                    <div className="validation-status">
                      {allRequiredCompleted
                        ? 'Notification validée : ✅'
                        : 'Notification non validée : ⏳'}
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          <p className="no-notification">Aucune notification disponible.</p>
        )}
      </div>
    </div>
  );
}

export default AccompagnantHome;