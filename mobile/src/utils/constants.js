export const API_URL = 'https://dut-security-app-production.up.railway.app/api';
export const SOCKET_URL = 'https://dut-security-app-production.up.railway.app';   // Same IP

export const COLORS = {
  primary: '#CC0000',       // DUT Red
  primaryDark: '#990000',
  secondary: '#1a1a2e',     // Dark Navy
  accent: '#e94560',        // Alert Red
  success: '#2ecc71',
  warning: '#f39c12',
  danger: '#e74c3c',
  info: '#3498db',
  white: '#ffffff',
  black: '#000000',
  light: '#f5f5f5',
  grey: '#95a5a6',
  darkGrey: '#2c3e50',
  background: '#f0f2f5',
  card: '#ffffff',
  border: '#e0e0e0',
};

export const PRIORITY_COLORS = {
  low: '#2ecc71',
  medium: '#f39c12',
  high: '#e67e22',
  critical: '#e74c3c',
};

export const ALERT_TYPES = [
  { label: 'Panic', value: 'panic', icon: '🚨' },
  { label: 'Fire', value: 'fire', icon: '🔥' },
  { label: 'Medical', value: 'medical', icon: '🏥' },
  { label: 'Suspicious', value: 'suspicious', icon: '👁️' },
  { label: 'General', value: 'general', icon: '⚠️' },
];

export const INCIDENT_CATEGORIES = [
  { label: 'Theft', value: 'theft' },
  { label: 'Assault', value: 'assault' },
  { label: 'Fire', value: 'fire' },
  { label: 'Medical', value: 'medical' },
  { label: 'Vandalism', value: 'vandalism' },
  { label: 'Suspicious Activity', value: 'suspicious_activity' },
  { label: 'Other', value: 'other' },
];

export const THREAT_KEYWORDS = {
  critical: ['gun', 'knife', 'weapon', 'bomb', 'shoot', 'stab', 'explosion', 'rape', 'dead', 'dying'],
  high: ['attack', 'assault', 'bleeding', 'unconscious', 'fire', 'help', 'emergency', 'danger'],
  medium: ['theft', 'robbery', 'fighting', 'suspicious', 'threatening', 'harassment', 'intruder'],
  low: ['vandalism', 'noise', 'loitering', 'trespassing'],
};

export const CHART_COLORS = [
  '#CC0000', '#e67e22', '#f39c12',
  '#3498db', '#2ecc71', '#9b59b6',
  '#1abc9c', '#e74c3c',
];