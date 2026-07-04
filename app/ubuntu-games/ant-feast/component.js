const ComponentFunction = function() {
  // @section:imports @depends:[]
  var React = require('react');
  var useState = React.useState;
  var useEffect = React.useEffect;
  var useContext = React.useContext;
  var useMemo = React.useMemo;
  var useCallback = React.useCallback;
  var useRef = React.useRef;
  var RN = require('react-native');
  var View = RN.View;
  var Text = RN.Text;
  var StyleSheet = RN.StyleSheet;
  var ScrollView = RN.ScrollView;
  var TouchableOpacity = RN.TouchableOpacity;
  var FlatList = RN.FlatList;
  var Modal = RN.Modal;
  var Alert = RN.Alert;
  var Platform = RN.Platform;
  var StatusBar = RN.StatusBar;
  var ActivityIndicator = RN.ActivityIndicator;
  var Dimensions = RN.Dimensions;
  var Animated = RN.Animated;
  var Image = RN.Image;
  var Ionicons = require('@react-native-vector-icons/ionicons').Ionicons;
  var MaterialIcons = require('@react-native-vector-icons/material-icons').MaterialIcons;
  var createBottomTabNavigator = require('@react-navigation/bottom-tabs').createBottomTabNavigator;
  var createStackNavigator = require('@react-navigation/stack').createStackNavigator;
  var useSafeAreaInsets = require('react-native-safe-area-context').useSafeAreaInsets;
  var platformHooks = require('platform-hooks');
  var useQuery = platformHooks.useQuery;
  var useMutation = platformHooks.useMutation;
  var useStorage = platformHooks.useStorage;
  var useLocation = platformHooks.useLocation;
  var useShare = platformHooks.useShare;
  var useAudio = platformHooks.useAudio;
  var useMaps = platformHooks.useMaps;
  // @end:imports

  // @section:theme @depends:[]
  var primaryColor = '#8B4513';
  var accentColor = '#D4A017';
  var backgroundColor = '#0D0700';
  var cardColor = '#1E0F05';
  var darkCardColor = '#150A02';
  var textPrimary = '#F5DEB3';
  var textSecondary = '#A07850';
  var dangerColor = '#C0392B';
  var successColor = '#27AE60';
  var royalColor = '#9B59B6';
  var borderColor = '#3D1F08';
  var TAB_MENU_HEIGHT = Platform.OS === 'web' ? 56 : 49;
  var SCROLL_EXTRA_PADDING = 16;
  var WEB_TAB_MENU_PADDING = 90;
  var FAB_SPACING = 16;
  var HEADER_HEIGHT = 60;
  // @end:theme

  // @section:navigation-setup @depends:[]
  var Tab = createBottomTabNavigator();
  var Stack = createStackNavigator();
  // @end:navigation-setup

  // @section:ThemeContext @depends:[theme]
  var ThemeContext = React.createContext({
    theme: {
      colors: {
        primary: primaryColor,
        accent: accentColor,
        background: backgroundColor,
        card: cardColor,
        darkCard: darkCardColor,
        textPrimary: textPrimary,
        textSecondary: textSecondary,
        border: borderColor,
        danger: dangerColor,
        success: successColor,
        royal: royalColor
      }
    }
  });
  var ThemeProvider = function(props) {
    var value = useMemo(function() {
      return {
        theme: {
          colors: {
            primary: primaryColor,
            accent: accentColor,
            background: backgroundColor,
            card: cardColor,
            darkCard: darkCardColor,
            textPrimary: textPrimary,
            textSecondary: textSecondary,
            border: borderColor,
            danger: dangerColor,
            success: successColor,
            royal: royalColor
          }
        }
      };
    }, []);
    return React.createElement(ThemeContext.Provider, { value: value }, props.children);
  };
  var useTheme = function() { return useContext(ThemeContext); };
  // @end:ThemeContext

  // @section:GameContext @depends:[ThemeContext]
  var DEFAULT_GAME_STATE = {
    total_worker_dna: 0,
    total_royal_jelly: 0,
    highest_depth_reached: 0,
    total_raids_completed: 0,
    boss_defeated_count: 0
  };
  var GameContext = React.createContext({
    gameState: DEFAULT_GAME_STATE,
    setGameState: function() {},
    gameStateReady: false
  });
  var GameProvider = function(props) {
    var storageResult = useStorage('ant_feast_game_state', DEFAULT_GAME_STATE);
    var gameState = storageResult[0];
    var setGameState = storageResult[1];
    var meta = storageResult[2];
    var gameStateReady = meta ? meta.ready !== false : true;
    var value = useMemo(function() {
      return { gameState: gameState, setGameState: setGameState, gameStateReady: gameStateReady };
    }, [gameState, setGameState, gameStateReady]);
    return React.createElement(GameContext.Provider, { value: value }, props.children);
  };
  var useGameState = function() { return useContext(GameContext); };
  // @end:GameContext

  // @section:helpers @depends:[]
  var formatTime = function(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return (m < 10 ? '0' + m : String(m)) + ':' + (s < 10 ? '0' + s : String(s));
  };
  var generateUUID = function() {
    var chars = '0123456789abcdef';
    var uuid = '';
    for (var i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        uuid += '-';
      } else if (i === 14) {
        uuid += '4';
      } else if (i === 19) {
        uuid += chars[(Math.random() * 4 | 0) + 8];
      } else {
        uuid += chars[Math.random() * 16 | 0];
      }
    }
    return uuid;
  };
  var clamp = function(val, min, max) {
    return Math.max(min, Math.min(max, val));
  };
  // @end:helpers

  // @section:MUTATIONS_DATA @depends:[]
  var MUTATION_BRANCHES = [
    {
      id: 'elasticity',
      name: 'Elasticity',
      icon: 'settings-input-component',
      color: '#4FC3F7',
      description: 'Agility & Range',
      tiers: [
        { tier: 1, name: 'Hyper-Tensile Fibers', description: 'Tongue length +25%, improved recoil speed on retract.', cost: 50, effect: '+25% Range' },
        { tier: 2, name: 'Prehensile Tip', description: 'Tongue whips around sharp corners automatically, reducing wall friction.', cost: 120, effect: 'Auto-Corner' },
        { tier: 3, name: 'Snare Micro-Barbs', description: 'Grab multiple insects simultaneously, dragging clusters.', cost: 280, effect: 'Multi-Grab' }
      ]
    },
    {
      id: 'gastronomy',
      name: 'Gastronomy',
      icon: 'local-dining',
      color: '#EF9A9A',
      description: 'Resilience & Combat',
      tiers: [
        { tier: 1, name: 'Chitinous Shielding', description: 'Light armor on snout and tongue tip. Ignore first 3 worker stings.', cost: 60, effect: '+3 Sting Block' },
        { tier: 2, name: 'Acidic Saliva', description: 'Tongue slowly dissolves dirt walls, creating shortcuts.', cost: 150, effect: 'Wall Dissolve' },
        { tier: 3, name: 'Pheromone Mimicry', description: 'Chemical cloak for 5 sec. Ants ignore tongue until first strike.', cost: 320, effect: '5s Cloak' }
      ]
    },
    {
      id: 'sensory',
      name: 'Sensory',
      icon: 'waves',
      color: '#A5D6A7',
      description: 'Detection & Strategy',
      tiers: [
        { tier: 1, name: 'Seismic Whiskers', description: 'Visualise underground ant movements as acoustic soundwaves from surface.', cost: 70, effect: 'Seismic Map' },
        { tier: 2, name: 'Thermal Olfaction', description: 'Reveals hidden royal jelly deposits and larval nurseries through walls.', cost: 180, effect: 'Thermal Vision' },
        { tier: 3, name: 'Apex Intuition', description: 'Bullet Time: slow time 2s when Queen\'s Guard or collapse threatens tongue.', cost: 350, effect: 'Bullet Time' }
      ]
    }
  ];

  var GENETIC_LAB_UNLOCKS = [
    { id: 'burrowers_claw', name: "The Burrower's Claw", cost: 5, currency: 'jelly', description: 'Physically dig new entry holes on the surface map, bypassing upper tunnels.', icon: 'build' },
    { id: 'neural_overdrive', name: 'Neural Overdrive', cost: 12, currency: 'jelly', description: 'Adrenaline surge makes tongue immune to acid damage for 3 seconds.', icon: 'flash-on' }
  ];
  // @end:MUTATIONS_DATA

  // @section:ANT_ARCHETYPES @depends:[]
  var ANT_ARCHETYPES = [
    { id: 'worker', name: 'Worker Drone', color: '#8B6914', hp: 1, dnaValue: 3, jellyValue: 0, behavior: 'Flees to protect larvae', icon: '\uD83D\uDC1C', size: 18 },
    { id: 'larvae', name: 'Larvae', color: '#F5F5DC', hp: 0, dnaValue: 8, jellyValue: 0, behavior: 'Stationary, high value', icon: '\uD83E\uDD5A', size: 16 },
    { id: 'acid_spitter', name: 'Acid Spitter', color: '#7BC67E', hp: 3, dnaValue: 12, jellyValue: 0, behavior: 'Ranged acid fire, drains stamina', icon: '\uD83D\uDCA7', size: 20 },
    { id: 'soldier', name: 'Soldier Ant', color: '#C62828', hp: 5, dnaValue: 18, jellyValue: 0, behavior: 'Latches on, slows retraction', icon: '\u2694\uFE0F', size: 24 },
    { id: 'queens_guard', name: "Queen's Guard", color: '#7B1FA2', hp: 12, dnaValue: 0, jellyValue: 5, behavior: 'Elite mini-boss, severs tongue', icon: '\uD83D\uDC51', size: 30 }
  ];
  // @end:ANT_ARCHETYPES

  // @section:SurfaceScreen-state @depends:[ThemeContext,GameContext]
  var useSurfaceState = function() {
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var gameCtx = useGameState();
    var raidQuery = useQuery('raid_sessions', {}, { column: 'created_at', ascending: false });
    var raidData = raidQuery.data;
    var raidLoading = raidQuery.loading;
    var recentRaids = useMemo(function() {
      if (!raidData || raidData.length === 0) return [];
      return raidData.slice(0, 5);
    }, [raidData]);
    var pulseAnim = useRef(new Animated.Value(1)).current;
    useEffect(function() {
      var loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: true })
        ])
      );
      loop.start();
      return function() { loop.stop(); };
    }, [pulseAnim]);
    return {
      theme: theme,
      gameCtx: gameCtx,
      recentRaids: recentRaids,
      raidLoading: raidLoading,
      pulseAnim: pulseAnim
    };
  };
  // @end:SurfaceScreen-state

  // @section:SurfaceScreen @depends:[SurfaceScreen-state,helpers,styles]
  var SurfaceScreen = function(props) {
    var navigation = props.navigation;
    var state = useSurfaceState();
    var insets = useSafeAreaInsets();
    var screenWidth = Dimensions.get('window').width;
    var scrollBottomPadding = Platform.OS === 'web' ? WEB_TAB_MENU_PADDING : TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING;

    var gameData = state.gameCtx.gameState || DEFAULT_GAME_STATE;

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor }, componentId: 'surface-screen' },
      React.createElement(StatusBar, { barStyle: 'light-content', backgroundColor: '#6B3410' }),
      React.createElement(View, {
        style: { backgroundColor: '#6B3410', paddingTop: insets.top, paddingBottom: 12, paddingHorizontal: 16 },
        componentId: 'surface-header'
      },
        React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } },
          React.createElement(View, null,
            React.createElement(Text, { style: { color: textPrimary, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 }, componentId: 'surface-title' }, '\uD83D\uDC1C ANT FEAST'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Surface Colony Hub')
          ),
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
            React.createElement(View, { style: { backgroundColor: '#2D1A0A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, marginRight: 8, borderWidth: 1, borderColor: accentColor } },
              React.createElement(Text, { style: { color: accentColor, fontSize: 13, fontWeight: 'bold' } }, '\uD83E\uDDEC ' + (gameData.total_worker_dna || 0))
            ),
            React.createElement(View, { style: { backgroundColor: '#2D1A0A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: royalColor } },
              React.createElement(Text, { style: { color: royalColor, fontSize: 13, fontWeight: 'bold' } }, '\uD83D\uDC51 ' + (gameData.total_royal_jelly || 0))
            )
          )
        )
      ),
      React.createElement(ScrollView, {
        style: { flex: 1 },
        contentContainerStyle: { paddingTop: 16, paddingBottom: scrollBottomPadding, paddingHorizontal: 16 },
        componentId: 'surface-scroll'
      },
        React.createElement(View, { style: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 }, componentId: 'anthill-preview-card' },
          React.createElement(Image, {
            source: { uri: 'IMAGE:dark-underground-ant-colony-macro-photography' },
            style: { width: '100%', height: 180, borderRadius: 16 },
            resizeMode: 'cover',
            componentId: 'anthill-bg-image'
          }),
          React.createElement(View, {
            style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, backgroundColor: 'rgba(13,7,0,0.55)', justifyContent: 'center', alignItems: 'center' }
          },
            React.createElement(Text, { style: { color: textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 4 } }, 'COLONY ALPHA-7 DETECTED'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, '3 Entry Points  \u2022  Depth: ~60m  \u2022  High Activity'),
            React.createElement(Animated.View, { style: { marginTop: 12, transform: [{ scale: state.pulseAnim }] } },
              React.createElement(TouchableOpacity, {
                onPress: function() { navigation.navigate('Raid'); },
                style: { backgroundColor: primaryColor, borderRadius: 24, paddingHorizontal: 28, paddingVertical: 12, borderWidth: 2, borderColor: accentColor },
                componentId: 'begin-raid-btn'
              },
                React.createElement(Text, { style: { color: textPrimary, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 } }, '\u2B07 BEGIN RAID')
              )
            )
          )
        ),
        React.createElement(View, { style: { flexDirection: 'row', marginBottom: 16 }, componentId: 'stats-row' },
          React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 12, padding: 14, marginRight: 8, borderWidth: 1, borderColor: borderColor }, componentId: 'stat-raids' },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginBottom: 4 } }, 'RAIDS COMPLETED'),
            React.createElement(Text, { style: { color: textPrimary, fontSize: 26, fontWeight: 'bold' } }, String(gameData.total_raids_completed || 0)),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginTop: 2 } }, 'runs survived')
          ),
          React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 12, padding: 14, marginLeft: 8, borderWidth: 1, borderColor: borderColor }, componentId: 'stat-depth' },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginBottom: 4 } }, 'MAX DEPTH'),
            React.createElement(Text, { style: { color: accentColor, fontSize: 26, fontWeight: 'bold' } }, (gameData.highest_depth_reached || 0) + 'm'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginTop: 2 } }, 'deepest descent')
          )
        ),
        React.createElement(View, { style: { flexDirection: 'row', marginBottom: 16 } },
          React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 12, padding: 14, marginRight: 8, borderWidth: 1, borderColor: borderColor }, componentId: 'stat-boss' },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginBottom: 4 } }, 'QUEENS DEFEATED'),
            React.createElement(Text, { style: { color: royalColor, fontSize: 26, fontWeight: 'bold' } }, String(gameData.boss_defeated_count || 0)),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginTop: 2 } }, 'boss kills')
          ),
          React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 12, padding: 14, marginLeft: 8, borderWidth: 1, borderColor: borderColor }, componentId: 'stat-dna-total' },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginBottom: 4 } }, 'TOTAL DNA'),
            React.createElement(Text, { style: { color: accentColor, fontSize: 26, fontWeight: 'bold' } }, String(gameData.total_worker_dna || 0)),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginTop: 2 } }, 'worker dna banked')
          )
        ),
        React.createElement(View, { style: { marginBottom: 16 }, componentId: 'quick-actions' },
          React.createElement(Text, { style: { color: textSecondary, fontSize: 12, letterSpacing: 1, marginBottom: 10 } }, 'COLONY OPERATIONS'),
          React.createElement(View, { style: { flexDirection: 'row' } },
            React.createElement(TouchableOpacity, {
              onPress: function() { navigation.navigate('Mutations'); },
              style: { flex: 1, backgroundColor: cardColor, borderRadius: 12, padding: 14, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: '#4FC3F7' + '55' },
              componentId: 'goto-mutations-btn'
            },
              React.createElement(MaterialIcons, { name: 'biotech', size: 28, color: '#4FC3F7' }),
              React.createElement(Text, { style: { color: textPrimary, fontSize: 12, marginTop: 6, fontWeight: 'bold' } }, 'MUTATIONS'),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'Upgrade Tree')
            ),
            React.createElement(TouchableOpacity, {
              onPress: function() { navigation.navigate('Stats'); },
              style: { flex: 1, backgroundColor: cardColor, borderRadius: 12, padding: 14, marginLeft: 8, alignItems: 'center', borderWidth: 1, borderColor: accentColor + '55' },
              componentId: 'goto-stats-btn'
            },
              React.createElement(MaterialIcons, { name: 'bar-chart', size: 28, color: accentColor }),
              React.createElement(Text, { style: { color: textPrimary, fontSize: 12, marginTop: 6, fontWeight: 'bold' } }, 'WAR ROOM'),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'Raid History')
            )
          )
        ),
        React.createElement(View, { componentId: 'recent-raids-section' },
          React.createElement(Text, { style: { color: textSecondary, fontSize: 12, letterSpacing: 1, marginBottom: 10 } }, 'RECENT RAIDS'),
          state.raidLoading
            ? React.createElement(ActivityIndicator, { color: primaryColor, componentId: 'raids-loading' })
            : state.recentRaids.length === 0
              ? React.createElement(View, { style: { backgroundColor: cardColor, borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: borderColor }, componentId: 'no-raids-card' },
                  React.createElement(Text, { style: { fontSize: 32, marginBottom: 8 } }, '\uD83D\uDD73\uFE0F'),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 14, textAlign: 'center' } }, 'No raids yet. Drop your tongue into the colony to begin.')
                )
              : state.recentRaids.map(function(raid, idx) {
                  return React.createElement(View, {
                    key: raid.raid_id || String(idx),
                    style: { backgroundColor: cardColor, borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: raid.boss_defeated ? royalColor + '55' : borderColor, flexDirection: 'row', alignItems: 'center' },
                    componentId: 'raid-item-' + idx
                  },
                    React.createElement(View, { style: { width: 40, height: 40, borderRadius: 20, backgroundColor: raid.boss_defeated ? royalColor + '33' : primaryColor + '33', alignItems: 'center', justifyContent: 'center', marginRight: 12 } },
                      React.createElement(Text, { style: { fontSize: 20 } }, raid.boss_defeated ? '\uD83D\uDC51' : (raid.completed ? '\u2705' : '\uD83D\uDC80'))
                    ),
                    React.createElement(View, { style: { flex: 1 } },
                      React.createElement(Text, { style: { color: textPrimary, fontSize: 13, fontWeight: 'bold' } },
                        raid.boss_defeated ? 'QUEEN SLAIN' : (raid.completed ? 'Successful Raid' : 'Run Ended')
                      ),
                      React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginTop: 2 } },
                        'Depth: ' + (raid.depth_reached || 0) + 'm  \u2022  Ants: ' + (raid.ants_captured || 0) + '  \u2022  ' + formatTime(raid.time_elapsed_seconds || 0)
                      )
                    ),
                    React.createElement(View, { style: { alignItems: 'flex-end' } },
                      React.createElement(Text, { style: { color: accentColor, fontSize: 12, fontWeight: 'bold' } }, '+' + (raid.worker_dna_collected || 0) + ' DNA'),
                      raid.royal_jelly_collected > 0 && React.createElement(Text, { style: { color: royalColor, fontSize: 11 } }, '+' + raid.royal_jelly_collected + ' Jelly')
                    )
                  );
                })
        )
      )
    );
  };
  // @end:SurfaceScreen

  // @section:RaidScreen-state @depends:[ThemeContext,GameContext]
  var useRaidState = function() {
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var gameCtx = useGameState();
    var insertRaid = useMutation('raid_sessions', 'insert');
    var mutateRaid = insertRaid.mutate;
    var raidQuery = useQuery('raid_sessions', {}, { column: 'created_at', ascending: false });
    var refetchRaids = raidQuery.refetch;

    var activeState = useState(false);
    var raidActive = activeState[0];
    var setRaidActive = activeState[1];
    var healthState = useState(100);
    var health = healthState[0];
    var setHealth = healthState[1];
    var staminaState = useState(100);
    var stamina = staminaState[0];
    var setStamina = staminaState[1];
    var throatState = useState(0);
    var throatCapacity = throatState[0];
    var setThroatCapacity = throatState[1];
    var depthState = useState(0);
    var depth = depthState[0];
    var setDepth = depthState[1];
    var dnaTState = useState(0);
    var dnaThisRun = dnaTState[0];
    var setDnaThisRun = dnaTState[1];
    var jellyTState = useState(0);
    var jellyThisRun = jellyTState[0];
    var setJellyThisRun = jellyTState[1];
    var antsCapturedState = useState(0);
    var antsCaptured = antsCapturedState[0];
    var setAntsCaptured = antsCapturedState[1];
    var timerState = useState(0);
    var timer = timerState[0];
    var setTimer = timerState[1];
    var alarmState = useState(0);
    var alarmLevel = alarmState[0];
    var setAlarmLevel = alarmState[1];
    var collapseState = useState(false);
    var collapseWarning = collapseState[0];
    var setCollapseWarning = collapseState[1];
    var collapseCountState = useState(0);
    var collapseCount = collapseCountState[0];
    var setCollapseCount = collapseCountState[1];
    var antsOnScreenState = useState([]);
    var antsOnScreen = antsOnScreenState[0];
    var setAntsOnScreen = antsOnScreenState[1];
    var phaseState = useState('surface');
    var raidPhase = phaseState[0];
    var setRaidPhase = phaseState[1];
    var bossPhaseState = useState(0);
    var bossPhase = bossPhaseState[0];
    var setBossPhase = bossPhaseState[1];
    var showResultState = useState(false);
    var showResult = showResultState[0];
    var setShowResult = showResultState[1];
    var acidActiveState = useState(false);
    var acidActive = acidActiveState[0];
    var setAcidActive = acidActiveState[1];
    var tongueExtendState = useState(false);
    var tongueExtend = tongueExtendState[0];
    var setTongueExtend = tongueExtendState[1];
    var bossDefeatedState = useState(false);
    var bossDefeated = bossDefeatedState[0];
    var setBossDefeated = bossDefeatedState[1];
    var messageState = useState('');
    var raidMessage = messageState[0];
    var setRaidMessage = messageState[1];
    var staminaAnim = useRef(new Animated.Value(1)).current;
    var collapseAnim = useRef(new Animated.Value(0)).current;
    var alarmAnim = useRef(new Animated.Value(0)).current;

    return {
      theme: theme,
      gameCtx: gameCtx,
      mutateRaid: mutateRaid,
      refetchRaids: refetchRaids,
      raidActive: raidActive, setRaidActive: setRaidActive,
      health: health, setHealth: setHealth,
      stamina: stamina, setStamina: setStamina,
      throatCapacity: throatCapacity, setThroatCapacity: setThroatCapacity,
      depth: depth, setDepth: setDepth,
      dnaThisRun: dnaThisRun, setDnaThisRun: setDnaThisRun,
      jellyThisRun: jellyThisRun, setJellyThisRun: setJellyThisRun,
      antsCaptured: antsCaptured, setAntsCaptured: setAntsCaptured,
      timer: timer, setTimer: setTimer,
      alarmLevel: alarmLevel, setAlarmLevel: setAlarmLevel,
      collapseWarning: collapseWarning, setCollapseWarning: setCollapseWarning,
      collapseCount: collapseCount, setCollapseCount: setCollapseCount,
      antsOnScreen: antsOnScreen, setAntsOnScreen: setAntsOnScreen,
      raidPhase: raidPhase, setRaidPhase: setRaidPhase,
      bossPhase: bossPhase, setBossPhase: setBossPhase,
      showResult: showResult, setShowResult: setShowResult,
      acidActive: acidActive, setAcidActive: setAcidActive,
      tongueExtend: tongueExtend, setTongueExtend: setTongueExtend,
      bossDefeated: bossDefeated, setBossDefeated: setBossDefeated,
      raidMessage: raidMessage, setRaidMessage: setRaidMessage,
      staminaAnim: staminaAnim,
      collapseAnim: collapseAnim,
      alarmAnim: alarmAnim
    };
  };
  // @end:RaidScreen-state

  // @section:RaidScreen-handlers @depends:[RaidScreen-state,helpers]
  var createRaidHandlers = function(state) {
    var spawnAntHandler = function() {
      var screenW = Dimensions.get('window').width;
      var zoneIdx = state.depth < 20 ? 0 : (state.depth < 50 ? 1 : 2);
      var possibleAnts = zoneIdx === 0
        ? [ANT_ARCHETYPES[0], ANT_ARCHETYPES[1]]
        : zoneIdx === 1
          ? [ANT_ARCHETYPES[0], ANT_ARCHETYPES[1], ANT_ARCHETYPES[2], ANT_ARCHETYPES[3]]
          : [ANT_ARCHETYPES[2], ANT_ARCHETYPES[3], ANT_ARCHETYPES[4]];
      var archetype = possibleAnts[Math.floor(Math.random() * possibleAnts.length)];
      var newAnt = {
        id: generateUUID(),
        archetype: archetype,
        x: 20 + Math.random() * (screenW - 80),
        y: 60 + Math.random() * 240,
        captured: false
      };
      state.setAntsOnScreen(function(prev) {
        if (prev.length >= 12) return prev;
        return prev.concat([newAnt]);
      });
    };

    var captureAntHandler = function(antId) {
      var captured = null;
      state.setAntsOnScreen(function(prev) {
        var next = prev.filter(function(a) {
          if (a.id === antId) { captured = a; return false; }
          return true;
        });
        return next;
      });
      if (!captured) return;
      var archetype = captured.archetype;
      var dnagain = archetype.dnaValue;
      var jellygain = archetype.jellyValue;
      state.setDnaThisRun(function(p) { return p + dnagain; });
      state.setJellyThisRun(function(p) { return p + jellygain; });
      state.setAntsCaptured(function(p) { return p + 1; });
      state.setThroatCapacity(function(p) { return Math.min(50, p + 1); });
      if (archetype.id === 'acid_spitter' || archetype.id === 'soldier') {
        state.setStamina(function(p) { return Math.max(0, p - 10); });
        state.setRaidMessage(archetype.id === 'soldier' ? '\u2694\uFE0F Soldier latched! -10 Stamina' : '\uD83D\uDCA7 Acid hit! -10 Stamina');
        setTimeout(function() { state.setRaidMessage(''); }, 1500);
      }
      if (archetype.id === 'queens_guard') {
        state.setHealth(function(p) { return Math.max(0, p - 20); });
        state.setRaidMessage("\uD83D\uDC51 Queen's Guard struck! -20 HP!");
        setTimeout(function() { state.setRaidMessage(''); }, 2000);
        state.setAlarmLevel(3);
      }
      if (state.throatCapacity >= 30 && Math.random() < 0.25) {
        state.setAlarmLevel(function(p) { return Math.min(3, p + 1); });
      }
    };

    var descendHandler = function() {
      if (state.stamina < 15) {
        state.setRaidMessage('\u26A1 Too exhausted to descend!');
        setTimeout(function() { state.setRaidMessage(''); }, 1500);
        return;
      }
      state.setDepth(function(p) { return Math.min(100, p + 5 + Math.floor(Math.random() * 5)); });
      state.setStamina(function(p) { return Math.max(0, p - 8); });
      state.setRaidMessage('\u2B07 Descending deeper...');
      setTimeout(function() { state.setRaidMessage(''); }, 1200);
      if (Math.random() < 0.3) {
        state.setCollapseWarning(true);
        state.setCollapseCount(4);
        state.setRaidMessage('\u26A0\uFE0F Structural collapse in 4 seconds!');
      }
    };

    var panicRetractHandler = function() {
      var sacrificed = Math.floor(state.antsCaptured * 0.4);
      state.setAntsCaptured(function(p) { return Math.max(0, p - sacrificed); });
      state.setThroatCapacity(function(p) { return Math.max(0, p - Math.floor(p * 0.5)); });
      state.setAlarmLevel(0);
      state.setCollapseWarning(false);
      state.setCollapseCount(0);
      state.setStamina(function(p) { return Math.min(100, p + 20); });
      state.setRaidMessage('\u26A1 PANIC RETRACT! Lost ' + sacrificed + ' captures. Stamina restored.');
      setTimeout(function() { state.setRaidMessage(''); }, 2500);
    };

    var acidSalivaHandler = function() {
      if (state.stamina < 20) {
        state.setRaidMessage('Not enough stamina for acid saliva!');
        setTimeout(function() { state.setRaidMessage(''); }, 1500);
        return;
      }
      state.setAcidActive(true);
      state.setStamina(function(p) { return Math.max(0, p - 20); });
      state.setRaidMessage('\uD83E\uDDEA Acidic saliva deployed! Dissolving walls...');
      setTimeout(function() {
        state.setAcidActive(false);
        state.setCollapseWarning(false);
        state.setCollapseCount(0);
        state.setRaidMessage('\u2705 Tunnel cleared!');
        setTimeout(function() { state.setRaidMessage(''); }, 1500);
      }, 2000);
    };

    var endRaidHandler = function(completed, bossKilled) {
      state.setRaidActive(false);
      state.setShowResult(true);
    };

    var saveRaidHandler = function() {
      var raidData = {
        raid_id: generateUUID(),
        depth_reached: state.depth,
        worker_dna_collected: state.dnaThisRun,
        royal_jelly_collected: state.jellyThisRun,
        ants_captured: state.antsCaptured,
        time_elapsed_seconds: state.timer,
        completed: state.health > 0,
        boss_defeated: state.bossDefeated
      };
      state.mutateRaid(raidData).then(function() {
        state.refetchRaids();
        state.gameCtx.setGameState(function(prev) {
          var p = prev || DEFAULT_GAME_STATE;
          return {
            total_worker_dna: (p.total_worker_dna || 0) + raidData.worker_dna_collected,
            total_royal_jelly: (p.total_royal_jelly || 0) + raidData.royal_jelly_collected,
            highest_depth_reached: Math.max(p.highest_depth_reached || 0, raidData.depth_reached),
            total_raids_completed: (p.total_raids_completed || 0) + (raidData.completed ? 1 : 0),
            boss_defeated_count: (p.boss_defeated_count || 0) + (raidData.boss_defeated ? 1 : 0),
            updated_at: new Date().toISOString()
          };
        });
        state.setShowResult(false);
        state.setRaidPhase('surface');
        state.setRaidActive(false);
        state.setHealth(100);
        state.setStamina(100);
        state.setThroatCapacity(0);
        state.setDepth(0);
        state.setDnaThisRun(0);
        state.setJellyThisRun(0);
        state.setAntsCaptured(0);
        state.setTimer(0);
        state.setAlarmLevel(0);
        state.setCollapseWarning(false);
        state.setAntsOnScreen([]);
        state.setBossDefeated(false);
        state.setBossPhase(0);
      }).catch(function(err) {
        Platform.OS === 'web' ? window.alert('Save error: ' + err.message) : Alert.alert('Error', err.message);
      });
    };

    return {
      spawnAnt: spawnAntHandler,
      captureAnt: captureAntHandler,
      descend: descendHandler,
      panicRetract: panicRetractHandler,
      acidSaliva: acidSalivaHandler,
      endRaid: endRaidHandler,
      saveRaid: saveRaidHandler
    };
  };
  // @end:RaidScreen-handlers

  // @section:RaidScreen-GameView @depends:[RaidScreen-state,ANT_ARCHETYPES,styles]
  var RaidGameView = function(props) {
    var state = props.state;
    var handlers = props.handlers;
    var screenWidth = Dimensions.get('window').width;
    var healthColor = state.health > 60 ? '#FF9999' : state.health > 30 ? '#FF4444' : '#8B0000';
    var tongueBodyColor = state.health > 60 ? '#FFB3BA' : state.health > 30 ? '#FF6B6B' : '#C0392B';
    var alarmBorderColor = state.alarmLevel === 0 ? 'transparent' : state.alarmLevel === 1 ? '#F39C12' + '55' : state.alarmLevel === 2 ? '#E67E22' + '88' : '#E74C3C' + 'CC';
    var zoneLabel = state.depth < 20 ? 'ZONE 1: FORAGING COMMONS' : state.depth < 50 ? 'ZONE 2: NURSERY CHAMBERS' : 'ZONE 3: THE FORBIDDEN CORE';
    var zoneBg = state.depth < 20 ? '#1A0F00' : state.depth < 50 ? '#0D0A00' : '#0A0000';

    return React.createElement(View, {
      style: { flex: 1, backgroundColor: zoneBg, borderWidth: 3, borderColor: alarmBorderColor, borderRadius: 0 },
      componentId: 'raid-game-view'
    },
      React.createElement(View, {
        style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08 }
      },
        React.createElement(Image, {
          source: { uri: 'IMAGE:dark-soil-underground-tunnel-cross-section' },
          style: { width: '100%', height: '100%' },
          resizeMode: 'cover',
          componentId: 'tunnel-bg'
        })
      ),
      React.createElement(View, {
        style: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.6)' },
        componentId: 'raid-hud-top'
      },
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 } },
          React.createElement(Text, { style: { color: state.alarmLevel > 0 ? '#FF4444' : textSecondary, fontSize: 10, letterSpacing: 1 } },
            state.alarmLevel === 0 ? '\uD83D\uDFE2 QUIET' : state.alarmLevel === 1 ? '\uD83D\uDFE1 ALERT' : state.alarmLevel === 2 ? '\uD83D\uDFE0 ALARM' : '\uD83D\uDD34 SWARM!'
          ),
          React.createElement(Text, { style: { color: textSecondary, fontSize: 11, fontWeight: 'bold' } }, zoneLabel),
          React.createElement(Text, { style: { color: accentColor, fontSize: 11 } }, '\u23F1 ' + formatTime(state.timer))
        ),
        React.createElement(View, { style: { flexDirection: 'row', marginBottom: 4, alignItems: 'center' } },
          React.createElement(Text, { style: { color: '#FF9999', fontSize: 10, width: 24 } }, '\u2764\uFE0F'),
          React.createElement(View, { style: { flex: 1, height: 8, backgroundColor: '#330000', borderRadius: 4, marginRight: 8 } },
            React.createElement(View, { style: { height: '100%', width: (state.health) + '%', backgroundColor: healthColor, borderRadius: 4 } })
          ),
          React.createElement(Text, { style: { color: healthColor, fontSize: 10, width: 32, textAlign: 'right' } }, state.health + '%')
        ),
        React.createElement(View, { style: { flexDirection: 'row', marginBottom: 4, alignItems: 'center' } },
          React.createElement(Text, { style: { color: '#9999FF', fontSize: 10, width: 24 } }, '\u26A1'),
          React.createElement(View, { style: { flex: 1, height: 8, backgroundColor: '#001133', borderRadius: 4, marginRight: 8 } },
            React.createElement(View, { style: { height: '100%', width: (state.stamina) + '%', backgroundColor: '#4FC3F7', borderRadius: 4 } })
          ),
          React.createElement(Text, { style: { color: '#4FC3F7', fontSize: 10, width: 32, textAlign: 'right' } }, state.stamina + '%')
        ),
        React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
          React.createElement(Text, { style: { color: '#FFCC80', fontSize: 10, width: 24 } }, '\uD83D\uDDE3\uFE0F'),
          React.createElement(View, { style: { flex: 1, height: 8, backgroundColor: '#331100', borderRadius: 4, marginRight: 8 } },
            React.createElement(View, { style: { height: '100%', width: (state.throatCapacity / 50 * 100) + '%', backgroundColor: '#FFCC80', borderRadius: 4 } })
          ),
          React.createElement(Text, { style: { color: '#FFCC80', fontSize: 10, width: 32, textAlign: 'right' } }, state.throatCapacity + '/50')
        )
      ),
      state.raidMessage !== '' && React.createElement(View, {
        style: { backgroundColor: 'rgba(0,0,0,0.85)', paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
        componentId: 'raid-message-bar'
      },
        React.createElement(Text, { style: { color: textPrimary, fontSize: 12, textAlign: 'center' } }, state.raidMessage)
      ),
      state.collapseWarning && React.createElement(View, {
        style: { backgroundColor: dangerColor, paddingVertical: 6, alignItems: 'center' },
        componentId: 'collapse-warning'
      },
        React.createElement(Text, { style: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' } },
          '\u26A0\uFE0F STRUCTURAL COLLAPSE IN ' + state.collapseCount + 's \u2014 RETRACT NOW!'
        )
      ),
      React.createElement(View, {
        style: { flex: 1, position: 'relative' },
        componentId: 'ant-field'
      },
        React.createElement(View, { style: { position: 'absolute', top: '45%', left: '50%', marginLeft: -2, width: 4, backgroundColor: tongueBodyColor, height: '55%', borderRadius: 2, opacity: 0.85 }, componentId: 'tongue-body' }),
        React.createElement(View, { style: { position: 'absolute', top: 10, left: screenWidth / 2 - 20, width: 40, height: 12, backgroundColor: tongueBodyColor, borderRadius: 6, opacity: 0.9 }, componentId: 'tongue-tip' }),
        state.antsOnScreen.map(function(ant) {
          return React.createElement(TouchableOpacity, {
            key: ant.id,
            onPress: function() { handlers.captureAnt(ant.id); },
            style: { position: 'absolute', left: ant.x, top: ant.y, width: ant.archetype.size + 16, height: ant.archetype.size + 16, alignItems: 'center', justifyContent: 'center' },
            componentId: 'ant-' + ant.id
          },
            React.createElement(View, { style: { width: ant.archetype.size + 8, height: ant.archetype.size + 8, borderRadius: (ant.archetype.size + 8) / 2, backgroundColor: ant.archetype.color + '44', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: ant.archetype.color } },
              React.createElement(Text, { style: { fontSize: ant.archetype.size - 2 } }, ant.archetype.icon)
            )
          );
        }),
        React.createElement(View, { style: { position: 'absolute', bottom: 8, left: 8 },
          componentId: 'depth-indicator'
        },
          React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, '\uD83D\uDCCF DEPTH: ' + state.depth + 'm'),
          React.createElement(Text, { style: { color: accentColor, fontSize: 10 } }, '\uD83E\uDDEC +' + state.dnaThisRun + ' DNA'),
          state.jellyThisRun > 0 && React.createElement(Text, { style: { color: royalColor, fontSize: 10 } }, '\uD83D\uDC51 +' + state.jellyThisRun + ' Jelly')
        )
      ),
      React.createElement(View, {
        style: { backgroundColor: 'rgba(0,0,0,0.8)', paddingVertical: 10, paddingHorizontal: 12 },
        componentId: 'raid-controls'
      },
        React.createElement(View, { style: { flexDirection: 'row', marginBottom: 8, justifyContent: 'space-between' } },
          React.createElement(TouchableOpacity, {
            onPress: handlers.descend,
            style: { flex: 1, backgroundColor: primaryColor, borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginRight: 6, borderWidth: 1, borderColor: accentColor },
            componentId: 'descend-btn'
          },
            React.createElement(Text, { style: { color: textPrimary, fontSize: 12, fontWeight: 'bold' } }, '\u2B07 DESCEND [R2]')
          ),
          React.createElement(TouchableOpacity, {
            onPress: handlers.acidSaliva,
            style: { flex: 1, backgroundColor: state.acidActive ? '#27AE60' : '#1A3000', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginLeft: 6, borderWidth: 1, borderColor: '#7BC67E' },
            componentId: 'acid-btn'
          },
            React.createElement(Text, { style: { color: '#7BC67E', fontSize: 12, fontWeight: 'bold' } }, '\uD83E\uDDEA ACID [R1]')
          )
        ),
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
          React.createElement(TouchableOpacity, {
            onPress: handlers.panicRetract,
            style: { flex: 1, backgroundColor: '#4A0000', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginRight: 6, borderWidth: 2, borderColor: dangerColor },
            componentId: 'panic-btn'
          },
            React.createElement(Text, { style: { color: '#FF6666', fontSize: 12, fontWeight: 'bold' } }, '\u26A1 PANIC RETRACT [L1]')
          ),
          React.createElement(TouchableOpacity, {
            onPress: function() { handlers.endRaid(state.health > 0, state.bossDefeated); },
            style: { backgroundColor: '#2D2D2D', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', marginLeft: 6, borderWidth: 1, borderColor: '#555' },
            componentId: 'end-raid-btn'
          },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, '\u21A9 SURFACE')
          )
        )
      )
    );
  };
  // @end:RaidScreen-GameView

  // @section:RaidResultModal @depends:[styles]
  var RaidResultModal = function(props) {
    var state = props.state;
    var onSave = props.onSave;
    var insets = useSafeAreaInsets();
    var baseHeight = (Platform.OS === 'web' && typeof window !== 'undefined' && window.__thunkablePhoneFrameHeight) || Dimensions.get('window').height;
    var sheetHeight = Math.round(baseHeight * 0.85);
    var success = state.health > 0;
    var resultColor = state.bossDefeated ? royalColor : success ? successColor : dangerColor;
    var resultTitle = state.bossDefeated ? '\uD83D\uDC51 QUEEN DEFEATED!' : success ? '\u2705 SUCCESSFUL EXTRACTION' : '\uD83D\uDC80 RUN ENDED';

    return React.createElement(Modal, {
      visible: state.showResult,
      animationType: 'slide',
      transparent: true,
      onRequestClose: function() {}
    },
      React.createElement(View, { style: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.8)' }, componentId: 'result-overlay' },
        React.createElement(View, {
          style: { height: sheetHeight, backgroundColor: cardColor, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 16 },
          componentId: 'result-sheet'
        },
          React.createElement(View, { style: { alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: borderColor } },
            React.createElement(View, { style: { width: 40, height: 4, backgroundColor: borderColor, borderRadius: 2, marginBottom: 16 } }),
            React.createElement(Text, { style: { color: resultColor, fontSize: 22, fontWeight: 'bold', letterSpacing: 1 } }, resultTitle),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12, marginTop: 4 } }, 'RAID COMPLETE \u2014 SURFACE RETURN')
          ),
          React.createElement(ScrollView, { style: { flex: 1 } },
            React.createElement(View, { style: { padding: 20 } },
              React.createElement(View, { style: { backgroundColor: darkCardColor, borderRadius: 12, padding: 16, marginBottom: 16 }, componentId: 'result-stats' },
                React.createElement(Text, { style: { color: textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 12 } }, 'RAID SUMMARY'),
                React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-around' } },
                  React.createElement(View, { style: { alignItems: 'center' } },
                    React.createElement(Text, { style: { color: accentColor, fontSize: 28, fontWeight: 'bold' } }, '+' + state.dnaThisRun),
                    React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, '\uD83E\uDDEC Worker DNA')
                  ),
                  React.createElement(View, { style: { alignItems: 'center' } },
                    React.createElement(Text, { style: { color: royalColor, fontSize: 28, fontWeight: 'bold' } }, '+' + state.jellyThisRun),
                    React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, '\uD83D\uDC51 Royal Jelly')
                  ),
                  React.createElement(View, { style: { alignItems: 'center' } },
                    React.createElement(Text, { style: { color: textPrimary, fontSize: 28, fontWeight: 'bold' } }, String(state.antsCaptured)),
                    React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, '\uD83D\uDC1C Ants Caught')
                  )
                )
              ),
              React.createElement(View, { style: { flexDirection: 'row', marginBottom: 16 } },
                React.createElement(View, { style: { flex: 1, backgroundColor: darkCardColor, borderRadius: 10, padding: 14, marginRight: 8, alignItems: 'center' } },
                  React.createElement(Text, { style: { color: textPrimary, fontSize: 20, fontWeight: 'bold' } }, state.depth + 'm'),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Max Depth')
                ),
                React.createElement(View, { style: { flex: 1, backgroundColor: darkCardColor, borderRadius: 10, padding: 14, marginLeft: 8, alignItems: 'center' } },
                  React.createElement(Text, { style: { color: textPrimary, fontSize: 20, fontWeight: 'bold' } }, formatTime(state.timer)),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'Time Elapsed')
                )
              ),
              React.createElement(TouchableOpacity, {
                onPress: onSave,
                style: { backgroundColor: primaryColor, borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: accentColor },
                componentId: 'save-raid-btn'
              },
                React.createElement(Text, { style: { color: textPrimary, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 } }, '\uD83D\uDCBE DEPOSIT DNA & RETURN TO SURFACE')
              )
            )
          )
        )
      )
    );
  };
  // @end:RaidResultModal

  // @section:RaidScreen @depends:[RaidScreen-state,RaidScreen-handlers,RaidScreen-GameView,RaidResultModal,styles]
  var RaidScreen = function(props) {
    var navigation = props.navigation;
    var state = useRaidState();
    var handlers = createRaidHandlers(state);
    var insets = useSafeAreaInsets();

    var audioHook = useAudio();
    var nativePlay = audioHook.play;
    var nativeStop = audioHook.stop;
    var webAudioRef = useRef(null);

    useEffect(function() {
      if (!state.raidActive) return;
      var spawnInterval = setInterval(function() {
        handlers.spawnAnt();
      }, 1800);
      var timerInterval = setInterval(function() {
        state.setTimer(function(p) { return p + 1; });
        if (Math.random() < 0.06) {
          state.setStamina(function(p) { return Math.max(0, p - 3); });
        }
      }, 1000);
      var collapseInterval = setInterval(function() {
        if (state.collapseWarning) {
          state.setCollapseCount(function(p) {
            if (p <= 1) {
              state.setCollapseWarning(false);
              state.setHealth(function(h) { return Math.max(0, h - 30); });
              state.setRaidMessage('\uD83D\uDCA5 TUNNEL COLLAPSED! -30 HP!');
              setTimeout(function() { state.setRaidMessage(''); }, 2000);
              return 0;
            }
            return p - 1;
          });
        }
      }, 1000);
      var alarmDecayInterval = setInterval(function() {
        if (!state.raidActive) return;
        state.setAlarmLevel(function(p) { return Math.max(0, p - (Math.random() < 0.3 ? 1 : 0)); });
      }, 5000);
      return function() {
        clearInterval(spawnInterval);
        clearInterval(timerInterval);
        clearInterval(collapseInterval);
        clearInterval(alarmDecayInterval);
      };
    }, [state.raidActive]);

    useEffect(function() {
      if (state.health <= 0 && state.raidActive) {
        state.setRaidActive(false);
        state.setRaidMessage('\uD83D\uDC80 TONGUE SEVERED! Mission failed.');
        setTimeout(function() {
          state.setShowResult(true);
        }, 1500);
      }
    }, [state.health, state.raidActive]);

    var surfaceHeight = Dimensions.get('window').height;

    if (!state.raidActive && !state.showResult) {
      return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor }, componentId: 'raid-surface-prep' },
        React.createElement(StatusBar, { barStyle: 'light-content', backgroundColor: '#6B3410' }),
        React.createElement(View, { style: { backgroundColor: '#6B3410', paddingTop: insets.top, paddingBottom: 14, paddingHorizontal: 16 }, componentId: 'raid-header' },
          React.createElement(Text, { style: { color: textPrimary, fontSize: 20, fontWeight: 'bold' } }, '\u2694\uFE0F RAID PREPARATION'),
          React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Confirm your loadout before descending')
        ),
        React.createElement(ScrollView, {
          style: { flex: 1 },
          contentContainerStyle: { padding: 16, paddingBottom: WEB_TAB_MENU_PADDING },
          componentId: 'raid-prep-scroll'
        },
          React.createElement(View, { style: { borderRadius: 16, overflow: 'hidden', marginBottom: 16 }, componentId: 'raid-hero-card' },
            React.createElement(Image, {
              source: { uri: 'IMAGE:anteater-tongue-underground-tunnel-action' },
              style: { width: '100%', height: 160, borderRadius: 16 },
              resizeMode: 'cover',
              componentId: 'raid-hero-img'
            }),
            React.createElement(View, { style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', padding: 16, justifyContent: 'flex-end' } },
              React.createElement(Text, { style: { color: textPrimary, fontSize: 17, fontWeight: 'bold' } }, 'COLONY ALPHA-7'),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Zone 1\u20133 Accessible  \u2022  Boss: Active  \u2022  Guards: 3')
            )
          ),
          React.createElement(View, { style: { backgroundColor: cardColor, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: borderColor }, componentId: 'loadout-card' },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 12 } }, 'INFILTRATION BRIEFING'),
            React.createElement(View, { style: { marginBottom: 8 } },
              React.createElement(Text, { style: { color: textPrimary, fontSize: 13, marginBottom: 4 } }, '\u2022 Tap ants on screen to capture them with your tongue'),
              React.createElement(Text, { style: { color: textPrimary, fontSize: 13, marginBottom: 4 } }, '\u2022 Press DESCEND to push deeper into the colony'),
              React.createElement(Text, { style: { color: textPrimary, fontSize: 13, marginBottom: 4 } }, '\u2022 PANIC RETRACT sacrifices captures but saves your life'),
              React.createElement(Text, { style: { color: textPrimary, fontSize: 13, marginBottom: 4 } }, '\u2022 Acid Saliva dissolves walls and stops cave-ins'),
              React.createElement(Text, { style: { color: '#FF9999', fontSize: 13 } }, '\u2022 Soldier ants and acid spitters deal heavy damage!')
            )
          ),
          React.createElement(View, { style: { flexDirection: 'row', marginBottom: 16 } },
            React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 12, padding: 14, marginRight: 8, alignItems: 'center', borderWidth: 1, borderColor: '#4FC3F7' + '55' } },
              React.createElement(Text, { style: { color: '#4FC3F7', fontSize: 22 } }, '\uD83D\uDCAA'),
              React.createElement(Text, { style: { color: textPrimary, fontSize: 13, fontWeight: 'bold' } }, 'HEALTH'),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, '100 / 100')
            ),
            React.createElement(View, { style: { flex: 1, backgroundColor: cardColor, borderRadius: 12, padding: 14, marginLeft: 8, alignItems: 'center', borderWidth: 1, borderColor: accentColor + '55' } },
              React.createElement(Text, { style: { color: accentColor, fontSize: 22 } }, '\u26A1'),
              React.createElement(Text, { style: { color: textPrimary, fontSize: 13, fontWeight: 'bold' } }, 'STAMINA'),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, '100 / 100')
            )
          ),
          React.createElement(TouchableOpacity, {
            onPress: function() {
              state.setRaidActive(true);
              state.setRaidPhase('raid');
              state.setRaidMessage('\uD83D\uDC1C Entering the colony...');
              setTimeout(function() { state.setRaidMessage(''); }, 2000);
            },
            style: { backgroundColor: primaryColor, borderRadius: 16, paddingVertical: 18, alignItems: 'center', borderWidth: 2, borderColor: accentColor },
            componentId: 'start-raid-btn'
          },
            React.createElement(Text, { style: { color: textPrimary, fontSize: 18, fontWeight: 'bold', letterSpacing: 2 } }, '\u2B07  DROP TONGUE  \u2B07')
          )
        ),
        React.createElement(RaidResultModal, { state: state, onSave: handlers.saveRaid })
      );
    }

    return React.createElement(View, { style: { flex: 1, backgroundColor: '#0A0500', paddingTop: insets.top }, componentId: 'raid-active-screen' },
      React.createElement(StatusBar, { barStyle: 'light-content', backgroundColor: '#0A0500' }),
      React.createElement(RaidGameView, { state: state, handlers: handlers }),
      React.createElement(RaidResultModal, { state: state, onSave: handlers.saveRaid })
    );
  };
  // @end:RaidScreen

  // @section:MutationsScreen-state @depends:[ThemeContext,GameContext]
  var useMutationsState = function() {
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var gameCtx = useGameState();
    var mutQuery = useQuery('mutations_unlocked');
    var mutData = mutQuery.data;
    var mutLoading = mutQuery.loading;
    var refetchMuts = mutQuery.refetch;
    var insertMut = useMutation('mutations_unlocked', 'insert');
    var mutateMut = insertMut.mutate;
    var selectedBranchState = useState(null);
    var selectedBranch = selectedBranchState[0];
    var setSelectedBranch = selectedBranchState[1];
    var confirmState = useState(null);
    var confirmPurchase = confirmState[0];
    var setConfirmPurchase = confirmState[1];

    var unlockedMap = useMemo(function() {
      var map = {};
      if (!mutData) return map;
      mutData.forEach(function(m) {
        if (!map[m.branch_name]) map[m.branch_name] = 0;
        if (m.tier_level > map[m.branch_name]) map[m.branch_name] = m.tier_level;
      });
      return map;
    }, [mutData]);

    return {
      theme: theme,
      gameCtx: gameCtx,
      mutLoading: mutLoading,
      refetchMuts: refetchMuts,
      mutateMut: mutateMut,
      selectedBranch: selectedBranch,
      setSelectedBranch: setSelectedBranch,
      confirmPurchase: confirmPurchase,
      setConfirmPurchase: setConfirmPurchase,
      unlockedMap: unlockedMap
    };
  };
  // @end:MutationsScreen-state

  // @section:MutationDetailModal @depends:[MUTATIONS_DATA,styles]
  var MutationDetailModal = function(props) {
    var visible = props.visible;
    var branch = props.branch;
    var unlockedTier = props.unlockedTier;
    var dna = props.dna;
    var onClose = props.onClose;
    var onPurchase = props.onPurchase;
    var insets = useSafeAreaInsets();
    var baseHeight = (Platform.OS === 'web' && typeof window !== 'undefined' && window.__thunkablePhoneFrameHeight) || Dimensions.get('window').height;
    var sheetHeight = Math.round(baseHeight * 0.82);

    if (!branch) return null;
    return React.createElement(Modal, {
      visible: visible,
      animationType: 'slide',
      transparent: true,
      onRequestClose: onClose
    },
      React.createElement(View, { style: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }, componentId: 'mut-modal-overlay' },
        React.createElement(View, { style: { height: sheetHeight, backgroundColor: cardColor, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: insets.bottom + 12 }, componentId: 'mut-modal-sheet' },
          React.createElement(View, { style: { alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: borderColor } },
            React.createElement(View, { style: { width: 40, height: 4, backgroundColor: borderColor, borderRadius: 2, marginBottom: 12 } }),
            React.createElement(Text, { style: { color: branch.color, fontSize: 20, fontWeight: 'bold' } }, branch.name.toUpperCase() + ' BRANCH'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, branch.description)
          ),
          React.createElement(ScrollView, { style: { flex: 1 }, contentContainerStyle: { padding: 16 } },
            branch.tiers.map(function(tier) {
              var unlocked = unlockedTier >= tier.tier;
              var canUnlock = unlockedTier === tier.tier - 1 && dna >= tier.cost;
              var locked = unlockedTier < tier.tier - 1;
              return React.createElement(View, {
                key: 'tier-' + tier.tier,
                style: { backgroundColor: darkCardColor, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: unlocked ? branch.color : (canUnlock ? branch.color + '66' : borderColor), opacity: locked ? 0.5 : 1.0 },
                componentId: 'tier-card-' + tier.tier
              },
                React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } },
                  React.createElement(View, { style: { flex: 1 } },
                    React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 } },
                      React.createElement(View, { style: { backgroundColor: unlocked ? branch.color : borderColor, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginRight: 8 } },
                        React.createElement(Text, { style: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' } }, 'TIER ' + tier.tier)
                      ),
                      unlocked && React.createElement(Text, { style: { color: successColor, fontSize: 12 } }, '\u2705 UNLOCKED')
                    ),
                    React.createElement(Text, { style: { color: textPrimary, fontSize: 15, fontWeight: 'bold', marginBottom: 4 } }, tier.name),
                    React.createElement(Text, { style: { color: textSecondary, fontSize: 12, lineHeight: 18 } }, tier.description)
                  )
                ),
                React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 } },
                  React.createElement(View, { style: { backgroundColor: primaryColor + '33', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: accentColor + '55' } },
                    React.createElement(Text, { style: { color: accentColor, fontSize: 12, fontWeight: 'bold' } }, '\u2699\uFE0F ' + tier.effect)
                  ),
                  !unlocked && canUnlock
                    ? React.createElement(TouchableOpacity, {
                        onPress: function() { onPurchase(branch, tier); },
                        style: { backgroundColor: primaryColor, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: accentColor },
                        componentId: 'purchase-tier-' + tier.tier
                      },
                        React.createElement(Text, { style: { color: textPrimary, fontSize: 12, fontWeight: 'bold' } }, '\uD83E\uDDEC ' + tier.cost + ' DNA')
                      )
                    : !unlocked && React.createElement(View, { style: { backgroundColor: '#222', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 } },
                        React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, locked ? '\uD83D\uDD12 Tier ' + (tier.tier - 1) + ' Required' : '\uD83E\uDDEC ' + tier.cost + ' DNA')
                      )
                )
              );
            }),
            React.createElement(View, { style: { marginTop: 8 } },
              React.createElement(Text, { style: { color: textSecondary, fontSize: 12, letterSpacing: 1, marginBottom: 12 } }, 'GENETIC LAB \u2014 ROYAL JELLY UPGRADES'),
              GENETIC_LAB_UNLOCKS.map(function(unlock) {
                return React.createElement(View, {
                  key: unlock.id,
                  style: { backgroundColor: darkCardColor, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: royalColor + '44' },
                  componentId: 'lab-unlock-' + unlock.id
                },
                  React.createElement(View, { style: { flexDirection: 'row', alignItems: 'flex-start' } },
                    React.createElement(MaterialIcons, { name: unlock.icon, size: 28, color: royalColor, style: { marginRight: 12 } }),
                    React.createElement(View, { style: { flex: 1 } },
                      React.createElement(Text, { style: { color: textPrimary, fontSize: 14, fontWeight: 'bold', marginBottom: 4 } }, unlock.name),
                      React.createElement(Text, { style: { color: textSecondary, fontSize: 12, lineHeight: 17 } }, unlock.description)
                    )
                  ),
                  React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 } },
                    React.createElement(View, { style: { backgroundColor: royalColor + '22', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: royalColor } },
                      React.createElement(Text, { style: { color: royalColor, fontSize: 12, fontWeight: 'bold' } }, '\uD83D\uDC51 ' + unlock.cost + ' Royal Jelly')
                    )
                  )
                );
              })
            )
          ),
          React.createElement(TouchableOpacity, {
            onPress: onClose,
            style: { marginHorizontal: 16, paddingVertical: 14, borderRadius: 12, backgroundColor: darkCardColor, alignItems: 'center', borderWidth: 1, borderColor: borderColor },
            componentId: 'close-mut-modal-btn'
          },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 14 } }, 'CLOSE')
          )
        )
      )
    );
  };
  // @end:MutationDetailModal

  // @section:MutationsScreen @depends:[MutationsScreen-state,MutationDetailModal,MUTATIONS_DATA,styles]
  var MutationsScreen = function(props) {
    var state = useMutationsState();
    var insets = useSafeAreaInsets();
    var scrollBottomPadding = Platform.OS === 'web' ? WEB_TAB_MENU_PADDING : TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING;
    var gameData = state.gameCtx.gameState || DEFAULT_GAME_STATE;
    var currentDNA = gameData.total_worker_dna || 0;
    var currentJelly = gameData.total_royal_jelly || 0;

    var handlePurchase = function(branch, tier) {
      if (currentDNA < tier.cost) {
        Platform.OS === 'web' ? window.alert('Not enough Worker DNA!') : Alert.alert('Insufficient DNA', 'You need ' + tier.cost + ' Worker DNA to unlock this mutation.');
        return;
      }
      state.mutateMut({
        mutation_id: generateUUID(),
        branch_name: branch.id,
        tier_level: tier.tier,
        is_active: true,
        dna_cost_total: tier.cost
      }).then(function() {
        state.refetchMuts();
        state.gameCtx.setGameState(function(prev) {
          var p = prev || DEFAULT_GAME_STATE;
          return Object.assign({}, p, { total_worker_dna: Math.max(0, (p.total_worker_dna || 0) - tier.cost) });
        });
        state.setSelectedBranch(null);
        Platform.OS === 'web' ? window.alert('Mutation Unlocked: ' + tier.name + '!') : Alert.alert('Mutation Unlocked!', tier.name + ' has been integrated.');
      }).catch(function(err) {
        Platform.OS === 'web' ? window.alert(err.message) : Alert.alert('Error', err.message);
      });
    };

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor }, componentId: 'mutations-screen' },
      React.createElement(StatusBar, { barStyle: 'light-content', backgroundColor: '#6B3410' }),
      React.createElement(View, {
        style: { backgroundColor: '#6B3410', paddingTop: insets.top, paddingBottom: 14, paddingHorizontal: 16 },
        componentId: 'mutations-header'
      },
        React.createElement(Text, { style: { color: textPrimary, fontSize: 20, fontWeight: 'bold' } }, '\uD83E\uDDEC MUTATION LAB'),
        React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Biotic Nursery & Genetic Lab'),
        React.createElement(View, { style: { flexDirection: 'row', marginTop: 10 } },
          React.createElement(View, { style: { backgroundColor: '#2D1A0A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginRight: 10, borderWidth: 1, borderColor: accentColor } },
            React.createElement(Text, { style: { color: accentColor, fontSize: 13, fontWeight: 'bold' } }, '\uD83E\uDDEC DNA: ' + currentDNA)
          ),
          React.createElement(View, { style: { backgroundColor: '#2D1A0A', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: royalColor } },
            React.createElement(Text, { style: { color: royalColor, fontSize: 13, fontWeight: 'bold' } }, '\uD83D\uDC51 Jelly: ' + currentJelly)
          )
        )
      ),
      React.createElement(ScrollView, {
        style: { flex: 1 },
        contentContainerStyle: { padding: 16, paddingBottom: scrollBottomPadding },
        componentId: 'mutations-scroll'
      },
        state.mutLoading
          ? React.createElement(ActivityIndicator, { color: primaryColor, style: { marginTop: 40 }, componentId: 'mut-loading' })
          : null,
        React.createElement(Text, { style: { color: textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 14 } }, 'BIOTIC NURSERY \u2014 SELECT A BRANCH'),
        MUTATION_BRANCHES.map(function(branch) {
          var unlockedTier = state.unlockedMap[branch.id] || 0;
          var maxTier = branch.tiers.length;
          var nextTier = branch.tiers[unlockedTier];
          var canAfford = nextTier && currentDNA >= nextTier.cost;

          return React.createElement(TouchableOpacity, {
            key: branch.id,
            onPress: function() { state.setSelectedBranch(branch); },
            style: { backgroundColor: cardColor, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 2, borderColor: unlockedTier > 0 ? branch.color + '66' : borderColor },
            componentId: 'branch-card-' + branch.id
          },
            React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 } },
              React.createElement(View, { style: { width: 48, height: 48, borderRadius: 24, backgroundColor: branch.color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 2, borderColor: branch.color + '55' } },
                React.createElement(MaterialIcons, { name: branch.icon, size: 26, color: branch.color })
              ),
              React.createElement(View, { style: { flex: 1 } },
                React.createElement(Text, { style: { color: branch.color, fontSize: 16, fontWeight: 'bold' } }, branch.name.toUpperCase()),
                React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, branch.description)
              ),
              React.createElement(View, { style: { alignItems: 'flex-end' } },
                React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, 'TIER'),
                React.createElement(Text, { style: { color: branch.color, fontSize: 22, fontWeight: 'bold' } }, unlockedTier + '/' + maxTier)
              )
            ),
            React.createElement(View, { style: { flexDirection: 'row', marginBottom: 10 } },
              branch.tiers.map(function(t) {
                var done = unlockedTier >= t.tier;
                var next = unlockedTier === t.tier - 1;
                return React.createElement(View, {
                  key: 'pip-' + t.tier,
                  style: { flex: 1, height: 6, marginRight: t.tier < branch.tiers.length ? 4 : 0, borderRadius: 3, backgroundColor: done ? branch.color : (next ? branch.color + '44' : '#333') }
                });
              })
            ),
            nextTier
              ? React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: darkCardColor, borderRadius: 10, padding: 10 } },
                  React.createElement(View, null,
                    React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'NEXT: Tier ' + nextTier.tier),
                    React.createElement(Text, { style: { color: textPrimary, fontSize: 12, fontWeight: 'bold' } }, nextTier.name)
                  ),
                  React.createElement(View, { style: { backgroundColor: canAfford ? primaryColor : '#333', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 } },
                    React.createElement(Text, { style: { color: canAfford ? textPrimary : textSecondary, fontSize: 12, fontWeight: 'bold' } }, '\uD83E\uDDEC ' + nextTier.cost)
                  )
                )
              : React.createElement(View, { style: { backgroundColor: successColor + '22', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: successColor + '55' } },
                  React.createElement(Text, { style: { color: successColor, fontSize: 13, fontWeight: 'bold' } }, '\u2705 ALL TIERS UNLOCKED')
                )
          );
        }),
        React.createElement(View, { style: { backgroundColor: royalColor + '11', borderRadius: 16, padding: 16, marginTop: 8, borderWidth: 1, borderColor: royalColor + '44' }, componentId: 'genetic-lab-card' },
          React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 } },
            React.createElement(MaterialIcons, { name: 'science', size: 28, color: royalColor, style: { marginRight: 10 } }),
            React.createElement(View, null,
              React.createElement(Text, { style: { color: royalColor, fontSize: 16, fontWeight: 'bold' } }, 'GENETIC LAB'),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Spend Royal Jelly for new mechanics')
            )
          ),
          GENETIC_LAB_UNLOCKS.map(function(unlock) {
            return React.createElement(View, {
              key: unlock.id,
              style: { flexDirection: 'row', alignItems: 'center', backgroundColor: darkCardColor, borderRadius: 10, padding: 12, marginBottom: 8 },
              componentId: 'lab-' + unlock.id
            },
              React.createElement(MaterialIcons, { name: unlock.icon, size: 22, color: royalColor, style: { marginRight: 10 } }),
              React.createElement(View, { style: { flex: 1 } },
                React.createElement(Text, { style: { color: textPrimary, fontSize: 13, fontWeight: 'bold' } }, unlock.name),
                React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, unlock.description.substring(0, 55) + '...')
              ),
              React.createElement(Text, { style: { color: royalColor, fontSize: 12, fontWeight: 'bold' } }, unlock.cost + ' \uD83D\uDC51')
            );
          })
        )
      ),
      React.createElement(MutationDetailModal, {
        visible: state.selectedBranch !== null,
        branch: state.selectedBranch,
        unlockedTier: state.selectedBranch ? (state.unlockedMap[state.selectedBranch.id] || 0) : 0,
        dna: currentDNA,
        onClose: function() { state.setSelectedBranch(null); },
        onPurchase: handlePurchase
      })
    );
  };
  // @end:MutationsScreen

  // @section:StatsScreen-state @depends:[ThemeContext,GameContext]
  var useStatsState = function() {
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var gameCtx = useGameState();
    var raidQuery = useQuery('raid_sessions', {}, { column: 'created_at', ascending: false });
    var raidData = raidQuery.data;
    var raidLoading = raidQuery.loading;
    var shareHook = useShare();
    var shareAction = shareHook.share;
    var tabState = useState('overview');
    var activeTab = tabState[0];
    var setActiveTab = tabState[1];

    var raidStats = useMemo(function() {
      if (!raidData || raidData.length === 0) {
        return { totalRaids: 0, totalDNA: 0, totalJelly: 0, avgDepth: 0, bestDepth: 0, totalAnts: 0, successRate: 0 };
      }
      var totalDNA = 0; var totalJelly = 0; var totalAnts = 0; var depthSum = 0; var bestDepth = 0; var successes = 0;
      raidData.forEach(function(r) {
        totalDNA += r.worker_dna_collected || 0;
        totalJelly += r.royal_jelly_collected || 0;
        totalAnts += r.ants_captured || 0;
        var d = r.depth_reached || 0;
        depthSum += d;
        if (d > bestDepth) bestDepth = d;
        if (r.completed) successes++;
      });
      return {
        totalRaids: raidData.length,
        totalDNA: totalDNA,
        totalJelly: totalJelly,
        avgDepth: raidData.length > 0 ? Math.round(depthSum / raidData.length) : 0,
        bestDepth: bestDepth,
        totalAnts: totalAnts,
        successRate: raidData.length > 0 ? Math.round((successes / raidData.length) * 100) : 0
      };
    }, [raidData]);

    return {
      theme: theme,
      gameCtx: gameCtx,
      raidData: raidData || [],
      raidLoading: raidLoading,
      shareAction: shareAction,
      activeTab: activeTab,
      setActiveTab: setActiveTab,
      raidStats: raidStats
    };
  };
  // @end:StatsScreen-state

  // @section:StatsScreen @depends:[StatsScreen-state,helpers,styles]
  var StatsScreen = function(props) {
    var state = useStatsState();
    var insets = useSafeAreaInsets();
    var scrollBottomPadding = Platform.OS === 'web' ? WEB_TAB_MENU_PADDING : TAB_MENU_HEIGHT + insets.bottom + SCROLL_EXTRA_PADDING;
    var gameData = state.gameCtx.gameState || DEFAULT_GAME_STATE;

    var handleShare = function() {
      var msg = 'Ant Feast Stats | Raids: ' + state.raidStats.totalRaids + ' | Best Depth: ' + state.raidStats.bestDepth + 'm | DNA Harvested: ' + state.raidStats.totalDNA + ' | Queens Slain: ' + (gameData.boss_defeated_count || 0);
      state.shareAction({ message: msg }).then(function(result) {
        if (result && result.error) {
          Platform.OS === 'web' ? window.alert(result.error) : Alert.alert('Share Error', result.error);
        }
      });
    };

    var STAT_TABS = ['overview', 'history', 'enemies'];

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor }, componentId: 'stats-screen' },
      React.createElement(StatusBar, { barStyle: 'light-content', backgroundColor: '#6B3410' }),
      React.createElement(View, { style: { backgroundColor: '#6B3410', paddingTop: insets.top, paddingBottom: 14, paddingHorizontal: 16 }, componentId: 'stats-header' },
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement(View, null,
            React.createElement(Text, { style: { color: textPrimary, fontSize: 20, fontWeight: 'bold' } }, '\uD83D\uDCCA WAR ROOM'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, 'Raid Analytics & Enemy Dossier')
          ),
          React.createElement(TouchableOpacity, { onPress: handleShare, style: { padding: 8 }, componentId: 'share-stats-btn' },
            React.createElement(Ionicons, { name: 'share-outline', size: 22, color: textPrimary })
          )
        ),
        React.createElement(View, { style: { flexDirection: 'row', marginTop: 12, backgroundColor: '#2D1A0A', borderRadius: 10, padding: 3 }, componentId: 'stats-tabs' },
          STAT_TABS.map(function(tab) {
            var isActive = state.activeTab === tab;
            return React.createElement(TouchableOpacity, {
              key: tab,
              onPress: function() { state.setActiveTab(tab); },
              style: { flex: 1, paddingVertical: 7, borderRadius: 8, backgroundColor: isActive ? primaryColor : 'transparent', alignItems: 'center' },
              componentId: 'tab-' + tab
            },
              React.createElement(Text, { style: { color: isActive ? textPrimary : textSecondary, fontSize: 12, fontWeight: isActive ? 'bold' : 'normal', textTransform: 'uppercase' } }, tab)
            );
          })
        )
      ),
      React.createElement(ScrollView, {
        style: { flex: 1 },
        contentContainerStyle: { padding: 16, paddingBottom: scrollBottomPadding },
        componentId: 'stats-scroll'
      },
        state.activeTab === 'overview' && React.createElement(View, { componentId: 'overview-panel' },
          React.createElement(View, { style: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4, marginBottom: 16 } },
            [
              { label: 'Total Raids', value: String(state.raidStats.totalRaids), color: textPrimary, icon: '\u2694\uFE0F' },
              { label: 'Success Rate', value: state.raidStats.successRate + '%', color: successColor, icon: '\u2705' },
              { label: 'Best Depth', value: state.raidStats.bestDepth + 'm', color: accentColor, icon: '\uD83D\uDCCF' },
              { label: 'Avg Depth', value: state.raidStats.avgDepth + 'm', color: textSecondary, icon: '\uD83D\uDCCA' },
              { label: 'DNA Harvested', value: String(state.raidStats.totalDNA), color: accentColor, icon: '\uD83E\uDDEC' },
              { label: 'Royal Jelly', value: String(state.raidStats.totalJelly), color: royalColor, icon: '\uD83D\uDC51' },
              { label: 'Ants Captured', value: String(state.raidStats.totalAnts), color: primaryColor, icon: '\uD83D\uDC1C' },
              { label: 'Queens Slain', value: String(gameData.boss_defeated_count || 0), color: royalColor, icon: '\uD83D\uDC51' }
            ].map(function(item, idx) {
              return React.createElement(View, {
                key: String(idx),
                style: { width: '50%', padding: 4 },
                componentId: 'stat-grid-' + idx
              },
                React.createElement(View, { style: { backgroundColor: cardColor, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: borderColor } },
                  React.createElement(Text, { style: { fontSize: 20, marginBottom: 4 } }, item.icon),
                  React.createElement(Text, { style: { color: item.color, fontSize: 22, fontWeight: 'bold' } }, item.value),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 11, marginTop: 2 } }, item.label)
                )
              );
            })
          ),
          React.createElement(View, { style: { backgroundColor: cardColor, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: borderColor }, componentId: 'game-loop-card' },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 12 } }, 'RAID CYCLE'),
            [
              { phase: 'Surface Prep', desc: 'Scout, upgrade mutations, select entry point', icon: '\uD83C\uDF3F' },
              { phase: 'Underground Raid', desc: 'Descend, harvest DNA, fight defenders', icon: '\u2B07' },
              { phase: 'Retreat & Escape', desc: 'Retract tongue, dodge pursuing swarms', icon: '\u2B06' },
              { phase: 'Meta-Progression', desc: 'Bank DNA, unlock mutations, plan next run', icon: '\uD83E\uDDEC' }
            ].map(function(phase, idx) {
              return React.createElement(View, {
                key: String(idx),
                style: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: idx < 3 ? 1 : 0, borderBottomColor: borderColor },
                componentId: 'phase-' + idx
              },
                React.createElement(View, { style: { width: 36, height: 36, borderRadius: 18, backgroundColor: primaryColor + '33', alignItems: 'center', justifyContent: 'center', marginRight: 12 } },
                  React.createElement(Text, { style: { fontSize: 18 } }, phase.icon)
                ),
                React.createElement(View, { style: { flex: 1 } },
                  React.createElement(Text, { style: { color: textPrimary, fontSize: 13, fontWeight: 'bold' } }, phase.phase),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, phase.desc)
                ),
                React.createElement(View, { style: { width: 24, height: 24, borderRadius: 12, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center' } },
                  React.createElement(Text, { style: { color: '#FFF', fontSize: 12, fontWeight: 'bold' } }, String(idx + 1))
                )
              );
            })
          )
        ),
        state.activeTab === 'history' && React.createElement(View, { componentId: 'history-panel' },
          state.raidLoading
            ? React.createElement(ActivityIndicator, { color: primaryColor, style: { marginTop: 40 }, componentId: 'history-loading' })
            : state.raidData.length === 0
              ? React.createElement(View, { style: { backgroundColor: cardColor, borderRadius: 12, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: borderColor }, componentId: 'no-history' },
                  React.createElement(Text, { style: { fontSize: 40, marginBottom: 12 } }, '\uD83D\uDCED'),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 14, textAlign: 'center' } }, 'No raid history yet. Descend into the colony to begin.')
                )
              : state.raidData.map(function(raid, idx) {
                  return React.createElement(View, {
                    key: raid.raid_id || String(idx),
                    style: { backgroundColor: cardColor, borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: raid.boss_defeated ? royalColor + '44' : (raid.completed ? successColor + '33' : dangerColor + '33') },
                    componentId: 'history-item-' + idx
                  },
                    React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 } },
                      React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center' } },
                        React.createElement(Text, { style: { fontSize: 22, marginRight: 10 } }, raid.boss_defeated ? '\uD83D\uDC51' : raid.completed ? '\u2705' : '\uD83D\uDC80'),
                        React.createElement(View, null,
                          React.createElement(Text, { style: { color: textPrimary, fontSize: 14, fontWeight: 'bold' } },
                            raid.boss_defeated ? 'QUEEN SLAIN' : raid.completed ? 'Extraction Success' : 'Mission Failed'
                          ),
                          React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, '\u23F1 ' + formatTime(raid.time_elapsed_seconds || 0) + '  \u2022  \uD83D\uDCCF ' + (raid.depth_reached || 0) + 'm')
                        )
                      ),
                      React.createElement(View, { style: { alignItems: 'flex-end' } },
                        React.createElement(Text, { style: { color: accentColor, fontSize: 13, fontWeight: 'bold' } }, '+' + (raid.worker_dna_collected || 0) + ' \uD83E\uDDEC'),
                        raid.royal_jelly_collected > 0 && React.createElement(Text, { style: { color: royalColor, fontSize: 12 } }, '+' + raid.royal_jelly_collected + ' \uD83D\uDC51')
                      )
                    ),
                    React.createElement(View, { style: { flexDirection: 'row', backgroundColor: darkCardColor, borderRadius: 8, padding: 8 } },
                      React.createElement(View, { style: { flex: 1, alignItems: 'center' } },
                        React.createElement(Text, { style: { color: primaryColor, fontSize: 16, fontWeight: 'bold' } }, String(raid.ants_captured || 0)),
                        React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'Ants')
                      ),
                      React.createElement(View, { style: { flex: 1, alignItems: 'center' } },
                        React.createElement(Text, { style: { color: accentColor, fontSize: 16, fontWeight: 'bold' } }, String(raid.worker_dna_collected || 0)),
                        React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'Worker DNA')
                      ),
                      React.createElement(View, { style: { flex: 1, alignItems: 'center' } },
                        React.createElement(Text, { style: { color: royalColor, fontSize: 16, fontWeight: 'bold' } }, String(raid.royal_jelly_collected || 0)),
                        React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'Royal Jelly')
                      )
                    )
                  );
                })
        ),
        state.activeTab === 'enemies' && React.createElement(View, { componentId: 'enemies-panel' },
          React.createElement(Text, { style: { color: textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 14 } }, 'DEFENDER ARCHETYPES'),
          ANT_ARCHETYPES.map(function(ant, idx) {
            return React.createElement(View, {
              key: ant.id,
              style: { backgroundColor: cardColor, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: ant.color + '55' },
              componentId: 'enemy-' + ant.id
            },
              React.createElement(View, { style: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 } },
                React.createElement(View, { style: { width: 52, height: 52, borderRadius: 26, backgroundColor: ant.color + '22', alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 2, borderColor: ant.color } },
                  React.createElement(Text, { style: { fontSize: 26 } }, ant.icon)
                ),
                React.createElement(View, { style: { flex: 1 } },
                  React.createElement(Text, { style: { color: ant.color, fontSize: 16, fontWeight: 'bold', marginBottom: 2 } }, ant.name.toUpperCase()),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, ant.behavior)
                )
              ),
              React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between' } },
                React.createElement(View, { style: { backgroundColor: darkCardColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' } },
                  React.createElement(Text, { style: { color: dangerColor, fontSize: 13, fontWeight: 'bold' } }, ant.hp === 0 ? '-' : String(ant.hp)),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'HP')
                ),
                React.createElement(View, { style: { backgroundColor: darkCardColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' } },
                  React.createElement(Text, { style: { color: accentColor, fontSize: 13, fontWeight: 'bold' } }, ant.dnaValue > 0 ? String(ant.dnaValue) : '-'),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, '\uD83E\uDDEC DNA')
                ),
                React.createElement(View, { style: { backgroundColor: darkCardColor, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' } },
                  React.createElement(Text, { style: { color: royalColor, fontSize: 13, fontWeight: 'bold' } }, ant.jellyValue > 0 ? String(ant.jellyValue) : '-'),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, '\uD83D\uDC51 Jelly')
                )
              )
            );
          }),
          React.createElement(View, { style: { backgroundColor: cardColor, borderRadius: 14, padding: 16, marginTop: 8, borderWidth: 1, borderColor: borderColor }, componentId: 'pheromone-card' },
            React.createElement(Text, { style: { color: textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 12 } }, 'PHEROMONE ALERT LEVELS'),
            [
              { level: 'QUIET', color: successColor, icon: '\uD83D\uDFE2', desc: 'No ants alerted. Stealth approach viable.' },
              { level: 'ALERT', color: '#F39C12', icon: '\uD83D\uDFE1', desc: 'Workers spotted tongue. Nearby ants aware.' },
              { level: 'ALARM', color: '#E67E22', icon: '\uD83D\uDFE0', desc: 'Soldiers mobilized. Defensive formations active.' },
              { level: 'SWARM!', color: dangerColor, icon: '\uD83D\uDD34', desc: 'Full nest response. Queen\'s Guards inbound.' }
            ].map(function(entry, idx) {
              return React.createElement(View, {
                key: String(idx),
                style: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: idx < 3 ? 1 : 0, borderBottomColor: borderColor },
                componentId: 'pheromone-level-' + idx
              },
                React.createElement(Text, { style: { fontSize: 18, marginRight: 10 } }, entry.icon),
                React.createElement(View, null,
                  React.createElement(Text, { style: { color: entry.color, fontSize: 13, fontWeight: 'bold' } }, entry.level),
                  React.createElement(Text, { style: { color: textSecondary, fontSize: 11 } }, entry.desc)
                )
              );
            })
          )
        )
      )
    );
  };
  // @end:StatsScreen

  // @section:ColonyMapScreen @depends:[ThemeContext,GameContext]
  var ColonyMapScreen = function(props) {
    var navigation = props.navigation;
    var themeCtx = useTheme();
    var theme = themeCtx.theme;
    var insets = useSafeAreaInsets();
    var locationHook = useLocation();
    var getCurrentLocation = locationHook.getCurrentLocation;
    var reverseGeocode = locationHook.reverseGeocode;
    var mapsHook = useMaps({ latitude: 37.7749, longitude: -122.4194, latitudeDelta: 0.05, longitudeDelta: 0.05 });
    var MapView = mapsHook.MapView;
    var Marker = mapsHook.Marker;
    var region = mapsHook.region;
    var setRegion = mapsHook.setRegion;
    var animateToRegion = mapsHook.animateToRegion;
    var addMarker = mapsHook.addMarker;
    var markers = mapsHook.markers;

    var locationState = useState(null);
    var userLocation = locationState[0];
    var setUserLocation = locationState[1];
    var locationErrorState = useState('');
    var locationError = locationErrorState[0];
    var setLocationError = locationErrorState[1];
    var locationLoadingState = useState(false);
    var locationLoading = locationLoadingState[0];
    var setLocationLoading = locationLoadingState[1];
    var addressState = useState('');
    var userAddress = addressState[0];
    var setUserAddress = addressState[1];

    var MOCK_COLONIES = [
      { id: 'col1', name: 'Colony Alpha-7', activity: 'High', depth: 60, lat: 37.7749, lng: -122.4194 },
      { id: 'col2', name: 'Colony Beta-3', activity: 'Medium', depth: 35, lat: 37.7830, lng: -122.4090 },
      { id: 'col3', name: 'Colony Gamma-12', activity: 'Critical', depth: 95, lat: 37.7680, lng: -122.4310 }
    ];

    useEffect(function() {
      MOCK_COLONIES.forEach(function(col) {
        addMarker({ id: col.id, coordinate: { latitude: col.lat, longitude: col.lng }, title: col.name, description: 'Activity: ' + col.activity + ' | Depth: ~' + col.depth + 'm' });
      });
    }, [addMarker]);

    var handleLocate = function() {
      setLocationLoading(true);
      setLocationError('');
      getCurrentLocation().then(function(result) {
        setLocationLoading(false);
        if (result.error) {
          setLocationError(result.error);
          return;
        }
        setUserLocation({ latitude: result.latitude, longitude: result.longitude });
        animateToRegion({ latitude: result.latitude, longitude: result.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
        reverseGeocode(result.latitude, result.longitude).then(function(geo) {
          if (geo[0] && !geo[0].error) {
            setUserAddress((geo[0].city || '') + (geo[0].country ? ', ' + geo[0].country : ''));
          }
        });
      });
    };

    return React.createElement(View, { style: { flex: 1, backgroundColor: backgroundColor }, componentId: 'colony-map-screen' },
      React.createElement(StatusBar, { barStyle: 'light-content', backgroundColor: '#6B3410' }),
      React.createElement(View, { style: { backgroundColor: '#6B3410', paddingTop: insets.top, paddingBottom: 14, paddingHorizontal: 16 }, componentId: 'map-header' },
        React.createElement(View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
          React.createElement(View, null,
            React.createElement(Text, { style: { color: textPrimary, fontSize: 20, fontWeight: 'bold' } }, '\uD83D\uDDFA\uFE0F COLONY MAP'),
            React.createElement(Text, { style: { color: textSecondary, fontSize: 12 } }, userAddress ? userAddress : 'Surface Reconnaissance')
          ),
          React.createElement(TouchableOpacity, {
            onPress: handleLocate,
            style: { backgroundColor: primaryColor, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' },
            componentId: 'locate-btn'
          },
            locationLoading
              ? React.createElement(ActivityIndicator, { color: textPrimary, size: 'small', componentId: 'locate-loading' })
              : React.createElement(Ionicons, { name: 'locate', size: 18, color: textPrimary }),
            React.createElement(Text, { style: { color: textPrimary, fontSize: 12, marginLeft: 6 } }, 'LOCATE')
          )
        ),
        locationError !== '' && React.createElement(Text, { style: { color: dangerColor, fontSize: 11, marginTop: 6 } }, '\u26A0\uFE0F ' + locationError)
      ),
      React.createElement(View, { style: { flex: 1 }, componentId: 'map-container' },
        React.createElement(MapView, {
          provider: 'google',
          style: { flex: 1 },
          region: region,
          onRegionChangeComplete: setRegion,
          showsUserLocation: true
        },
          markers.map(function(m) {
            return React.createElement(Marker, {
              key: m.id,
              coordinate: m.coordinate,
              title: m.title,
              description: m.description
            });
          })
        )
      ),
      React.createElement(View, {
        style: { backgroundColor: 'rgba(13,7,0,0.92)', paddingHorizontal: 16, paddingVertical: 12, paddingBottom: insets.bottom + 12 },
        componentId: 'map-legend'
      },
        React.createElement(Text, { style: { color: textSecondary, fontSize: 11, letterSpacing: 1, marginBottom: 8 } }, 'DETECTED COLONIES'),
        React.createElement(ScrollView, { horizontal: true, showsHorizontalScrollIndicator: false, style: { flexGrow: 0 } },
          MOCK_COLONIES.map(function(col) {
            var actColor = col.activity === 'Critical' ? dangerColor : col.activity === 'High' ? '#F39C12' : successColor;
            return React.createElement(TouchableOpacity, {
              key: col.id,
              onPress: function() {
                animateToRegion({ latitude: col.lat, longitude: col.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 500);
              },
              style: { backgroundColor: cardColor, borderRadius: 10, padding: 10, marginRight: 10, minWidth: 120, borderWidth: 1, borderColor: actColor + '55' },
              componentId: 'colony-chip-' + col.id
            },
              React.createElement(Text, { style: { color: actColor, fontSize: 11, fontWeight: 'bold', marginBottom: 2 } }, col.activity.toUpperCase()),
              React.createElement(Text, { style: { color: textPrimary, fontSize: 12 } }, col.name),
              React.createElement(Text, { style: { color: textSecondary, fontSize: 10 } }, 'Depth: ~' + col.depth + 'm')
            );
          })
        )
      )
    );
  };
  // @end:ColonyMapScreen

  // @section:TabNavigator @depends:[SurfaceScreen,RaidScreen,MutationsScreen,StatsScreen,ColonyMapScreen,navigation-setup]
  var TabNavigator = function() {
    var insets = useSafeAreaInsets();
    return React.createElement(View, { style: { flex: 1, width: '100%', height: '100%', overflow: 'hidden' } },
      React.createElement(Tab.Navigator, {
        screenOptions: {
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            height: Platform.OS === 'web' ? TAB_MENU_HEIGHT : TAB_MENU_HEIGHT + insets.bottom,
            paddingBottom: 0,
            borderTopWidth: 1,
            borderTopColor: borderColor,
            backgroundColor: '#0D0700'
          },
          tabBarItemStyle: { padding: 0 },
          tabBarActiveTintColor: accentColor,
          tabBarInactiveTintColor: textSecondary
        }
      },
        React.createElement(Tab.Screen, {
          name: 'Surface',
          component: SurfaceScreen,
          options: {
            tabBarLabel: 'SURFACE',
            tabBarIcon: function(p) { return React.createElement(Text, { style: { fontSize: 16 } }, '\uD83C\uDF3F'); }
          }
        }),
        React.createElement(Tab.Screen, {
          name: 'Raid',
          component: RaidScreen,
          options: {
            tabBarLabel: 'RAID',
            tabBarIcon: function(p) { return React.createElement(Text, { style: { fontSize: 16 } }, '\u2B07'); }
          }
        }),
        React.createElement(Tab.Screen, {
          name: 'Mutations',
          component: MutationsScreen,
          options: {
            tabBarLabel: 'MUTATE',
            tabBarIcon: function(p) { return React.createElement(Text, { style: { fontSize: 16 } }, '\uD83E\uDDEC'); }
          }
        }),
        React.createElement(Tab.Screen, {
          name: 'Stats',
          component: StatsScreen,
          options: {
            tabBarLabel: 'WAR ROOM',
            tabBarIcon: function(p) { return React.createElement(Text, { style: { fontSize: 16 } }, '\uD83D\uDCCA'); }
          }
        }),
        React.createElement(Tab.Screen, {
          name: 'Map',
          component: ColonyMapScreen,
          options: {
            tabBarLabel: 'MAP',
            tabBarIcon: function(p) { return React.createElement(Text, { style: { fontSize: 16 } }, '\uD83D\uDDFA\uFE0F'); }
          }
        })
      )
    );
  };
  // @end:TabNavigator

  // @section:styles @depends:[theme]
  var styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor
    },
    card: {
      backgroundColor: cardColor,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: borderColor
    },
    sectionTitle: {
      color: textSecondary,
      fontSize: 11,
      letterSpacing: 1,
      marginBottom: 10
    },
    bodyText: {
      color: textPrimary,
      fontSize: 14,
      lineHeight: 20
    },
    fab: {
      position: 'absolute',
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: primaryColor,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8
    }
  });
  // @end:styles

  // @section:return @depends:[ThemeProvider,GameProvider,TabNavigator,styles]
  return React.createElement(ThemeProvider, null,
    React.createElement(GameProvider, null,
      React.createElement(View, { style: { flex: 1, width: '100%', height: '100%' } },
        React.createElement(StatusBar, { barStyle: 'light-content', backgroundColor: '#6B3410' }),
        React.createElement(TabNavigator)
      )
    )
  );
  // @end:return
};

module.exports = ComponentFunction;
