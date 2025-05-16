export const saveNotifications = (notifications) => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  };
  
  export const getStoredNotifications = () => {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  };