/**
 * Ant Feast — Game Module Entry Point
 * 
 * A React Native tongue-extension raid game set in an ant colony.
 * 
 * Modules:
 *   - lib/RaidTime.js           : Depth tracking, stamina burn, cave-in risk
 *   - lib/PheromoneGuardMath.js : Enemy AI acceleration vectors
 *   - lib/SensoryIntegrationTest.js : Sensor accuracy simulation
 *   - lib/AntEaterE2EEngineParser.js : E2E lifecycle integration
 *   - context/authContext.js    : Currency state schema (useReducer)
 *   - components/MutationsScreen.jsx : Three-branch upgrade tree
 *   - components/SeismicRadarView.jsx : Colony radar scan display
 * 
 * Root component: component.js (original monolith with all 5 screens)
 * 
 * This is a React Native application. To run:
 *   npx react-native run-ios    # iOS
 *   npx react-native run-android # Android
 *   npx expo start               # Expo (if using Expo)
 * 
 * Requires: react-native, @react-navigation/bottom-tabs,
 *           @react-navigation/stack, react-native-safe-area-context,
 *           @react-native-vector-icons/ionicons,
 *           @react-native-vector-icons/material-icons,
 *           platform-hooks
 */

const RaidTime = require('./lib/RaidTime');
const PheromoneGuardMath = require('./lib/PheromoneGuardMath');
const SensoryIntegrationTest = require('./lib/SensoryIntegrationTest');
const AntEaterE2EEngineParser = require('./lib/AntEaterE2EEngineParser');

module.exports = {
  RaidTime,
  PheromoneGuardMath,
  SensoryIntegrationTest,
  AntEaterE2EEngineParser,
};
