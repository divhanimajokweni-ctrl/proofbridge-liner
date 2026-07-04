/**
 * LocalPheromoneCanvas.jsx
 * Pheromone field visualization component using RN View-based rendering.
 *
 * Renders a grid of pheromone intensities as colored cells overlaid with
 * guard ant positions and computed force vectors from PheromoneGuardMath.
 *
 * This is a pure-RN implementation (no native canvas dependency) suitable
 * for both mobile and web targets. It uses absolute-positioned Views as
 * pixel-like cells to represent the pheromone heat map.
 */
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import PheromoneGuardMath from '../lib/PheromoneGuardMath';

// ─── Constants ──────────────────────────────────────────────────────────────

const GRID_SIZE = 10;          // 10x10 grid
const CELL_SIZE = 28;          // px per cell
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

const INTENSITY_COLORS = [
  '#0D0700', // 0 - no pheromone
  '#1A0F00', // 1
  '#2A1800', // 2
  '#3D2200', // 3
  '#5A3200', // 4
  '#7A4300', // 5
  '#A05A00', // 6
  '#CC7400', // 7
  '#E68C00', // 8
  '#FFA500', // 9 - maximum intensity
];

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Converts a pheromone density (0-10) to a color from the gradient.
 */
function densityToColor(density) {
  const idx = Math.min(9, Math.max(0, Math.floor(density || 0)));
  return INTENSITY_COLORS[idx];
}

/**
 * Generates the initial 10x10 pheromone grid from an array of pheromone points.
 */
function buildPheromoneGrid(pheromonePoints, gridSize = GRID_SIZE, canvasSize = CANVAS_SIZE) {
  const grid = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => 0)
  );

  const cellSize = canvasSize / gridSize;

  for (const point of (pheromonePoints || [])) {
    const col = Math.min(gridSize - 1, Math.max(0, Math.floor(point.x / cellSize)));
    const row = Math.min(gridSize - 1, Math.max(0, Math.floor(point.y / cellSize)));
    // Accumulate density (cap at 10)
    grid[row][col] = Math.min(10, grid[row][col] + (point.density || 0));
  }

  return grid;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * LocalPheromoneCanvas
 *
 * @param {Object} props
 * @param {Array}  props.pheromonePoints - Array of { x, y, density, type }
 * @param {Object} props.guardPos        - Guard ant position { x, y }
 * @param {Object} props.targetPos       - Player/snout position { x, y }
 * @param {number} props.aggression      - Guard aggression multiplier
 */
export default function LocalPheromoneCanvas({
  pheromonePoints = [],
  guardPos = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 },
  targetPos = { x: CANVAS_SIZE / 2, y: CANVAS_SIZE / 2 + 30 },
  aggression = 1.0,
}) {
  // Build 2D grid from pheromone points
  const grid = useMemo(
    () => buildPheromoneGrid(pheromonePoints),
    [pheromonePoints]
  );

  // Compute guard force vector
  const forceVector = useMemo(
    () => PheromoneGuardMath.calculatePheromoneForce(
      guardPos,
      targetPos,
      pheromonePoints,
      aggression
    ),
    [guardPos, targetPos, pheromonePoints, aggression]
  );

  // Render heat map cells
  const cells = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const density = grid[row][col];
      cells.push(
        <View
          key={`cell-${row}-${col}`}
          style={[
            styles.cell,
            {
              left: col * CELL_SIZE,
              top: row * CELL_SIZE,
              backgroundColor: densityToColor(density),
              borderColor: density > 0 ? '#3D2200' : '#1A0F00',
            },
          ]}
        />
      );
    }
  }

  return (
    <View style={styles.wrapper}>
      {/* Canvas Area */}
      <View style={styles.canvasContainer}>
        <View style={[styles.canvas, { width: CANVAS_SIZE, height: CANVAS_SIZE }]}>
          {/* Heat map cells */}
          {cells}

          {/* Guard Position Indicator */}
          <View
            style={[
              styles.guardDot,
              {
                left: guardPos.x - 6,
                top: guardPos.y - 6,
              },
            ]}
          >
            <Text style={styles.dotLabel}>G</Text>
          </View>

          {/* Target Position Indicator */}
          <View
            style={[
              styles.targetDot,
              {
                left: targetPos.x - 5,
                top: targetPos.y - 5,
              },
            ]}
          >
            <Text style={styles.dotLabel}>T</Text>
          </View>

          {/* Force Vector Line */}
          {forceVector.fx !== 0 && forceVector.fy !== 0 && (
            <View
              style={[
                styles.forceLine,
                {
                  left: guardPos.x,
                  top: guardPos.y,
                  width: Math.min(CANVAS_SIZE, Math.abs(forceVector.fx) * 4),
                  height: 2,
                  transform: [
                    { rotate: `${Math.atan2(forceVector.fy, forceVector.fx) * (180 / Math.PI)}deg` },
                  ],
                  transformOrigin: 'left center',
                },
              ]}
            />
          )}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: INTENSITY_COLORS[0] }]} />
          <Text style={styles.legendText}>None</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: INTENSITY_COLORS[4] }]} />
          <Text style={styles.legendText}>Mid</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: INTENSITY_COLORS[9] }]} />
          <Text style={styles.legendText}>Max</Text>
        </View>
        <View style={styles.divider} />
        <View style={[styles.legendSwatch, styles.guardSwatch]}>
          <Text style={styles.swatchLabel}>G</Text>
        </View>
        <Text style={styles.legendText}>Guard</Text>
        <View style={[styles.legendSwatch, styles.targetSwatch]}>
          <Text style={styles.swatchLabel}>T</Text>
        </View>
        <Text style={styles.legendText}>Target</Text>
      </View>

      {/* Force Vector Data */}
      <View style={styles.vectorData}>
        <Text style={styles.vectorText}>
          Force: ({forceVector.fx.toFixed(2)}, {forceVector.fy.toFixed(2)})
        </Text>
        <Text style={styles.vectorText}>
          Magnitude: {Math.sqrt(forceVector.fx ** 2 + forceVector.fy ** 2).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#262626',
  },
  canvasContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  canvas: {
    position: 'relative',
    backgroundColor: '#0D0700',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#3D1F08',
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE - 1,
    height: CELL_SIZE - 1,
    borderWidth: 0.5,
  },
  guardDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF5252',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
  },
  targetDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 5,
  },
  dotLabel: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  forceLine: {
    position: 'absolute',
    backgroundColor: '#FFD700',
    zIndex: 5,
    opacity: 0.8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#333',
  },
  legendText: {
    color: '#888',
    fontSize: 10,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: '#333',
    marginHorizontal: 4,
  },
  guardSwatch: {
    backgroundColor: '#FF5252',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  targetSwatch: {
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  swatchLabel: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
  vectorData: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  vectorText: {
    color: '#AAA',
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
