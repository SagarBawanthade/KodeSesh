// utils/notification.js
export const showNotification = (message, type = 'info') => {
  // Browser notification with icon based on type
  if ('Notification' in window && Notification.permission === 'granted') {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '📝',
      info: 'ℹ️'
    };
    
    new Notification('KodeSesh PR Update', {
      body: `${icons[type] || ''} ${message}`,
      icon: '/favicon.ico',
      tag: 'pr-notification',
    });
  }
  
  // Also log to console with color coding
  const colors = {
    success: 'color: #10b981',
    error: 'color: #ef4444',
    warning: 'color: #f59e0b',
    info: 'color: #3b82f6'
  };
  
  console.log(`%c🔔 ${type.toUpperCase()}: ${message}`, colors[type] || '');
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};