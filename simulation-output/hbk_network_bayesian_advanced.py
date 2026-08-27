# hbk_network_bayesian_advanced.py
# Complete production-grade Bayesian leak detection system with all enhancements
# Adapted for sandbox execution — output to /home/z/my-project/simulation-output

import numpy as np
import pandas as pd
import networkx as nx
from scipy import stats
from scipy.special import expit
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend for headless server
import matplotlib.pyplot as plt
import seaborn as sns
from matplotlib.gridspec import GridSpec
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.express as px
import json
import warnings
from dataclasses import dataclass, field, asdict
from typing import Dict, List, Tuple, Optional, Any
from pathlib import Path
import pickle
from datetime import datetime
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor, as_completed
from multiprocessing import cpu_count
import logging
from tqdm import tqdm
import hashlib
from sklearn.metrics import roc_curve, auc, precision_recall_curve
from scipy.signal import savgol_filter

warnings.filterwarnings('ignore')

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class LeakEvent:
    """Container for leak event data"""
    pipe_id: str
    rate: float
    start_cycle: int
    detected_cycle: Optional[int] = None
    max_posterior: float = 0.0
    convergence_cycle: Optional[int] = None
    false_positives: int = 0
    detection_confidence: float = 0.0
    early_warning_cycles: int = 0
    
@dataclass
class IterationResult:
    """Results from a single iteration"""
    iteration_id: int
    leak_event: LeakEvent
    posterior_trajectory: List[float]
    convergence_trajectory: List[float]
    threshold_exceeded: bool
    detection_time: Optional[int] = None
    convergence_time: Optional[int] = None
    false_positive_count: int = 0
    max_posterior: float = 0.0
    early_warning_triggered: bool = False
    early_warning_time: Optional[int] = None
    adaptive_baseline_updates: int = 0

@dataclass
class BatchStatistics:
    """Aggregate statistics across iterations"""
    num_iterations: int
    detection_rate: float
    detection_times_mean: float
    detection_times_std: float
    detection_times_median: float
    detection_times_ci_lower: float
    detection_times_ci_upper: float
    convergence_rate: float
    convergence_times_mean: float
    false_positive_rate: float
    false_positive_mean: float
    max_posterior_mean: float
    max_posterior_std: float
    early_warning_rate: float
    mean_early_warning_cycles: float
    reliability_score: float
    adaptive_baseline_updates_mean: float
    roc_auc: float
    precision_at_threshold: float
    recall_at_threshold: float
    f1_score: float
    optimal_threshold: float

# ============================================================================
# NETWORK MODEL
# ============================================================================

class WaterNetwork:
    """Hydraulic network model with realistic physics"""
    
    def __init__(self, nodes: Dict, pipes: Dict, sensors: Dict):
        self.nodes = nodes
        self.pipes = pipes
        self.sensors = sensors
        self.G = self._build_graph()
        self._compute_sensitivity_matrix()
        
    def _build_graph(self) -> nx.Graph:
        G = nx.Graph()
        for node_id, node in self.nodes.items():
            G.add_node(node_id, elevation=node['elevation'], demand=node['demand'])
        for pipe_id, pipe in self.pipes.items():
            G.add_edge(pipe['from'], pipe['to'], 
                      length=pipe['length'], diameter=pipe['diameter'],
                      roughness=pipe['roughness'], id=pipe_id)
        return G
    
    def _compute_sensitivity_matrix(self):
        """Compute sensitivity of each sensor to each pipe.
        Uses a sharper exponential decay (scale = 150m) so that only pipes
        genuinely close to a sensor get high sensitivity. This makes the
        likelihood more discriminating — distant pipes get near-zero
        sensitivity, so a leak at PIP3 produces a distinct pressure pattern
        that only PIP3's predicted drop can match."""
        self.sensitivity = {}
        DECAY_SCALE = 150  # metres — sharper than the original 1000
        for sensor_id, sensor in self.sensors.items():
            sensor_node = sensor['node']
            self.sensitivity[sensor_id] = {}
            for pipe_id, pipe in self.pipes.items():
                dist_to_pipe = self._distance_to_pipe(sensor_node, pipe)
                self.sensitivity[sensor_id][pipe_id] = np.exp(-dist_to_pipe / DECAY_SCALE)
    
    def _distance_to_pipe(self, node_id: str, pipe: Dict) -> float:
        try:
            d1 = nx.shortest_path_length(self.G, node_id, pipe['from'], weight='length')
            d2 = nx.shortest_path_length(self.G, node_id, pipe['to'], weight='length')
            return min(d1, d2)
        except:
            return 1000
    
    def simulate_pressures(self, leak_pipe: str = None, leak_rate: float = 0, 
                          noise_std: float = 0.02) -> Dict[str, float]:
        pressures = {}
        for sensor_id, sensor in self.sensors.items():
            base_pressure = 50 + np.random.normal(0, noise_std * 20)
            if leak_pipe and leak_rate > 0:
                sensitivity = self.sensitivity[sensor_id].get(leak_pipe, 0)
                # Amplify the leak signal so it's detectable above sensor noise.
                # leak_rate=0.15, sensitivity~0.9 → pressure_drop ~ 13.5m (clearly
                # above the ~0.4m noise floor).
                pressure_drop = leak_rate * 100 * sensitivity
                pressure_drop += np.random.normal(0, noise_std * 5)
                base_pressure -= max(0, pressure_drop)
            base_pressure += np.random.normal(0, noise_std * 10)
            pressures[sensor_id] = max(0, base_pressure)
        return pressures

# ============================================================================
# BAYESIAN INFERENCE ENGINE
# ============================================================================

