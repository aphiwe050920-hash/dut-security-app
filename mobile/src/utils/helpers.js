import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeToken = async (token) => {
  try {
    await AsyncStorage.setItem('authToken', token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('userData');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

export const storeUserData = async (user) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(user));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getPriorityColor = (priority) => {
  const colors = {
    low: '#2ecc71',
    medium: '#f39c12',
    high: '#e67e22',
    critical: '#e74c3c',
  };
  return colors[priority] || '#95a5a6';
};

export const getStatusColor = (status) => {
  const colors = {
    active: '#e74c3c',
    pending: '#f39c12',
    resolved: '#2ecc71',
    false_alarm: '#95a5a6',
    open: '#e74c3c',
    under_review: '#3498db',
    closed: '#95a5a6',
  };
  return colors[status] || '#95a5a6';
};