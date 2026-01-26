import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  Stack,
  IconButton,
  Tabs,
  Tab,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Alert,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  useTheme,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  DoneAll as DoneAllIcon,
  PriorityHigh as DelayIcon,
  CheckCircle as SuccessIcon,
  AirplanemodeActive as FlightIcon,
  MeetingRoom as GateIcon,
  Person as AgentIcon,
  NotificationsNone as NoNotifIcon
} from '@mui/icons-material';

const NotificationCenter = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications
  } = useNotifications();

  const [tabValue, setTabValue] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      await refreshNotifications();
      setLoading(false);
    };
    fetch();
  }, [refreshNotifications]);

  const filteredNotifications = notifications.filter(notif => {
    // Filtre read/unread (Tab)
    if (tabValue === 1 && notif.read) return false;
    if (tabValue === 2 && !notif.read) return false;

    // Filtre par type
    if (typeFilter !== 'all' && notif.type !== typeFilter) return false;

    return true;
  });

  const getNotificationDetails = (type) => {
    const details = {
      'ENROLLMENT_SUCCESS': { icon: <SuccessIcon />, color: 'success' },
      'CHECKIN_SUCCESS': { icon: <FlightIcon />, color: 'info' },
      'BOARDING_SUCCESS': { icon: <FlightIcon />, color: 'secondary' },
      'DELAY': { icon: <DelayIcon />, color: 'warning' },
      'GATE_CHANGE': { icon: <GateIcon />, color: 'error' },
      'AGENT_ASSIGNED': { icon: <AgentIcon />, color: 'primary' },
      'GENERAL': { icon: <NotificationsIcon />, color: 'primary' }
    };
    return details[type] || details['GENERAL'];
  };

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.notification_id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    if (window.confirm('Supprimer cette notification ?')) {
      deleteNotification(notificationId);
    }
  };

  const handleMarkAllRead = () => {
    if (window.confirm(`Marquer les ${unreadCount} notifications comme lues ?`)) {
      markAllAsRead();
    }
  };

  // Types uniques dans notifications
  const availableTypes = [...new Set(notifications.map(n => n.type))];

  if (loading && notifications.length === 0) {
    return (
      <Box sx={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={60} />
        <Typography color="textSecondary">Chargement de vos notifications...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 6 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '1.75rem', md: '2.25rem' } }}>📬 Centre de Notifications</Typography>
            <Typography variant="body1" color="textSecondary" sx={{ fontWeight: 500 }}>
              {unreadCount > 0
                ? `Vous avez ${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
                : 'Toutes vos notifications sont lues'}
            </Typography>
          </Box>
          {unreadCount > 0 && (
            <Button
              variant="contained"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllRead}
              sx={{ borderRadius: 3, textTransform: 'none', px: 3, py: 1, fontWeight: 700 }}
            >Tout marquer lu</Button>
          )}
        </Box>

        {/* List Container */}
        <Paper elevation={0} sx={{ borderRadius: 4, border: '1px solid #e2e8f0', overflow: 'hidden', mb: 3, bgcolor: 'white' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', px: 1 }}>
            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ minHeight: 64 }}>
              <Tab label={`Toutes (${notifications.length})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
              <Tab label={`Non lues (${unreadCount})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
              <Tab label={`Lues (${notifications.length - unreadCount})`} sx={{ fontWeight: 700, textTransform: 'none' }} />
            </Tabs>
          </Box>

          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-start', borderBottom: '1px solid #f1f5f9' }}>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="type-filter-label">Filtrer par type</InputLabel>
              <Select
                labelId="type-filter-label"
                value={typeFilter}
                label="Filtrer par type"
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">Tous les types</MenuItem>
                {availableTypes.map(type => (
                  <MenuItem key={type} value={type}>{type.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <List sx={{ p: 0 }}>
            {filteredNotifications.length === 0 ? (
              <Box sx={{ p: { xs: 6, md: 10 }, textAlign: 'center' }}>
                <NoNotifIcon sx={{ fontSize: 80, color: 'text.disabled', opacity: 0.2, mb: 2 }} />
                <Typography variant="h5" color="textSecondary" fontWeight={600} gutterBottom>Aucune notification</Typography>
                <Typography variant="body2" color="textSecondary">Vous n'avez pas de notifications correspondant à ces critères.</Typography>
              </Box>
            ) : (
              filteredNotifications.map((notif, idx) => {
                const { icon, color } = getNotificationDetails(notif.type);
                const isUnread = !notif.read;
                return (
                  <React.Fragment key={notif.notification_id}>
                    <ListItemButton
                      onClick={() => handleNotificationClick(notif)}
                      sx={{
                        p: { xs: 2.5, md: 3 },
                        borderLeft: `6px solid ${isUnread ? theme.palette[color].main : 'transparent'}`,
                        bgcolor: isUnread ? 'rgba(46, 179, 120, 0.04)' : 'transparent',
                        '&:hover': { bgcolor: isUnread ? 'rgba(46, 179, 120, 0.08)' : '#f8fafc' },
                        transition: '0.2s',
                        alignItems: 'flex-start'
                      }}
                    >
                      <ListItemAvatar sx={{ mt: 0.5 }}>
                        <Avatar sx={{
                          bgcolor: isUnread ? `${color}.main` : '#f1f5f9',
                          color: isUnread ? 'white' : 'text.secondary',
                          boxShadow: isUnread ? `0 4px 12px ${theme.palette[color].main}40` : 'none',
                          width: 48,
                          height: 48
                        }}>
                          {icon}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        sx={{ ml: 1 }}
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography variant="subtitle1" fontWeight={isUnread ? 850 : 600} color="text.primary" sx={{ lineHeight: 1.3 }}>
                              {notif.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', ml: 2, fontWeight: 600 }}>
                              {formatDateTime(notif.created_at)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.5, maxWidth: '90%' }}>
                              {notif.message}
                            </Typography>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                              <Chip
                                label={notif.type.replace(/_/g, ' ')}
                                size="small"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  fontWeight: 700,
                                  bgcolor: isUnread ? `${color}.light` : '#f1f5f9',
                                  color: isUnread ? `${color}.contrastText` : 'text.secondary',
                                  opacity: isUnread ? 1 : 0.7
                                }}
                              />
                              {notif.data?.flight_train && <Chip label={`✈️ ${notif.data.flight_train}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }} />}
                              {notif.data?.gate && <Chip label={`🚪 Porte ${notif.data.gate}`} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20, fontWeight: 700 }} />}
                            </Stack>
                          </Box>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => handleDelete(e, notif.notification_id)}
                        sx={{
                          mt: 0.5,
                          opacity: 0,
                          '.MuiListItemButton-root:hover &': { opacity: 0.5 },
                          '&:hover': { opacity: '1 !important', color: 'error.main' }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemButton>
                    {idx < filteredNotifications.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })
            )}
          </List>
        </Paper>

        <Alert severity="info" sx={{ borderRadius: 3, bgcolor: '#f0f9ff', color: '#0c4a6e', border: '1px solid #bae6fd' }}>
          <Typography variant="body2">
            <strong>💡 Astuce :</strong> Cliquez sur une notification pour voir les détails associés (voyage, check-in, etc.).
          </Typography>
        </Alert>
      </Container>
    </Box>
  );
};

export default NotificationCenter;