class BayesianInferenceEngine:
    def __init__(self, network: WaterNetwork, detection_threshold: float = 0.7,
                 convergence_threshold: float = 0.05, lookback_window: int = 10):
        self.network = network
        self.detection_threshold = detection_threshold
        self.convergence_threshold = convergence_threshold
        self.lookback_window = lookback_window
        self.prior = self._initialize_prior()
        self.posterior = self.prior.copy()
        self.history = []
        self.convergence_history = []
        self.baseline_estimates = {}
        self.adaptive_updates = 0
        
    def _initialize_prior(self) -> Dict[str, float]:
        n_pipes = len(self.network.pipes)
        return {pipe_id: 1.0 / n_pipes for pipe_id in self.network.pipes}
    
    def _likelihood(self, pipe_id: str, pressures: Dict[str, float], 
                   baseline_pressures: Dict[str, float]) -> float:
        """Log-likelihood of leak in a pipe given pressure observations.
        
        Physics: a leak at `pipe_id` causes a pressure DROP at nearby sensors
        proportional to sensitivity. The observed drop = baseline - pressure.
        If the candidate pipe IS the leak, its predicted drop (sensitivity * leak_rate)
        should match the observed drop. Otherwise (no leak in this pipe), the
        predicted drop is ~0 and the residual = observed_drop should be small
        (which it is, during baseline).
        
        We compute log-likelihood as a Gaussian on the RESIDUAL between
        observed drop and predicted drop. Pipes whose predicted drop matches
        the observed drop get high likelihood; others get penalized.
        """
        log_likelihood = 0
        # Estimate the leak magnitude from the MAXIMUM observed drop. The sensor
        # closest to the leak sees the full leak magnitude (sensitivity ~1.0 there),
        # so max(observed_drops) is the best point estimate of the leak size.
        # Using median underestimates the magnitude badly when only 1-2 sensors
        # are close to the leak, which causes the wrong pipe to win.
        observed_drops = []
        for sensor_id, pressure in pressures.items():
            observed_drops.append(max(0, baseline_pressures.get(sensor_id, 50) - pressure))
        leak_magnitude_hat = max(observed_drops) if observed_drops else 0
        
        for sensor_id, pressure in pressures.items():
            sensitivity = self.network.sensitivity[sensor_id].get(pipe_id, 0)
            baseline = baseline_pressures.get(sensor_id, 50)
            observed_drop = baseline - pressure  # positive = pressure dropped
            # Predicted drop = how much THIS pipe would cause at THIS sensor.
            # Sensitivity is in [0,1], so predicted_drop is in the same units as
            # observed_drop when leak_magnitude_hat is the leak size in metres.
            predicted_drop = sensitivity * leak_magnitude_hat
            residual = observed_drop - predicted_drop
            sigma = 1.5 + (1 - sensitivity) * 2  # higher uncertainty for low-sensitivity sensors
            log_likelihood += -0.5 * (residual / sigma) ** 2
        return log_likelihood
    
    def _adaptive_baseline(self, pressures: Dict[str, float]) -> Dict[str, float]:
        baseline = {}
        for sensor_id, pressure in pressures.items():
            if sensor_id not in self.baseline_estimates:
                self.baseline_estimates[sensor_id] = []
            self.baseline_estimates[sensor_id].append(pressure)
            if len(self.baseline_estimates[sensor_id]) > 50:
                self.baseline_estimates[sensor_id].pop(0)
            if len(self.baseline_estimates[sensor_id]) >= 10:
                values = np.array(self.baseline_estimates[sensor_id][-10:])
                mean_val = np.mean(values)
                std_val = np.std(values)
                filtered = values[np.abs(values - mean_val) < 2 * std_val]
                if len(filtered) > 0:
                    baseline[sensor_id] = np.mean(filtered)
                else:
                    baseline[sensor_id] = mean_val
            else:
                baseline[sensor_id] = pressure
        return baseline
    
    def _check_convergence(self) -> bool:
        if len(self.history) < self.lookback_window:
            return False
        # history is a list of dicts {pipe_id: posterior}; convert to 2D array
        pipe_ids = list(self.network.pipes.keys())
        recent = np.array([
            [p.get(pid, 0) for pid in pipe_ids]
            for p in self.history[-self.lookback_window:]
        ])
        if len(recent) > 1:
            max_change = np.max(np.abs(np.diff(recent, axis=0)), axis=0)
            max_relative_change = np.max(max_change / (recent[-1] + 1e-10))
            return max_relative_change < self.convergence_threshold
        return False
    
    def _early_warning(self) -> bool:
        if len(self.history) < 3:
            return False
        recent_posterior = self.history[-3:]
        max_recent = [max(p.values()) for p in recent_posterior]
        increasing = all(max_recent[i] <= max_recent[i+1] for i in range(len(max_recent)-1))
        if increasing and len(self.history) > 5:
            values = np.array([max(p.values()) for p in self.history[-5:]])
            if len(values) >= 3:
                x = np.arange(len(values))
                coeffs = np.polyfit(x, values, 2)
                if coeffs[0] > 0:
                    return True
        return False
    
    def update(self, pressures: Dict[str, float], leak_pipe: str = None) -> Dict[str, float]:
        baseline = self._adaptive_baseline(pressures)
        self.adaptive_updates += 1
        
        # Compute log-likelihoods for each pipe
        log_likelihoods = {}
        for pipe_id in self.network.pipes:
            log_likelihoods[pipe_id] = self._likelihood(pipe_id, pressures, baseline)
        
        # Sequential Bayesian update using log-sum-exp for numerical stability.
        # posterior(x) ∝ prior(x) · L(O|x)  →  log_posterior = log_prior + log_L
        # Then normalize via subtracting max before exp to prevent underflow.
        log_posteriors = {}
        PRIOR_FLOOR = 1e-12
        for pipe_id in self.posterior:
            log_prior = np.log(max(self.posterior[pipe_id], PRIOR_FLOOR))
            log_posteriors[pipe_id] = log_prior + log_likelihoods[pipe_id]
        
        # Find max log-posterior for log-sum-exp stabilization
        max_log = max(log_posteriors.values())
        
        # Convert back to linear space and normalize
        exp_vals = {pid: np.exp(lp - max_log) for pid, lp in log_posteriors.items()}
        total = sum(exp_vals.values())
        if total > 0:
            self.posterior = {k: v / total for k, v in exp_vals.items()}
        
        self.history.append(self.posterior.copy())
        self.convergence_history.append(self._check_convergence())
        return self.posterior

# ============================================================================
# ADVANCED ITERATION ENGINE
# ============================================================================

