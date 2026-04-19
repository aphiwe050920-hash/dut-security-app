import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../utils/constants';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth
export const registerAPI = (data) => api.post('/auth/register', data);
export const loginAPI = (data) => api.post('/auth/login', data);
export const getMeAPI = () => api.get('/auth/me');

// Alerts
export const triggerAlertAPI = (data) => api.post('/alerts/trigger', data);
export const getAlertsAPI = (params) => api.get('/alerts', { params });
export const getAlertByIdAPI = (id) => api.get(`/alerts/${id}`);
export const updateAlertStatusAPI = (id, status) => api.put(`/alerts/${id}/status`, { status });

// Incidents
export const createIncidentAPI = (data) => api.post('/incidents', data);
export const getIncidentsAPI = (params) => api.get('/incidents', { params });
export const getIncidentByIdAPI = (id) => api.get(`/incidents/${id}`);
export const updateIncidentAPI = (id, data) => api.put(`/incidents/${id}`, data);

// Users
export const getUsersAPI = () => api.get('/users');
export const updateProfileAPI = (data) => api.put('/users/profile', data);
export const updateLocationAPI = (data) => api.put('/users/location', data);
export const deleteUserAPI = (id) => api.delete(`/users/${id}`);

export default api;