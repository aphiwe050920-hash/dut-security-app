import { THREAT_KEYWORDS } from './constants';

// Analyse alerts and return threat patterns
export const analyseAlertPatterns = (alerts) => {
  if (!alerts || alerts.length === 0) return null;

  // Alerts by type
  const byType = {};
  // Alerts by priority
  const byPriority = { critical: 0, high: 0, medium: 0, low: 0 };
  // Alerts by hour of day (0-23)
  const byHour = Array(24).fill(0);
  // Alerts by day of week
  const byDay = Array(7).fill(0);
  // Resolution rate
  let resolved = 0;
  let totalAIScore = 0;

  alerts.forEach((alert) => {
    // By type
    const t = alert.type || 'general';
    byType[t] = (byType[t] || 0) + 1;

    // By priority
    const p = alert.priority || 'low';
    byPriority[p] = (byPriority[p] || 0) + 1;

    // By hour
    const hour = new Date(alert.createdAt).getHours();
    byHour[hour] = (byHour[hour] || 0) + 1;

    // By day
    const day = new Date(alert.createdAt).getDay();
    byDay[day] = (byDay[day] || 0) + 1;

    // Resolution
    if (alert.status === 'resolved') resolved++;

    // AI score
    totalAIScore += alert.aiPriorityScore || 0;
  });

  const resolutionRate = alerts.length > 0
    ? Math.round((resolved / alerts.length) * 100)
    : 0;

  const avgAIScore = alerts.length > 0
    ? Math.round(totalAIScore / alerts.length)
    : 0;

  // Peak hour (most alerts)
  const peakHour = byHour.indexOf(Math.max(...byHour));

  // Most common type
  const mostCommonType = Object.entries(byType)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

  // Threat level based on recent critical/high alerts
  const recentAlerts = alerts.slice(0, 10);
  const recentCritical = recentAlerts.filter(
    (a) => a.priority === 'critical' || a.priority === 'high'
  ).length;

  const overallThreatLevel =
    recentCritical >= 5 ? 'CRITICAL' :
    recentCritical >= 3 ? 'HIGH' :
    recentCritical >= 1 ? 'MEDIUM' : 'LOW';

  const threatColor =
    overallThreatLevel === 'CRITICAL' ? '#e74c3c' :
    overallThreatLevel === 'HIGH' ? '#e67e22' :
    overallThreatLevel === 'MEDIUM' ? '#f39c12' : '#2ecc71';

  return {
    byType,
    byPriority,
    byHour,
    byDay,
    resolutionRate,
    avgAIScore,
    peakHour,
    mostCommonType,
    overallThreatLevel,
    threatColor,
    totalAlerts: alerts.length,
    resolvedAlerts: resolved,
    activeAlerts: alerts.filter((a) => a.status === 'active').length,
  };
};

// Analyse text and return keyword threats found
export const analyseTextThreats = (text) => {
  if (!text) return { level: 'low', keywords: [], score: 10 };
  const lower = text.toLowerCase();
  const found = [];
  let score = 10;
  let level = 'low';

  Object.entries(THREAT_KEYWORDS).forEach(([lvl, words]) => {
    words.forEach((word) => {
      if (lower.includes(word)) {
        found.push({ word, level: lvl });
        if (lvl === 'critical') { score = Math.min(score + 25, 100); level = 'critical'; }
        else if (lvl === 'high' && level !== 'critical') { score = Math.min(score + 15, 100); level = 'high'; }
        else if (lvl === 'medium' && !['critical', 'high'].includes(level)) { score = Math.min(score + 10, 100); level = 'medium'; }
        else if (lvl === 'low' && level === 'low') { score = Math.min(score + 5, 100); }
      }
    });
  });

  return { level, keywords: found, score };
};

// Predict peak times based on historical data
export const predictPeakTimes = (byHour) => {
  if (!byHour || byHour.length === 0) return [];
  const max = Math.max(...byHour);
  if (max === 0) return [];
  return byHour
    .map((count, hour) => ({ hour, count, percentage: Math.round((count / max) * 100) }))
    .filter((h) => h.percentage >= 50)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
};

// Generate safety recommendations
export const generateRecommendations = (analytics) => {
  if (!analytics) return [];
  const recs = [];

  if (analytics.overallThreatLevel === 'CRITICAL' || analytics.overallThreatLevel === 'HIGH') {
    recs.push({ icon: '🚨', text: 'Increase security patrols immediately', priority: 'critical' });
  }
  if (analytics.resolutionRate < 50) {
    recs.push({ icon: '⚡', text: 'Response rate is low — assign more officers', priority: 'high' });
  }
  if (analytics.peakHour >= 18 || analytics.peakHour <= 6) {
    recs.push({ icon: '🌙', text: `High incidents at night (peak: ${analytics.peakHour}:00) — boost night patrol`, priority: 'high' });
  }
  if (analytics.mostCommonType === 'panic') {
    recs.push({ icon: '😰', text: 'High panic alerts — consider student safety workshops', priority: 'medium' });
  }
  if (analytics.mostCommonType === 'theft') {
    recs.push({ icon: '🔒', text: 'Theft is most common — review access control', priority: 'medium' });
  }
  if (analytics.resolutionRate >= 80) {
    recs.push({ icon: '✅', text: 'Excellent resolution rate — keep up the good work', priority: 'low' });
  }
  if (recs.length === 0) {
    recs.push({ icon: '🟢', text: 'Campus threat level is low — maintain current patrols', priority: 'low' });
  }

  return recs;
};