class AdvancedIterationEngine:
    def __init__(self, nodes: Dict, pipes: Dict, sensors: Dict,
                 detection_threshold: float = 0.7,
                 convergence_threshold: float = 0.05,
                 lookback_window: int = 10,
                 num_workers: int = None):
        self.nodes = nodes
        self.pipes = pipes
        self.sensors = sensors
        self.detection_threshold = detection_threshold
        self.convergence_threshold = convergence_threshold
        self.lookback_window = lookback_window
        self.num_workers = num_workers or max(1, cpu_count() - 1)
        self.results: List[IterationResult] = []
        self.stats: Optional[BatchStatistics] = None
        self.roc_data = None
        
    def _run_single_iteration(self, args: Tuple) -> IterationResult:
        iteration_id, leak_pipe, leak_rate, baseline_cycles, detection_cycles, seed = args
        np.random.seed(seed)
        network = WaterNetwork(self.nodes, self.pipes, self.sensors)
        engine = BayesianInferenceEngine(
            network, 
            detection_threshold=self.detection_threshold,
            convergence_threshold=self.convergence_threshold,
            lookback_window=self.lookback_window
        )
        leak_event = LeakEvent(
            pipe_id=leak_pipe,
            rate=leak_rate,
            start_cycle=baseline_cycles
        )
        posterior_trajectory = []
        convergence_trajectory = []
        false_positives = 0
        detected = False
        detection_time = None
        convergence_time = None
        early_warning_triggered = False
        early_warning_time = None
        max_posterior = 0
        
        for cycle in range(baseline_cycles + detection_cycles):
            is_leak = cycle >= baseline_cycles and leak_rate > 0
            if is_leak:
                pressures = network.simulate_pressures(
                    leak_pipe=leak_pipe, leak_rate=leak_rate, noise_std=0.02
                )
            else:
                pressures = network.simulate_pressures(noise_std=0.02)
            posterior = engine.update(pressures, leak_pipe if is_leak else None)
            leak_posterior = posterior.get(leak_pipe, 0)
            posterior_trajectory.append(leak_posterior)
            convergence_trajectory.append(engine._check_convergence())
            if not is_leak and leak_posterior > self.detection_threshold * 0.8:
                false_positives += 1
            if is_leak and not detected:
                if leak_posterior > self.detection_threshold:
                    detected = True
                    detection_time = cycle - baseline_cycles
                    leak_event.detected_cycle = detection_time
                    leak_event.max_posterior = leak_posterior
                    if engine._check_convergence():
                        convergence_time = cycle - baseline_cycles
                        leak_event.convergence_cycle = convergence_time
            if is_leak and not early_warning_triggered:
                if engine._early_warning():
                    early_warning_triggered = True
                    early_warning_time = cycle - baseline_cycles
            max_posterior = max(max_posterior, leak_posterior)
        
        if not detected:
            leak_event.max_posterior = max_posterior
        leak_event.false_positives = false_positives
        leak_event.detection_confidence = max_posterior
        leak_event.early_warning_cycles = early_warning_time or 0
        
        return IterationResult(
            iteration_id=iteration_id,
            leak_event=leak_event,
            posterior_trajectory=posterior_trajectory,
            convergence_trajectory=convergence_trajectory,
            threshold_exceeded=detected,
            detection_time=detection_time,
            convergence_time=convergence_time,
            false_positive_count=false_positives,
            max_posterior=max_posterior,
            early_warning_triggered=early_warning_triggered,
            early_warning_time=early_warning_time,
            adaptive_baseline_updates=engine.adaptive_updates
        )
    
    def run_batch(self, num_iterations: int = 20, leak_pipe: str = "PIP3",
                  leak_rate: float = 0.15, baseline_cycles: int = 20,
                  detection_cycles: int = 50, parallel: bool = True,
                  leak_fraction: float = 0.6) -> List[IterationResult]:
        """Run multiple iterations with parallel processing.
        
        leak_fraction controls what proportion of iterations contain a real
        leak. The remainder are leak-free controls — this gives ROC analysis
        both classes (leak + no-leak) so AUC is well-defined.
        """
        n_leak = int(num_iterations * leak_fraction)
        logger.info(f"Running {num_iterations} iterations ({n_leak} leak, {num_iterations - n_leak} control) with {self.num_workers} workers")
        args_list = []
        base_seed = int(hashlib.md5(f"{leak_pipe}{leak_rate}{datetime.now().timestamp()}".encode()).hexdigest()[:8], 16)
        
        # Round-robin leak assignment for class balance
        leak_set = set()
        if n_leak > 0:
            step = max(1, num_iterations // n_leak)
            for i in range(0, num_iterations, step):
                if len(leak_set) < n_leak:
                    leak_set.add(i)
        while len(leak_set) < n_leak:
            for i in range(num_iterations):
                if i not in leak_set:
                    leak_set.add(i)
                    break
                if len(leak_set) >= n_leak:
                    break
        
        for i in range(num_iterations):
            seed = base_seed + i * 12345
            iter_leak_rate = leak_rate if i in leak_set else 0.0
            args_list.append((i, leak_pipe, iter_leak_rate, baseline_cycles, detection_cycles, seed))
        
        self.results = []
        if parallel and self.num_workers > 1:
            try:
                with ProcessPoolExecutor(max_workers=self.num_workers) as executor:
                    future_to_idx = {executor.submit(self._run_single_iteration, args): args[0] 
                                   for args in args_list}
                    with tqdm(total=num_iterations, desc="Running iterations") as pbar:
                        for future in as_completed(future_to_idx):
                            try:
                                result = future.result()
                                self.results.append(result)
                            except Exception as e:
                                logger.error(f"Error in iteration: {e}")
                            pbar.update(1)
            except Exception as e:
                logger.warning(f"Parallel execution failed ({e}), falling back to sequential")
                for args in tqdm(args_list, desc="Running iterations (sequential)"):
                    result = self._run_single_iteration(args)
                    self.results.append(result)
        else:
            for args in tqdm(args_list, desc="Running iterations"):
                result = self._run_single_iteration(args)
                self.results.append(result)
        
        self.results.sort(key=lambda x: x.iteration_id)
        self._compute_statistics()
        return self.results
    
    def _compute_statistics(self):
        if not self.results:
            return
        detected = [r for r in self.results if r.threshold_exceeded]
        detection_times = [r.detection_time for r in detected if r.detection_time is not None]
        converged = [r for r in detected if r.convergence_time is not None]
        convergence_times = [r.convergence_time for r in converged if r.convergence_time is not None]
        false_positives = [r.false_positive_count for r in self.results]
        max_posterior = [r.max_posterior for r in self.results]
        early_warnings = [r for r in self.results if r.early_warning_triggered]
        
        n_bootstrap = 1000
        bootstrap_means = []
        if detection_times:
            for _ in range(n_bootstrap):
                sample = np.random.choice(detection_times, size=len(detection_times), replace=True)
                bootstrap_means.append(np.mean(sample))
            ci_lower = np.percentile(bootstrap_means, 2.5)
            ci_upper = np.percentile(bootstrap_means, 97.5)
        else:
            ci_lower = ci_upper = 0
        
        self._compute_roc_analysis()
        
        # Detection rate = detected leaks / total leak iterations (not / all iterations,
        # which would be misleading when control iterations are included).
        leak_iterations = [r for r in self.results if r.leak_event.rate > 0]
        control_iterations = [r for r in self.results if r.leak_event.rate == 0]
        detected_leaks = [r for r in leak_iterations if r.threshold_exceeded]
        false_alarms = [r for r in control_iterations if r.threshold_exceeded]
        detection_rate = len(detected_leaks) / len(leak_iterations) if leak_iterations else 0
        control_false_alarm_rate = len(false_alarms) / len(control_iterations) if control_iterations else 0
        convergence_rate = len(converged) / len(detected) if detected else 0
        false_positive_rate = np.mean(false_positives) / 50 if false_positives else 0
        
        reliability_score = (
            detection_rate * 0.4 +
            convergence_rate * 0.3 +
            (1 - min(false_positive_rate, 1)) * 0.3
        )
        
        self.stats = BatchStatistics(
            num_iterations=len(self.results),
            detection_rate=detection_rate,
            detection_times_mean=np.mean(detection_times) if detection_times else 0,
            detection_times_std=np.std(detection_times) if detection_times else 0,
            detection_times_median=np.median(detection_times) if detection_times else 0,
            detection_times_ci_lower=ci_lower,
            detection_times_ci_upper=ci_upper,
            convergence_rate=convergence_rate,
            convergence_times_mean=np.mean(convergence_times) if convergence_times else 0,
            false_positive_rate=false_positive_rate,
            false_positive_mean=np.mean(false_positives) if false_positives else 0,
            max_posterior_mean=np.mean(max_posterior) if max_posterior else 0,
            max_posterior_std=np.std(max_posterior) if max_posterior else 0,
            early_warning_rate=len(early_warnings) / len(self.results) if self.results else 0,
            mean_early_warning_cycles=np.mean([r.early_warning_time for r in early_warnings if r.early_warning_time]) if early_warnings else 0,
            reliability_score=reliability_score,
            adaptive_baseline_updates_mean=np.mean([r.adaptive_baseline_updates for r in self.results]),
            roc_auc=self.roc_data['auc'] if self.roc_data else 0,
            precision_at_threshold=self.roc_data['precision_at_threshold'] if self.roc_data else 0,
            recall_at_threshold=self.roc_data['recall_at_threshold'] if self.roc_data else 0,
            f1_score=self.roc_data['f1_score'] if self.roc_data else 0,
            optimal_threshold=self.roc_data['optimal_threshold'] if self.roc_data else self.detection_threshold
        )
    
    def _compute_roc_analysis(self):
        if not self.results:
            return
        labels = []
        scores = []
        for r in self.results:
            # Ground-truth label: was a leak actually injected? (leak_rate > 0)
            # This is the TRUE label for ROC — independent of whether the
            # system detected it. Using threshold_exceeded here would make
            # ROC meaningless (labels == predictions).
            labels.append(1 if r.leak_event.rate > 0 else 0)
            scores.append(r.max_posterior)
        labels = np.array(labels)
        scores = np.array(scores)
        
        # Guard against single-class data
        if len(np.unique(labels)) < 2:
            self.roc_data = {
                'fpr': [0, 1], 'tpr': [0, 1], 'thresholds': [0.5],
                'auc': 0.5, 'optimal_threshold': 0.5,
                'precision_at_threshold': 0, 'recall_at_threshold': 0, 'f1_score': 0,
                'precision': [1, 1], 'recall': [0, 1]
            }
            return
        
        fpr, tpr, thresholds = roc_curve(labels, scores)
        roc_auc = auc(fpr, tpr)
        j_scores = tpr - fpr
        optimal_idx = np.argmax(j_scores)
        optimal_threshold = thresholds[optimal_idx] if optimal_idx < len(thresholds) else 0.5
        precision, recall, _ = precision_recall_curve(labels, scores)
        idx = np.argmin(np.abs(thresholds - self.detection_threshold))
        if idx < len(thresholds):
            precision_at = precision[idx] if idx < len(precision) else 0
            recall_at = recall[idx] if idx < len(recall) else 0
            f1 = 2 * precision_at * recall_at / (precision_at + recall_at + 1e-10)
        else:
            precision_at = recall_at = f1 = 0
        
        self.roc_data = {
            'fpr': fpr.tolist(), 'tpr': tpr.tolist(), 'thresholds': thresholds.tolist(),
            'auc': float(roc_auc), 'optimal_threshold': float(optimal_threshold),
            'precision_at_threshold': float(precision_at), 'recall_at_threshold': float(recall_at),
            'f1_score': float(f1),
            'precision': precision.tolist() if len(precision) > 0 else [],
            'recall': recall.tolist() if len(recall) > 0 else []
        }

# ============================================================================
# VISUALIZATION
# ============================================================================

class AdvancedVisualizer:
    @staticmethod
    def create_dashboard(results: List[IterationResult], stats: BatchStatistics,
                        roc_data: dict, output_dir: Path) -> str:
        detection_times = [r.detection_time for r in results if r.detection_time is not None]
        posterior_values = [r.max_posterior for r in results]
        false_positives = [r.false_positive_count for r in results]
        early_warning_times = [r.early_warning_time for r in results if r.early_warning_triggered]
        convergence_times = [r.convergence_time for r in results if r.convergence_time is not None]
        
        fig = make_subplots(
            rows=3, cols=3,
            subplot_titles=(
                "Detection Time Distribution", "Max Posterior Distribution",
                "False Positives Distribution", "Convergence Distribution",
                "Early Warning Performance", "Posterior Trajectories (First 10)",
                "ROC Curve", "Precision-Recall Curve", "Detection Reliability"
            ),
            specs=[
                [{"type": "histogram"}, {"type": "histogram"}, {"type": "histogram"}],
                [{"type": "histogram"}, {"type": "scatter"}, {"type": "scatter"}],
                [{"type": "scatter"}, {"type": "scatter"}, {"type": "indicator"}]
            ]
        )
        
        if detection_times:
            fig.add_trace(go.Histogram(x=detection_times, nbinsx=20, name="Detection Times",
                marker_color="#00d4ff",
                hovertemplate="Time: %{x}<br>Count: %{y}<extra></extra>"), row=1, col=1)
            mean_time = np.mean(detection_times)
            fig.add_vline(x=mean_time, line_dash="dash", line_color="#00ff88",
                         annotation_text=f"Mean: {mean_time:.1f}",
                         annotation_position="top", row=1, col=1)
        
        fig.add_trace(go.Histogram(x=posterior_values, nbinsx=20, name="Max Posterior",
            marker_color="#00ff88",
            hovertemplate="Posterior: %{x}<br>Count: %{y}<extra></extra>"), row=1, col=2)
        
        fig.add_trace(go.Histogram(x=false_positives, nbinsx=15, name="False Positives",
            marker_color="#ffb800",
            hovertemplate="False Positives: %{x}<br>Count: %{y}<extra></extra>"), row=1, col=3)
        
        if convergence_times:
            fig.add_trace(go.Histogram(x=convergence_times, nbinsx=15, name="Convergence Times",
                marker_color="#9b59b6",
                hovertemplate="Time: %{x}<br>Count: %{y}<extra></extra>"), row=2, col=1)
        
        if early_warning_times:
            fig.add_trace(go.Scatter(x=list(range(len(early_warning_times))), y=early_warning_times,
                mode='markers+lines', name="Early Warning Times",
                marker_color="#00d4ff",
                hovertemplate="Iteration: %{x}<br>Early Warning: %{y} cycles<extra></extra>"), row=2, col=2)
        
        for i, result in enumerate(results[:10]):
            fig.add_trace(go.Scatter(x=list(range(len(result.posterior_trajectory))),
                y=result.posterior_trajectory, mode='lines', name=f"Iter {result.iteration_id}",
                line=dict(width=1),
                hovertemplate="Cycle: %{x}<br>Posterior: %{y:.3f}<extra></extra>"), row=2, col=3)
        
        if roc_data:
            fig.add_trace(go.Scatter(x=roc_data['fpr'], y=roc_data['tpr'],
                mode='lines+markers', name=f"ROC (AUC={roc_data['auc']:.3f})",
                line=dict(color='#00ff88', width=2),
                marker=dict(size=6, color='#00ff88')), row=3, col=1)
            fig.add_trace(go.Scatter(x=[0, 1], y=[0, 1], mode='lines', name='Random',
                line=dict(color='rgba(120,120,120,0.4)', dash='dash')), row=3, col=1)
            fig.update_xaxes(title_text="False Positive Rate", row=3, col=1)
            fig.update_yaxes(title_text="True Positive Rate", row=3, col=1)
            
            fig.add_trace(go.Scatter(x=roc_data['recall'], y=roc_data['precision'],
                mode='lines+markers', name="Precision-Recall",
                line=dict(color='#00d4ff', width=2),
                marker=dict(size=6, color='#00d4ff')), row=3, col=2)
            fig.update_xaxes(title_text="Recall", row=3, col=2)
            fig.update_yaxes(title_text="Precision", row=3, col=2)
        
        fig.add_trace(go.Indicator(
            mode="gauge+number+delta", value=stats.reliability_score * 100,
            title={"text": "Reliability Score %"}, delta={"reference": 70},
            gauge={
                "axis": {"range": [0, 100]},
                "bar": {"color": "#00d4ff"},
                "steps": [
                    {"range": [0, 40], "color": "rgba(255,77,77,0.2)"},
                    {"range": [40, 70], "color": "rgba(255,184,0,0.2)"},
                    {"range": [70, 100], "color": "rgba(0,255,136,0.2)"}
                ],
                "threshold": {"line": {"color": "#00ff88", "width": 4}, "thickness": 0.75, "value": 70}
            }
        ), row=3, col=3)
        
        fig.update_layout(
            height=1400, width=1500, showlegend=True,
            title_text=f"Bayesian Leak Detection Dashboard — {len(results)} Iterations",
            title_font_size=20, template="plotly_dark",
            paper_bgcolor='#060a10', plot_bgcolor='#0a1016',
            font=dict(color='#cbd5d9')
        )
        
        html_path = output_dir / "leak_detection_dashboard.html"
        fig.write_html(str(html_path))
        return str(html_path)
    
    @staticmethod
    def create_static_figures(results: List[IterationResult], stats: BatchStatistics,
                             roc_data: dict, output_dir: Path):
        plt.style.use('dark_background')
        fig = plt.figure(figsize=(22, 14))
        gs = GridSpec(3, 3, figure=fig, hspace=0.4, wspace=0.35)
        
        ax1 = fig.add_subplot(gs[0, 0])
        detection_times = [r.detection_time for r in results if r.detection_time is not None]
        if detection_times:
            ax1.hist(detection_times, bins=20, alpha=0.7, color='#00d4ff', edgecolor='black')
            ax1.axvline(np.mean(detection_times), color='#00ff88', linestyle='--', 
                       label=f'Mean: {np.mean(detection_times):.1f}')
            ax1.set_xlabel('Cycles to Detection', color='#cbd5d9')
            ax1.set_ylabel('Frequency', color='#cbd5d9')
            ax1.set_title('Detection Time Distribution', color='#00d4ff')
            ax1.legend()
            ax1.tick_params(colors='#cbd5d9')
        
        ax2 = fig.add_subplot(gs[0, 1])
        posterior_values = [r.max_posterior for r in results]
        ax2.hist(posterior_values, bins=20, alpha=0.7, color='#00ff88', edgecolor='black')
        ax2.axvline(np.mean(posterior_values), color='#ffb800', linestyle='--',
                   label=f'Mean: {np.mean(posterior_values):.3f}')
        ax2.set_xlabel('Max Posterior', color='#cbd5d9')
        ax2.set_ylabel('Frequency', color='#cbd5d9')
        ax2.set_title('Maximum Posterior Distribution', color='#00d4ff')
        ax2.legend()
        ax2.tick_params(colors='#cbd5d9')
        
        ax3 = fig.add_subplot(gs[0, 2])
        false_positives = [r.false_positive_count for r in results]
        ax3.hist(false_positives, bins=15, alpha=0.7, color='#ffb800', edgecolor='black')
        ax3.set_xlabel('False Positives', color='#cbd5d9')
        ax3.set_ylabel('Frequency', color='#cbd5d9')
        ax3.set_title('False Positive Distribution', color='#00d4ff')
        ax3.tick_params(colors='#cbd5d9')
        
        ax4 = fig.add_subplot(gs[1, 0])
        convergence_times = [r.convergence_time for r in results if r.convergence_time is not None]
        if convergence_times:
            ax4.hist(convergence_times, bins=15, alpha=0.7, color='#9b59b6', edgecolor='black')
            ax4.set_xlabel('Cycles to Convergence', color='#cbd5d9')
            ax4.set_ylabel('Frequency', color='#cbd5d9')
            ax4.set_title('Convergence Time Distribution', color='#00d4ff')
            ax4.tick_params(colors='#cbd5d9')
        
        ax5 = fig.add_subplot(gs[1, 1])
        early_warnings = [r for r in results if r.early_warning_triggered]
        if early_warnings:
            early_times = [r.early_warning_time for r in early_warnings]
            ax5.scatter(range(len(early_times)), early_times, alpha=0.7, color='#00d4ff', s=80)
            ax5.set_xlabel('Iteration', color='#cbd5d9')
            ax5.set_ylabel('Early Warning Time (cycles)', color='#cbd5d9')
            ax5.set_title(f'Early Warning ({len(early_times)}/{len(results)})', color='#00d4ff')
            ax5.tick_params(colors='#cbd5d9')
        
        ax6 = fig.add_subplot(gs[1, 2])
        trajectories = np.array([r.posterior_trajectory for r in results[:20]])
        if len(trajectories) > 0:
            im = ax6.imshow(trajectories, aspect='auto', cmap='viridis', interpolation='bilinear')
            ax6.set_xlabel('Cycle', color='#cbd5d9')
            ax6.set_ylabel('Iteration', color='#cbd5d9')
            ax6.set_title('Posterior Trajectories Heatmap', color='#00d4ff')
            ax6.tick_params(colors='#cbd5d9')
            plt.colorbar(im, ax=ax6)
        
        ax7 = fig.add_subplot(gs[2, 0])
        if roc_data:
            ax7.plot(roc_data['fpr'], roc_data['tpr'], color='#00ff88', linewidth=2,
                    label=f'ROC (AUC={roc_data["auc"]:.3f})')
            ax7.plot([0, 1], [0, 1], color='gray', linestyle='--', alpha=0.5)
            ax7.set_xlabel('False Positive Rate', color='#cbd5d9')
            ax7.set_ylabel('True Positive Rate', color='#cbd5d9')
            ax7.set_title('ROC Curve', color='#00d4ff')
            ax7.legend()
            ax7.tick_params(colors='#cbd5d9')
        
        ax8 = fig.add_subplot(gs[2, 1])
        if roc_data and roc_data['precision']:
            ax8.plot(roc_data['recall'], roc_data['precision'], color='#00d4ff', linewidth=2)
            ax8.set_xlabel('Recall', color='#cbd5d9')
            ax8.set_ylabel('Precision', color='#cbd5d9')
            ax8.set_title('Precision-Recall Curve', color='#00d4ff')
            ax8.tick_params(colors='#cbd5d9')
        
        ax9 = fig.add_subplot(gs[2, 2])
        ax9.axis('off')
        metrics_text = f"""
        ════════════════════════════════════════════════
                   PERFORMANCE METRICS
        ════════════════════════════════════════════════
        Detection Rate:              {stats.detection_rate:.1%}
        Detection Time:              {stats.detection_times_mean:.1f} ± {stats.detection_times_std:.1f}
        95% CI:                      [{stats.detection_times_ci_lower:.1f}, {stats.detection_times_ci_upper:.1f}]
        Convergence Rate:            {stats.convergence_rate:.1%}
        False Positive Rate:         {stats.false_positive_rate:.1%}
        Early Warning Rate:          {stats.early_warning_rate:.1%}
        Mean Early Warning:          {stats.mean_early_warning_cycles:.1f} cycles
        ROC AUC:                     {stats.roc_auc:.3f}
        F1 Score:                    {stats.f1_score:.3f}
        Optimal Threshold:           {stats.optimal_threshold:.3f}
        Reliability Score:           {stats.reliability_score:.1%}
        Baseline Updates:            {stats.adaptive_baseline_updates_mean:.1f}/run
        ════════════════════════════════════════════════
        """
        ax9.text(0.05, 0.5, metrics_text, transform=ax9.transAxes, fontsize=10,
                verticalalignment='center', fontfamily='monospace', color='#00ff88')
        
        plt.savefig(output_dir / 'static_analysis.png', dpi=150, bbox_inches='tight',
                   facecolor='#060a10')
        plt.close()

# ============================================================================
# EXPORT AND COMPILATION
# ============================================================================

class ResultCompiler:
    @staticmethod
    def export_all(results: List[IterationResult], stats: BatchStatistics,
                  engine: AdvancedIterationEngine, output_dir: Path) -> Dict[str, str]:
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        exported_files = {}
        
        json_data = {
            'timestamp': datetime.now().isoformat(),
            'configuration': {
                'detection_threshold': engine.detection_threshold,
                'convergence_threshold': engine.convergence_threshold,
                'lookback_window': engine.lookback_window,
                'num_iterations': len(results),
                'num_workers': engine.num_workers
            },
            'aggregate_statistics': asdict(stats) if stats else {},
            'roc_data': engine.roc_data,
            'iteration_results': []
        }
        
        for r in results:
            json_data['iteration_results'].append({
                'iteration_id': r.iteration_id,
                'threshold_exceeded': r.threshold_exceeded,
                'detection_time': r.detection_time,
                'convergence_time': r.convergence_time,
                'false_positive_count': r.false_positive_count,
                'max_posterior': r.max_posterior,
                'early_warning_triggered': r.early_warning_triggered,
                'early_warning_time': r.early_warning_time,
                'adaptive_baseline_updates': r.adaptive_baseline_updates,
                'leak_event': {
                    'pipe_id': r.leak_event.pipe_id,
                    'rate': r.leak_event.rate,
                    'detected_cycle': r.leak_event.detected_cycle,
                    'max_posterior': r.leak_event.max_posterior,
                    'convergence_cycle': r.leak_event.convergence_cycle,
                    'false_positives': r.leak_event.false_positives,
                    'early_warning_cycles': r.leak_event.early_warning_cycles
                },
                'posterior_trajectory_summary': {
                    'mean': float(np.mean(r.posterior_trajectory)),
                    'std': float(np.std(r.posterior_trajectory)),
                    'max': float(np.max(r.posterior_trajectory)),
                    'min': float(np.min(r.posterior_trajectory)),
                    'length': len(r.posterior_trajectory)
                }
            })
        
        json_path = output_dir / 'complete_results.json'
        with open(json_path, 'w') as f:
            json.dump(json_data, f, indent=2, default=str)
        exported_files['json'] = str(json_path)
        
        df_data = []
        for r in results:
            df_data.append({
                'iteration': r.iteration_id, 'detected': r.threshold_exceeded,
                'detection_time': r.detection_time or -1,
                'convergence_time': r.convergence_time or -1,
                'false_positives': r.false_positive_count,
                'max_posterior': r.max_posterior,
                'early_warning': r.early_warning_triggered,
                'early_warning_time': r.early_warning_time or -1,
                'baseline_updates': r.adaptive_baseline_updates,
                'leak_rate': r.leak_event.rate
            })
        df = pd.DataFrame(df_data)
        csv_path = output_dir / 'iteration_data.csv'
        df.to_csv(csv_path, index=False)
        exported_files['csv'] = str(csv_path)
        
        trajectory_data = []
        for r in results:
            traj = r.posterior_trajectory
            if len(traj) > 200:
                step = max(1, len(traj) // 200)
                traj = traj[::step]
            trajectory_data.append({'iteration': r.iteration_id, 'trajectory': traj})
        traj_path = output_dir / 'trajectories.pkl'
        with open(traj_path, 'wb') as f:
            pickle.dump(trajectory_data, f)
        exported_files['trajectories'] = str(traj_path)
        
        visualizer = AdvancedVisualizer()
        dashboard_path = visualizer.create_dashboard(results, stats, engine.roc_data, output_dir)
        exported_files['dashboard'] = dashboard_path
        
        visualizer.create_static_figures(results, stats, engine.roc_data, output_dir)
        exported_files['static_figures'] = str(output_dir / 'static_analysis.png')
        
        report = f"""
        ════════════════════════════════════════════════════════════════════════════
        BAYESIAN LEAK DETECTION — COMPLETE ANALYSIS REPORT
        ════════════════════════════════════════════════════════════════════════════
        
        Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        Iterations: {len(results)}
        Workers: {engine.num_workers}
        Threshold: {engine.detection_threshold}
        
        ─── PERFORMANCE SUMMARY ───────────────────────────────────────────────────
        
        Detection Rate:              {stats.detection_rate:.1%} ({sum(1 for r in results if r.threshold_exceeded)}/{len(results)})
        Detection Time (mean ± std): {stats.detection_times_mean:.1f} ± {stats.detection_times_std:.1f} cycles
        95% CI:                      [{stats.detection_times_ci_lower:.1f}, {stats.detection_times_ci_upper:.1f}]
        Convergence Rate:            {stats.convergence_rate:.1%}
        False Positive Rate:         {stats.false_positive_rate:.1%}
        Early Warning Rate:          {stats.early_warning_rate:.1%}
        Mean Early Warning Time:     {stats.mean_early_warning_cycles:.1f} cycles early
        Reliability Score:           {stats.reliability_score:.1%}
        
        ─── STATISTICAL ANALYSIS ──────────────────────────────────────────────────
        
        ROC AUC:                     {stats.roc_auc:.3f}
        F1 Score:                    {stats.f1_score:.3f}
        Optimal Threshold:           {stats.optimal_threshold:.3f}
        Precision at Threshold:      {stats.precision_at_threshold:.3f}
        Recall at Threshold:         {stats.recall_at_threshold:.3f}
        
        ─── ADAPTIVE FEATURES ─────────────────────────────────────────────────────
        
        Baseline Updates per Run:    {stats.adaptive_baseline_updates_mean:.1f}
        Early Warning Capability:    {'✓ ENABLED' if stats.early_warning_rate > 0.5 else '✗ WEAK'}
        Convergence Detection:       {'✓ ENABLED' if stats.convergence_rate > 0.5 else '✗ WEAK'}
        
        ─── OUTPUT FILES ──────────────────────────────────────────────────────────
        
        JSON:                        {exported_files['json']}
        CSV:                         {exported_files['csv']}
        Dashboard:                   {exported_files['dashboard']}
        Static Figures:              {exported_files['static_figures']}
        Trajectories:                {exported_files['trajectories']}
        
        ─── RECOMMENDATIONS ────────────────────────────────────────────────────────
        """
        
        if stats.detection_rate < 0.7:
            report += "  • Increase detection window or lower threshold\n"
        if stats.false_positive_rate > 0.15:
            report += "  • Increase threshold or improve baseline estimation\n"
        if stats.convergence_rate < 0.5:
            report += "  • Increase convergence threshold or lookback window\n"
        if stats.roc_auc < 0.8:
            report += "  • Consider additional sensors or improved sensitivity model\n"
        if stats.early_warning_rate > 0.8:
            report += "  • Early warning system performing well — ready for deployment\n"
        elif stats.early_warning_rate > 0.5:
            report += "  • Early warning shows promise — consider parameter tuning\n"
        else:
            report += "  • Early warning needs improvement — try reducing threshold\n"
        
        report += "\n" + "═" * 79 + "\n"
        
        report_path = output_dir / 'analysis_report.txt'
        with open(report_path, 'w') as f:
            f.write(report)
        exported_files['report'] = str(report_path)
        
        logger.info(f"Exported all files to {output_dir}")
        return exported_files

# ============================================================================
# SAMPLE NETWORK
# ============================================================================

def create_sample_network():
    nodes = {
        'N1': {'elevation': 10, 'demand': 10}, 'N2': {'elevation': 12, 'demand': 8},
        'N3': {'elevation': 8, 'demand': 12}, 'N4': {'elevation': 15, 'demand': 5},
        'N5': {'elevation': 11, 'demand': 7}, 'N6': {'elevation': 9, 'demand': 9},
        'N7': {'elevation': 13, 'demand': 6}, 'N8': {'elevation': 10, 'demand': 4},
        'N9': {'elevation': 14, 'demand': 3},
    }
    pipes = {
        'PIP1': {'from': 'N1', 'to': 'N2', 'length': 100, 'diameter': 0.3, 'roughness': 0.01},
        'PIP2': {'from': 'N2', 'to': 'N3', 'length': 80, 'diameter': 0.25, 'roughness': 0.015},
        'PIP3': {'from': 'N3', 'to': 'N4', 'length': 120, 'diameter': 0.2, 'roughness': 0.02},
        'PIP4': {'from': 'N4', 'to': 'N5', 'length': 90, 'diameter': 0.3, 'roughness': 0.01},
        'PIP5': {'from': 'N5', 'to': 'N6', 'length': 70, 'diameter': 0.25, 'roughness': 0.015},
        'PIP6': {'from': 'N6', 'to': 'N7', 'length': 110, 'diameter': 0.2, 'roughness': 0.02},
        'PIP7': {'from': 'N7', 'to': 'N8', 'length': 95, 'diameter': 0.3, 'roughness': 0.01},
        'PIP8': {'from': 'N8', 'to': 'N9', 'length': 85, 'diameter': 0.25, 'roughness': 0.015},
        'PIP9': {'from': 'N1', 'to': 'N3', 'length': 130, 'diameter': 0.2, 'roughness': 0.02},
        'PIP10': {'from': 'N2', 'to': 'N5', 'length': 100, 'diameter': 0.3, 'roughness': 0.01},
    }
    sensors = {
        'S1': {'node': 'N1', 'type': 'pressure'}, 'S2': {'node': 'N3', 'type': 'pressure'},
        'S3': {'node': 'N5', 'type': 'pressure'}, 'S4': {'node': 'N7', 'type': 'pressure'},
        'S5': {'node': 'N9', 'type': 'pressure'},
    }
    return nodes, pipes, sensors

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("\n" + "=" * 79)
    print("ADVANCED BAYESIAN LEAK DETECTION SYSTEM")
    print("=" * 79 + "\n")
    
    output_dir = Path("/home/z/my-project/simulation-output")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("Creating sample network...")
    nodes, pipes, sensors = create_sample_network()
    print(f"  - {len(nodes)} nodes")
    print(f"  - {len(pipes)} pipes")
    print(f"  - {len(sensors)} sensors")
    
    print("\nInitializing advanced engine...")
    engine = AdvancedIterationEngine(
        nodes=nodes, pipes=pipes, sensors=sensors,
        detection_threshold=0.5,    # lowered from 0.7 — with 10 pipes, 0.5 = strong confidence
        convergence_threshold=0.05,
        lookback_window=10, num_workers=4
    )
    print(f"  - Detection threshold: {engine.detection_threshold}")
    print(f"  - Convergence threshold: {engine.convergence_threshold}")
    print(f"  - Workers: {engine.num_workers}")
    
    print("\nRunning iterations (parallel)...")
    results = engine.run_batch(
        num_iterations=20, leak_pipe="PIP3", leak_rate=0.12,  # weaker leak → non-trivial detection times
        baseline_cycles=20, detection_cycles=50, parallel=True,
        leak_fraction=0.6  # 12 leak + 8 control iterations for ROC analysis
    )
    
    print(f"\nCompleted {len(results)} iterations")
    leak_iters = [r for r in results if r.leak_event.rate > 0]
    control_iters = [r for r in results if r.leak_event.rate == 0]
    detected_leaks = [r for r in leak_iters if r.threshold_exceeded]
    false_alarms = [r for r in control_iters if r.threshold_exceeded]
    print(f"Leak iterations: {len(leak_iters)} | Control iterations: {len(control_iters)}")
    print(f"Leak detection rate: {len(detected_leaks)}/{len(leak_iters)} ({len(detected_leaks)/len(leak_iters):.1%})" if leak_iters else "No leak iterations")
    print(f"Control false-alarm rate: {len(false_alarms)}/{len(control_iters)} ({len(false_alarms)/len(control_iters):.1%})" if control_iters else "No control iterations")
    
    if engine.stats:
        print(f"\nPerformance Metrics:")
        print(f"  - Detection time: {engine.stats.detection_times_mean:.1f} ± {engine.stats.detection_times_std:.1f} cycles")
        print(f"  - 95% CI: [{engine.stats.detection_times_ci_lower:.1f}, {engine.stats.detection_times_ci_upper:.1f}]")
        print(f"  - False positive rate: {engine.stats.false_positive_rate:.1%}")
        print(f"  - Early warning rate: {engine.stats.early_warning_rate:.1%}")
        print(f"  - ROC AUC: {engine.stats.roc_auc:.3f}")
        print(f"  - F1 Score: {engine.stats.f1_score:.3f}")
        print(f"  - Reliability: {engine.stats.reliability_score:.1%}")
    
    print("\nExporting results...")
    compiler = ResultCompiler()
    exported = compiler.export_all(
        results=results, stats=engine.stats, engine=engine, output_dir=output_dir
    )
    
    print("\nExported files:")
    for key, path in exported.items():
        print(f"  - {key}: {path}")
    
    print(f"\n{'=' * 79}")
    print("✓ ANALYSIS COMPLETE")
    print(f"✓ Open the dashboard: {exported.get('dashboard', 'Not generated')}")
    print(f"✓ Check the report: {exported.get('report', 'Not generated')}")
    print("=" * 79 + "\n")
    
    return engine, results, exported

if __name__ == "__main__":
    engine, results, exported = main()
