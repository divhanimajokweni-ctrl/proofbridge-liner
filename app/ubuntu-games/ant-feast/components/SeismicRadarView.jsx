/**
 * SeismicRadarView.jsx
 * Standalone view rendering mapped colony positions horizontally.
 * Unlocked sensory tier stats dynamically adjust visual tracking quality.
 * 
 * Maps to the ColonyMapScreen in the original implementation.
 */
import React from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';

/**
 * Seismic Radar View component.
 * @param {Object} props
 * @param {Array}  props.radarData   - Array of colony scan results
 * @param {number} props.sensoryTier - Current sensory mutation tier (0-3)
 */
export default function SeismicRadarView({ radarData = [], sensoryTier = 0 }) {
  const getStatusColor = (threat) => {
    if (threat === 'CRITICAL') return '#FF5252';
    if (threat === 'MEDIUM') return '#FFD700';
    return '#4CAF50';
  };

  return (
    <View style={styles.radarContainer}>
      {/* Header */}
      <View style={styles.radarHeader}>
        <Text style={styles.radarTitle}>
          {'\uD83D\uDEF0\uFE0F'} SEISMIC SUBSURFACE RADAR
        </Text>
        <Text style={styles.radarSubtitle}>
          SENSORY LEVEL: TIER {sensoryTier} {'\u2022'} CONFIGURATION:{' '}
          {sensoryTier > 0 ? 'STABLE' : 'UNSTABLE'}
        </Text>
      </View>

      {/* Colony Scan Results */}
      <FlatList
        data={radarData}
        keyExtractor={(item) => item.colonyId}
        renderItem={({ item }) => (
          <View style={styles.nodeCard}>
            {/* Header Row */}
            <View style={styles.cardHeaderRow}>
              <Text style={styles.classificationText}>
                {item.targetClassification}
              </Text>
              <View
                style={[
                  styles.threatBadge,
                  { backgroundColor: getStatusColor(item.threatLevel) },
                ]}
              >
                <Text style={styles.threatText}>{item.threatLevel}</Text>
              </View>
            </View>

            {/* Metrics Grid */}
            <View style={styles.metricGrid}>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>LATITUDE OFFSET</Text>
                <Text style={styles.metricValue}>
                  {item.coordinates.latitude}
                </Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>LONGITUDE OFFSET</Text>
                <Text style={styles.metricValue}>
                  {item.coordinates.longitude}
                </Text>
              </View>
              <View style={styles.metricBlock}>
                <Text style={styles.metricLabel}>PULSE DENSITY</Text>
                <Text style={styles.metricValue}>{item.sensorReading}</Text>
              </View>
            </View>

            {/* Tier 0 Warning */}
            {sensoryTier === 0 && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningText}>
                  {'\u26A0\uFE0F'} HIGH VARIANCE METRICS: EXPANSION UNLOCKED IN LAB
                </Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}

// ─── StyleSheet ──────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  radarContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 14,
  },
  radarHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 10,
    marginBottom: 15,
  },
  radarTitle: {
    color: '#A5D6A7',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  radarSubtitle: {
    color: '#666',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
  nodeCard: {
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#262626',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  classificationText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  threatBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  threatText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBlock: {
    flex: 1,
  },
  metricLabel: {
    color: '#555',
    fontSize: 9,
    fontWeight: 'bold',
  },
  metricValue: {
    color: '#EEE',
    fontSize: 12,
    marginTop: 2,
    fontFamily: 'monospace',
  },
  warningBanner: {
    marginTop: 10,
    backgroundColor: '#2C1616',
    padding: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  warningText: {
    color: '#FF8A80',
    fontSize: 10,
    fontWeight: '700',
  },
});
