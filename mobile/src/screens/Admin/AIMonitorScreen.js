import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { useAlerts } from '../../context/AlertContext';
import {
  analyseAlertPatterns,
  predictPeakTimes,
  generateRecommendations,
} from '../../utils/aiAnalytics';
import { COLORS, CHART_COLORS } from '../../utils/constants';
import { getPriorityColor } from '../../utils/helpers';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

const chartConfig = {
  backgroundColor: COLORS.white,
  backgroundGradientFrom: COLORS.white,
  backgroundGradientTo: COLORS.white,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(204, 0, 0, ${opacity})`,
  labelColor: () => COLORS.darkGrey,
  style: { borderRadius: 12 },
  propsForDots: { r: '4', strokeWidth: '2', stroke: COLORS.primary },
};

export default function AIMonitorScreen() {
  const { alerts, fetchAlerts } = useAlerts();
  const [analytics, setAnalytics] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (alerts.length > 0) {
      setAnalytics(analyseAlertPatterns(alerts));
    }
  }, [alerts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  if (!analytics) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Analysing threat data...</Text>
      </View>
    );
  }

  const peakTimes = predictPeakTimes(analytics.byHour);
  const recommendations = generateRecommendations(analytics);

  // Prepare chart data
  const typeLabels = Object.keys(analytics.byType);
  const typeData = Object.values(analytics.byType);

  const barData = {
    labels: typeLabels.map((l) => l.slice(0, 4)),
    datasets: [{ data: typeData.length > 0 ? typeData : [0] }],
  };

  const priorityPieData = [
    { name: 'Critical', population: analytics.byPriority.critical || 0, color: '#e74c3c', legendFontColor: COLORS.darkGrey, legendFontSize: 12 },
    { name: 'High', population: analytics.byPriority.high || 0, color: '#e67e22', legendFontColor: COLORS.darkGrey, legendFontSize: 12 },
    { name: 'Medium', population: analytics.byPriority.medium || 0, color: '#f39c12', legendFontColor: COLORS.darkGrey, legendFontSize: 12 },
    { name: 'Low', population: analytics.byPriority.low || 0, color: '#2ecc71', legendFontColor: COLORS.darkGrey, legendFontSize: 12 },
  ].filter((d) => d.population > 0);

  // Hourly activity (show 8 sample hours)
  const hourlyLabels = ['00', '03', '06', '09', '12', '15', '18', '21'];
  const hourlyData = [0, 3, 6, 9, 12, 15, 18, 21].map((h) => analytics.byHour[h] || 0);

  const lineData = {
    labels: hourlyLabels,
    datasets: [{
      data: hourlyData.every((v) => v === 0) ? [0, 0, 0, 0, 0, 0, 0, 0] : hourlyData,
      color: (opacity = 1) => `rgba(204, 0, 0, ${opacity})`,
      strokeWidth: 2,
    }],
  };

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Threat Monitor</Text>
        <Text style={styles.headerSub}>Real-time pattern analysis</Text>
      </View>

      {/* Overall Threat Level */}
      <View style={[styles.threatCard, { borderColor: analytics.threatColor }]}>
        <View style={[styles.threatIndicator, { backgroundColor: analytics.threatColor }]}>
          <Text style={styles.threatIcon}>
            {analytics.overallThreatLevel === 'CRITICAL' ? '🚨' :
             analytics.overallThreatLevel === 'HIGH' ? '⚠️' :
             analytics.overallThreatLevel === 'MEDIUM' ? '🟡' : '🟢'}
          </Text>
        </View>
        <View style={styles.threatInfo}>
          <Text style={styles.threatLabel}>Overall Threat Level</Text>
          <Text style={[styles.threatLevel, { color: analytics.threatColor }]}>
            {analytics.overallThreatLevel}
          </Text>
          <Text style={styles.threatSub}>
            Based on {analytics.totalAlerts} total alerts
          </Text>
        </View>
        <View style={styles.threatScore}>
          <Text style={styles.threatScoreNum}>{analytics.avgAIScore}</Text>
          <Text style={styles.threatScoreLabel}>Avg AI{'\n'}Score</Text>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: analytics.totalAlerts, icon: '📊', color: COLORS.info },
          { label: 'Active', value: analytics.activeAlerts, icon: '🔴', color: COLORS.danger },
          { label: 'Resolved', value: analytics.resolvedAlerts, icon: '✅', color: COLORS.success },
          { label: 'Rate', value: `${analytics.resolutionRate}%`, icon: '📈', color: COLORS.warning },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, { borderTopColor: stat.color }]}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Alerts by Type Bar Chart */}
      {typeLabels.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>📊 Alerts by Type</Text>
          <BarChart
            data={barData}
            width={CHART_WIDTH}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars
            fromZero
          />
        </View>
      )}

      {/* Hourly Activity Line Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>📈 Hourly Alert Activity</Text>
        <Text style={styles.chartSub}>Peak hour: {analytics.peakHour}:00</Text>
        <LineChart
          data={lineData}
          width={CHART_WIDTH}
          height={200}
          chartConfig={chartConfig}
          style={styles.chart}
          bezier
          fromZero
        />
      </View>

      {/* Priority Distribution Pie Chart */}
      {priorityPieData.length > 0 && (
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>🎯 Priority Distribution</Text>
          <PieChart
            data={priorityPieData}
            width={CHART_WIDTH}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="16"
            style={styles.chart}
          />
        </View>
      )}

      {/* Day of Week Activity */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>📅 Alerts by Day of Week</Text>
        <View style={styles.dayGrid}>
          {DAYS.map((day, index) => {
            const count = analytics.byDay[index] || 0;
            const max = Math.max(...analytics.byDay, 1);
            const pct = (count / max) * 100;
            return (
              <View key={day} style={styles.dayItem}>
                <View style={styles.dayBarBg}>
                  <View style={[styles.dayBarFill, {
                    height: `${Math.max(pct, 4)}%`,
                    backgroundColor: pct > 70 ? COLORS.danger : pct > 40 ? COLORS.warning : COLORS.success,
                  }]} />
                </View>
                <Text style={styles.dayCount}>{count}</Text>
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Peak Times */}
      {peakTimes.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Predicted Peak Times</Text>
          {peakTimes.map((peak) => (
            <View key={peak.hour} style={styles.peakRow}>
              <Text style={styles.peakHour}>
                {peak.hour.toString().padStart(2, '0')}:00 —{' '}
                {(peak.hour + 1).toString().padStart(2, '0')}:00
              </Text>
              <View style={styles.peakBarBg}>
                <View style={[styles.peakBarFill, {
                  width: `${peak.percentage}%`,
                  backgroundColor: peak.percentage > 80 ? COLORS.danger : COLORS.warning,
                }]} />
              </View>
              <Text style={styles.peakCount}>{peak.count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Most Common Incident Type */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔍 Pattern Summary</Text>
        <View style={styles.patternCard}>
          {[
            { label: 'Most Common Type', value: analytics.mostCommonType?.toUpperCase() },
            { label: 'Peak Alert Hour', value: `${analytics.peakHour}:00` },
            { label: 'Resolution Rate', value: `${analytics.resolutionRate}%` },
            { label: 'Avg AI Priority Score', value: `${analytics.avgAIScore}/100` },
          ].map((item) => (
            <View key={item.label} style={styles.patternRow}>
              <Text style={styles.patternLabel}>{item.label}</Text>
              <Text style={styles.patternValue}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* AI Recommendations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 AI Recommendations</Text>
        {recommendations.map((rec, index) => (
          <View
            key={index}
            style={[styles.recCard, {
              borderLeftColor:
                rec.priority === 'critical' ? COLORS.danger :
                rec.priority === 'high' ? COLORS.warning :
                rec.priority === 'medium' ? COLORS.info : COLORS.success,
            }]}
          >
            <Text style={styles.recIcon}>{rec.icon}</Text>
            <Text style={styles.recText}>{rec.text}</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: {
    flex: 1, justifyContent: 'center',
    alignItems: 'center', backgroundColor: COLORS.background,
  },
  loadingText: { color: COLORS.grey, marginTop: 12, fontSize: 15 },
  header: {
    backgroundColor: COLORS.secondary,
    padding: 24, paddingTop: 50,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: 13, color: COLORS.grey, marginTop: 4 },
  threatCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, margin: 16,
    borderRadius: 14, padding: 16, elevation: 4,
    borderWidth: 2,
  },
  threatIndicator: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
  },
  threatIcon: { fontSize: 28 },
  threatInfo: { flex: 1, paddingHorizontal: 14 },
  threatLabel: { fontSize: 12, color: COLORS.grey, fontWeight: '600' },
  threatLevel: { fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  threatSub: { fontSize: 11, color: COLORS.grey, marginTop: 3 },
  threatScore: { alignItems: 'center' },
  threatScoreNum: { fontSize: 28, fontWeight: 'bold', color: COLORS.primary },
  threatScoreLabel: { fontSize: 10, color: COLORS.grey, textAlign: 'center', marginTop: 2 },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 12,
    gap: 8, marginBottom: 8,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.white,
    borderRadius: 12, padding: 12, alignItems: 'center',
    elevation: 2, borderTopWidth: 3,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 10, color: COLORS.grey, fontWeight: '600', marginTop: 2 },
  chartCard: {
    backgroundColor: COLORS.white, margin: 16,
    marginBottom: 8, borderRadius: 14, padding: 16, elevation: 2,
  },
  chartTitle: { fontSize: 15, fontWeight: 'bold', color: COLORS.darkGrey, marginBottom: 4 },
  chartSub: { fontSize: 12, color: COLORS.grey, marginBottom: 10 },
  chart: { borderRadius: 10, marginTop: 8 },
  dayGrid: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', height: 120, marginTop: 12,
  },
  dayItem: { flex: 1, alignItems: 'center' },
  dayBarBg: {
    width: 24, height: 80, backgroundColor: COLORS.light,
    borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden',
  },
  dayBarFill: { width: '100%', borderRadius: 4 },
  dayCount: { fontSize: 10, color: COLORS.darkGrey, fontWeight: 'bold', marginTop: 4 },
  dayLabel: { fontSize: 10, color: COLORS.grey, marginTop: 2 },
  section: { marginHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.darkGrey, marginBottom: 10 },
  peakRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  peakHour: { fontSize: 12, color: COLORS.darkGrey, fontWeight: '600', width: 90 },
  peakBarBg: { flex: 1, height: 8, backgroundColor: COLORS.light, borderRadius: 4 },
  peakBarFill: { height: 8, borderRadius: 4 },
  peakCount: { fontSize: 12, fontWeight: 'bold', color: COLORS.darkGrey, width: 24 },
  patternCard: {
    backgroundColor: COLORS.white, borderRadius: 14,
    padding: 16, elevation: 2,
  },
  patternRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  patternLabel: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },
  patternValue: { fontSize: 13, color: COLORS.darkGrey, fontWeight: 'bold' },
  recCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 12,
    padding: 14, marginBottom: 8, elevation: 2, borderLeftWidth: 4,
  },
  recIcon: { fontSize: 24 },
  recText: { flex: 1, fontSize: 13, color: COLORS.darkGrey, lineHeight: 18 },
});