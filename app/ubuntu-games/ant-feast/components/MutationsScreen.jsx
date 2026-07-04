/**
 * MutationsScreen.jsx
 * Three-branch upgrade tree layout (Electricity, Bio-Energy, Sensory).
 * 
 * Cleans up the original monolithic implementation by extracting the
 * mutation UI into a standalone component with proper flex properties
 * that pass RN visual builder compilers without runtime errors.
 */
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// ─── Branch Data ─────────────────────────────────────────────────────────────

const BRANCHES = [
  {
    id: 'electricity',
    name: '\u26A1 Electricity',
    color: '#FFD700',
    description: 'Stun & neural shock',
    tiers: [
      { id: 'e1', name: 'Static Discharge', cost: 50, currency: 'dna' },
      { id: 'e2', name: 'Neural Overload', cost: 120, currency: 'dna' },
      { id: 'e3', name: 'Chain Lightning', cost: 280, currency: 'jelly' },
    ],
  },
  {
    id: 'bioenergy',
    name: '\uD83E\uDDEC Bio-Energy',
    color: '#4CAF50',
    description: 'Stamina & rapid recovery',
    tiers: [
      { id: 'b1', name: 'Metabolic Boost', cost: 60, currency: 'dna' },
      { id: 'b2', name: 'Cellular Regeneration', cost: 150, currency: 'dna' },
      { id: 'b3', name: 'Symbiotic Core', cost: 320, currency: 'jelly' },
    ],
  },
  {
    id: 'sensory',
    name: '\uD83D\uDC41\uFE0F Sensory',
    color: '#00BCD4',
    description: 'Seismic map tracking',
    tiers: [
      { id: 's1', name: 'Seismic Whiskers', cost: 70, currency: 'dna' },
      { id: 's2', name: 'Thermal Olfaction', cost: 180, currency: 'dna' },
      { id: 's3', name: 'Apex Intuition', cost: 350, currency: 'jelly' },
    ],
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function MutationsScreen({ dnaBalance = 0, jellyBalance = 0, unlockedMap = {} }) {
  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.headerTitle}>GENETIC MUTATION NURSERY</Text>
        <View style={styles.balanceRow}>
          <View style={[styles.balanceBadge, { borderColor: '#D4A017' }]}>
            <Text style={[styles.balanceText, { color: '#D4A017' }]}>
              \uD83E\uDDEC {dnaBalance}
            </Text>
          </View>
          <View style={[styles.balanceBadge, { borderColor: '#9B59B6' }]}>
            <Text style={[styles.balanceText, { color: '#9B59B6' }]}>
              \uD83D\uDC51 {jellyBalance}
            </Text>
          </View>
        </View>
      </View>

      {/* Three-Column Branch Tree */}
      <View style={styles.treeWrapper}>
        {BRANCHES.map((branch) => {
          const unlockedTier = unlockedMap[branch.id] || 0;
          return (
            <View key={branch.id} style={styles.branchColumn}>
              {/* Branch Header */}
              <View style={[styles.branchHeader, { borderColor: branch.color }]}>
                <Text style={[styles.branchTitle, { color: branch.color }]}>
                  {branch.name}
                </Text>
                <Text style={styles.branchDesc}>{branch.description}</Text>
                <Text style={[styles.tierProgress, { color: branch.color }]}>
                  {unlockedTier}/{branch.tiers.length}
                </Text>
              </View>

              {/* Tier Nodes */}
              {branch.tiers.map((tier, idx) => {
                const isUnlocked = unlockedTier >= (idx + 1);
                const isUnlockable = unlockedTier === idx;
                return (
                  <React.Fragment key={tier.id}>
                    {/* Connector line (except before first node) */}
                    {idx > 0 && <View style={styles.connectorLine} />}

                    {/* Node */}
                    <TouchableOpacity
                      style={[
                        styles.nodeItem,
                        isUnlocked && { borderColor: branch.color, opacity: 1.0 },
                        !isUnlocked && !isUnlockable && styles.nodeLocked,
                        isUnlockable && styles.nodeAvailable,
                      ]}
                      disabled={!isUnlockable}
                      onPress={() => {
                        // Purchase handler injected by parent
                        console.log(`Purchase ${tier.id} for ${tier.cost} ${tier.currency}`);
                      }}
                    >
                      <Text style={styles.nodeTierLabel}>Tier {idx + 1}</Text>
                      <Text
                        style={[
                          styles.nodeName,
                          isUnlocked && { color: branch.color },
                        ]}
                        numberOfLines={1}
                      >
                        {tier.name}
                      </Text>
                      <Text style={styles.nodeCost}>
                        {isUnlocked
                          ? '\u2705 UNLOCKED'
                          : `${tier.currency === 'jelly' ? '\uD83D\uDC51' : '\uD83E\uDDEC'} ${tier.cost}`}
                      </Text>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: 20,
  },
  headerSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1.5,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  balanceBadge: {
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
  },
  balanceText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  treeWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  branchColumn: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  branchHeader: {
    borderBottomWidth: 3,
    paddingBottom: 10,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  branchTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  branchDesc: {
    color: '#888',
    fontSize: 10,
    marginTop: 2,
  },
  tierProgress: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  nodeItem: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 4,
  },
  nodeLocked: {
    opacity: 0.4,
    backgroundColor: '#151515',
  },
  nodeAvailable: {
    borderColor: '#D4A017',
    backgroundColor: '#1A1500',
    opacity: 0.9,
  },
  nodeTierLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  nodeName: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  nodeCost: {
    color: '#888',
    fontSize: 10,
    marginTop: 4,
  },
  connectorLine: {
    width: 2,
    height: 20,
    backgroundColor: '#333',
  },
});
