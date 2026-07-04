/**
 * authContext.js
 * Dual-currency state schema for Worker DNA and Royal Jelly balances.
 * Enforces currency rules: 50% DNA penalty on failed run, Royal Jelly retained.
 * 
 * Migrated from the original GameContext pattern which used useStorage + useState.
 * This version uses useReducer for predictable state transitions.
 */
import React, { createContext, useContext, useReducer } from 'react';

// ─── Initial State ───────────────────────────────────────────────────────────

const initialState = {
  user: null,
  currencies: {
    workerDNA: 0,    // Lost by 50% on failed run
    royalJelly: 0,   // Permanently retained
  },
  runStatus: 'idle', // 'idle' | 'active' | 'escaped' | 'failed'
  stats: {
    highestDepthReached: 0,
    totalRaidsCompleted: 0,
    bossDefeatedCount: 0,
  },
};

// ─── Action Types ────────────────────────────────────────────────────────────

export const AUTH_ACTIONS = {
  START_RUN: 'START_RUN',
  COMPLETE_RUN: 'COMPLETE_RUN',
  FAIL_RUN: 'FAIL_RUN',
  SPEND_CURRENCY: 'SPEND_CURRENCY',
  SET_USER: 'SET_USER',
  RESET_STATS: 'RESET_STATS',
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.START_RUN:
      return {
        ...state,
        runStatus: 'active',
      };

    case AUTH_ACTIONS.COMPLETE_RUN: {
      const { dnaEarned, jellyEarned, depthReached } = action.payload;
      return {
        ...state,
        runStatus: 'escaped',
        currencies: {
          workerDNA: state.currencies.workerDNA + (dnaEarned || 0),
          royalJelly: state.currencies.royalJelly + (jellyEarned || 0),
        },
        stats: {
          ...state.stats,
          highestDepthReached: Math.max(state.stats.highestDepthReached, depthReached || 0),
          totalRaidsCompleted: state.stats.totalRaidsCompleted + 1,
        },
      };
    }

    case AUTH_ACTIONS.FAIL_RUN: {
      // Enforces 50% penalty on pre-existing and collected common DNA
      const penaltyDNA = Math.floor(state.currencies.workerDNA * 0.5);
      return {
        ...state,
        runStatus: 'failed',
        currencies: {
          ...state.currencies,
          workerDNA: penaltyDNA, // Royal Jelly remains untouched
        },
      };
    }

    case AUTH_ACTIONS.SPEND_CURRENCY: {
      const { dnaCost, jellyCost } = action.payload;
      return {
        ...state,
        currencies: {
          workerDNA: Math.max(0, state.currencies.workerDNA - (dnaCost || 0)),
          royalJelly: Math.max(0, state.currencies.royalJelly - (jellyCost || 0)),
        },
      };
    }

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
      };

    case AUTH_ACTIONS.RESET_STATS:
      return {
        ...state,
        stats: initialState.stats,
      };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  return (
    <AuthContext.Provider value={{ state, dispatch }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context with validation.
 * Throws if used outside AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
