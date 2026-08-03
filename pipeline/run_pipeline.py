#!/usr/bin/env python3
"""
run_pipeline.py — Execution Engine (HBK MK-II Hydro-Gateway)

Pure execution. No report generation.
Outputs: results.json, metrics.json, system_info.json, ledger.json, provenance.json

Config values are loaded from config.yaml WITH their provenance status intact.
Nothing here silently upgrades an "unverified_placeholder" value — provenance
travels with every number all the way into the ledger and, downstream, into
the submission report's status column.

Usage:
    export ROCM_HOME=/opt/rocm
    python run_pipeline.py --mode full
    python run_pipeline.py --mode test --epochs 1 --samples 100
"""

import os
import sys
import json
import time
import hashlib
import argparse
import datetime
import platform
from pathlib import Path
from typing import Dict, Any, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torch.optim import Adam

try:
    import yaml
except ImportError:
    print("❌ pyyaml is required: pip install pyyaml", file=sys.stderr)
    sys.exit(1)

try:
    import git
    HAS_GITPYTHON = True
except ImportError:
    HAS_GITPYTHON = False

try:
    import genesis as gs
    HAS_GENESIS = True
except ImportError:
    HAS_GENESIS = False

HAS_ROCM = torch.cuda.is_available() and hasattr(torch.version, "hip") and torch.version.hip is not None


# ============================================================
# 1. CONFIG LOADING — provenance-preserving, fails loudly
# ============================================================

def load_config(path: str = "config.yaml") -> Dict[str, Any]:
    """
    Loads config.yaml. Does NOT fall back to hardcoded defaults — if the
    file is missing or malformed, this fails loudly rather than silently
    substituting placeholder engineering values.
    """
    cfg_path = Path(path)
    if not cfg_path.exists():
        raise FileNotFoundError(
            f"config.yaml not found at '{path}'. Refusing to run with implicit "
            f"defaults — engineering values must come from an explicit, "
            f"reviewable config file. Copy the provided config.yaml template."
        )
    with open(cfg_path, "r") as f:
        config = yaml.safe_load(f)
    if not config:
        raise ValueError(f"config.yaml at '{path}' is empty or invalid.")
    return config


def cfg_val(node: Any, default: Any = None) -> Any:
    """Extract the numeric/string value from a provenance-tagged node,
    or return the node itself if it's a plain value."""
    if isinstance(node, dict) and "value" in node:
        return node["value"]
    return node if node is not None else default


def cfg_status(node: Any) -> str:
    """Extract provenance status. Plain (untagged) values are 'unspecified'."""
    if isinstance(node, dict) and "status" in node:
        return node["status"]
    return "unspecified"


def collect_provenance(config: Dict[str, Any]) -> Dict[str, Dict[str, str]]:
    """Walk the config and pull out every provenance-tagged field into a
    flat manifest — this is what the report generator uses to decide
    whether a value can say 'Verified'."""
    provenance = {}

    def walk(node, path):
        if isinstance(node, dict):
            if "value" in node and "status" in node:
                provenance[path] = {
                    "value": node["value"],
                    "status": node["status"],
                    "source": node.get("source", "unspecified"),
                }
            else:
                for k, v in node.items():
                    walk(v, f"{path}.{k}" if path else k)

    walk(config, "")
    return provenance


# ============================================================
# 2. ENVIRONMENT CAPTURE
# ============================================================

def get_system_info() -> Dict[str, Any]:
    info = {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "platform": {
            "system": platform.system(),
            "release": platform.release(),
            "machine": platform.machine(),
            "python_version": platform.python_version(),
        },
        "gpu": {
            "available": torch.cuda.is_available(),
            "count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
            "name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "N/A",
            "rocm_version": getattr(torch.version, "hip", "N/A"),
            "torch_version": torch.__version__,
        },
        "git": {"commit": "unknown", "branch": "unknown", "repo_root": "unknown"},
    }
    if HAS_GITPYTHON:
        try:
            repo = git.Repo(search_parent_directories=True)
            info["git"] = {
                "commit": repo.head.object.hexsha,
                "branch": repo.active_branch.name,
                "repo_root": str(repo.working_dir),
                "is_dirty": repo.is_dirty(),
            }
        except Exception:
            info["git"]["error"] = "Could not detect Git repo"
    else:
        info["git"]["error"] = "GitPython not installed"
    return info


# ============================================================
# 3. SIMULATION — real Genesis if available, else clearly-labeled synthetic
# ============================================================

class HydroGatewaySimulator:
    """
    Generates sensor-like data for anomaly-detector training.

    IMPORTANT: even the "Genesis" path here produces synthetic sensor
    signals (no physical sensors exist yet) — the distinction that matters
    is GPU-accelerated physics scene vs. pure numpy synthesis, not
    "real" vs. "fake" data. Both paths are synthetic training data.
    """

    def __init__(self, config: Dict[str, Any], use_gpu: bool = True):
        self.config = config
        self.use_gpu = use_gpu and HAS_ROCM
        self.scene = None
        self.used_genesis = False

    def build_scene(self) -> bool:
        if not HAS_GENESIS:
            return False
        try:
            gs.init(backend=gs.gpu if self.use_gpu else gs.cpu)
            self.scene = gs.Scene(
                gravity=(0.0, 0.0, -9.81),
                timestep=cfg_val(self.config["simulation"]["sim_timestep"], 0.001),
                substeps=cfg_val(self.config["simulation"]["sim_substeps"], 32),
                show_viewer=False,
            )
            geo = self.config["kcl"]["geometry"]
            self.scene.add_entity(name="skid_base", file="meshes/skid_base.obj",
                                   pos=(0, 0, 0), mass=220.0, material="Steel")
            self.scene.build()
            self.used_genesis = True
            return True
        except Exception as e:
            print(f"⚠️ Genesis build failed, falling back to synthetic-only: {e}")
            return False

    def generate_sensor_data(self) -> Dict[str, np.ndarray]:
        cfg = self.config
        n = int(cfg_val(cfg["simulation"]["num_samples"], 10000))
        press_node = cfg["kcl"]["pressure_system"]
        base_pressure = float(cfg_val(press_node["design_pressure_bar"]))
        mop = float(cfg_val(press_node["mop_bar"]))
        temp_min = float(cfg_val(press_node["temp_min_c"]))
        temp_max = float(cfg_val(press_node["temp_max_c"]))

        n_normal = int(n * 0.8)
        n_anomalous = n - n_normal

        pressure_normal = np.clip(
            np.random.normal(loc=base_pressure, scale=0.5, size=n_normal),
            base_pressure - 2, base_pressure + 2,
        )
        spike_type = np.random.choice([0, 1], size=n_anomalous, p=[0.6, 0.4])
        pressure_high = np.clip(
            np.random.normal(loc=mop * 0.85, scale=1.5, size=n_anomalous),
            mop * 0.7, mop * 0.95,
        )
        pressure_low = np.clip(
            np.random.normal(loc=base_pressure * 0.3, scale=0.5, size=n_anomalous),
            0.1, base_pressure * 0.5,
        )
        pressure_anomalous = np.where(spike_type == 0, pressure_high, pressure_low)

        pressure = np.concatenate([pressure_normal, pressure_anomalous])
        labels = np.concatenate([np.zeros(n_normal, dtype=np.float32),
                                  np.ones(n_anomalous, dtype=np.float32)])
        idx = np.random.permutation(n)
        pressure, labels = pressure[idx], labels[idx]

        acoustic_features = np.zeros((n, 128), dtype=np.float32)
        t = np.linspace(0, 0.1, 128)
        for i in range(n):
            if labels[i] == 0:
                signal = 0.5 * np.sin(2 * np.pi * 60 * t) + 0.1 * np.random.randn(128)
            else:
                burst = np.exp(-((t - 0.05) ** 2) / 0.0005)
                signal = burst * (0.8 * np.sin(2 * np.pi * 200 * t)
                                   + 0.4 * np.sin(2 * np.pi * 400 * t)) + 0.1 * np.random.randn(128)
            acoustic_features[i] = signal / (np.max(np.abs(signal)) + 1e-6)

        temp = np.clip(np.random.normal(loc=25.0 + 5.0 * labels, scale=2.0, size=n),
                        temp_min, temp_max)
        flow = np.clip(np.random.normal(loc=100.0 - 30.0 * labels, scale=10.0, size=n),
                        10.0, 150.0)

        features = np.zeros((n, 6), dtype=np.float32)
        features[:, 0] = pressure
        features[:, 1] = temp
        features[:, 2] = flow
        features[:, 3] = np.mean(acoustic_features, axis=1)
        features[:, 4] = np.std(acoustic_features, axis=1)
        features[:, 5] = np.max(np.abs(acoustic_features), axis=1)

        return {"features": features, "labels": labels, "pressure": pressure,
                "temperature": temp, "flow": flow}

    def run(self) -> Dict[str, np.ndarray]:
        start = time.time()
        self.build_scene()
        data = self.generate_sensor_data()
        data["_meta"] = {
            "used_genesis_physics": self.used_genesis,
            "data_kind": "synthetic",
            "elapsed_s": time.time() - start,
        }
        print(f"✅ Simulation complete in {data['_meta']['elapsed_s']:.2f}s "
              f"(genesis={self.used_genesis}, samples={len(data['features'])})")
        return data


# ============================================================
# 4. DATASET / MODEL
# ============================================================

class AnomalyDataset(Dataset):
    def __init__(self, features: np.ndarray, labels: np.ndarray):
        self.features = torch.tensor(features, dtype=torch.float32)
        self.labels = torch.tensor(labels, dtype=torch.float32)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]


class BetaBinomialAnomalyDetector(nn.Module):
    def __init__(self, input_dim: int = 6, hidden_dim: int = 128):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(hidden_dim, hidden_dim // 2), nn.ReLU(), nn.Dropout(0.1),
            nn.Linear(hidden_dim // 2, 2), nn.Softplus(),
        )

    def forward(self, x):
        ab = self.net(x)
        return ab[:, 0:1] + 1.0, ab[:, 1:2] + 1.0  # alpha, beta


# ============================================================
# 5. TRAINER — real training loop, not mocked
# ============================================================

class Trainer:
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.device = torch.device("cuda" if HAS_ROCM else "cpu")
        print(f"🔧 Training on: {self.device}")

    def train(self, data: Dict[str, np.ndarray]) -> Dict[str, Any]:
        sim_cfg = self.config["simulation"]
        epochs = int(cfg_val(sim_cfg["epochs"], 50))
        batch_size = int(cfg_val(sim_cfg["batch_size"], 256))
        lr = float(cfg_val(sim_cfg["learning_rate"], 1e-3))
        hidden_dim = int(cfg_val(sim_cfg["hidden_dim"], 128))

        features, labels = data["features"], data["labels"]
        dataset = AnomalyDataset(features, labels)
        n = len(dataset)
        n_train = int(n * 0.8)
        indices = np.random.permutation(n)
        train_ds = torch.utils.data.Subset(dataset, indices[:n_train])
        val_ds = torch.utils.data.Subset(dataset, indices[n_train:])

        train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True)
        val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False)

        model = BetaBinomialAnomalyDetector(input_dim=features.shape[1],
                                             hidden_dim=hidden_dim).to(self.device)
        criterion = nn.BCEWithLogitsLoss()
        optimizer = Adam(model.parameters(), lr=lr)

        history = {"train_loss": [], "val_loss": [], "val_acc": []}
        best_val_loss = float("inf")
        start = time.time()

        for epoch in range(epochs):
            model.train()
            train_loss = 0.0
            for bx, by in train_loader:
                bx, by = bx.to(self.device), by.to(self.device)
                optimizer.zero_grad()
                alpha, beta = model(bx)
                p = alpha / (alpha + beta)
                loss = criterion(p.squeeze(), by)
                uncertainty = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1))
                loss = loss + 0.01 * uncertainty.mean()
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                train_loss += loss.item()
            train_loss /= max(len(train_loader), 1)

            model.eval()
            val_loss, val_acc = 0.0, 0.0
            with torch.no_grad():
                for bx, by in val_loader:
                    bx, by = bx.to(self.device), by.to(self.device)
                    alpha, beta = model(bx)
                    p = alpha / (alpha + beta)
                    val_loss += criterion(p.squeeze(), by).item()
                    pred = (p.squeeze() > 0.5).float()
                    val_acc += (pred == by).float().mean().item()
            val_loss /= max(len(val_loader), 1)
            val_acc /= max(len(val_loader), 1)

            history["train_loss"].append(train_loss)
            history["val_loss"].append(val_loss)
            history["val_acc"].append(val_acc)

            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save(model.state_dict(),
                           Path(self.config["output"]["output_dir"]) / self.config["output"]["model_file"])

            if (epoch + 1) % 10 == 0 or epoch == epochs - 1:
                print(f"  Epoch {epoch+1}/{epochs}: train={train_loss:.4f} "
                      f"val={val_loss:.4f} acc={val_acc:.4f}")

        total_time = time.time() - start
        print(f"✅ Training complete in {total_time:.2f}s "
              f"(best_val_loss={best_val_loss:.4f}, final_acc={history['val_acc'][-1]:.4f})")

        return {
            "epochs": epochs,
            "history": history,
            "train_time_s": total_time,
            "best_val_loss": best_val_loss,
            "final_val_acc": history["val_acc"][-1],
        }


# ============================================================
# 6. BENCHMARK — real CPU vs GPU timing, not mocked
# ============================================================

class Benchmark:
    def __init__(self, config: Dict[str, Any]):
        self.config = config

    def _run_timed(self, data: Dict[str, np.ndarray], device: str) -> float:
        features, labels = data["features"], data["labels"]
        n = min(1000, len(features))
        dataset = AnomalyDataset(features[:n], labels[:n])
        loader = DataLoader(dataset, batch_size=128, shuffle=True)
        model = BetaBinomialAnomalyDetector(input_dim=features.shape[1], hidden_dim=64)
        if device == "gpu" and HAS_ROCM:
            model = model.cuda()
        optimizer = Adam(model.parameters(), lr=1e-3)
        criterion = nn.BCEWithLogitsLoss()

        start = time.time()
        for _ in range(20):
            for bx, by in loader:
                if device == "gpu" and HAS_ROCM:
                    bx, by = bx.cuda(), by.cuda()
                optimizer.zero_grad()
                alpha, beta = model(bx)
                p = alpha / (alpha + beta)
                loss = criterion(p.squeeze(), by)
                loss.backward()
                optimizer.step()
        return time.time() - start

    def run_benchmark(self, data: Dict[str, np.ndarray]) -> Dict[str, Any]:
        print("\n📊 BENCHMARK: CPU vs. ROCm GPU")
        cpu_time = self._run_timed(data, "cpu")
        result = {"cpu_time_s": cpu_time}
        if HAS_ROCM:
            gpu_time = self._run_timed(data, "gpu")
            result["gpu_time_s"] = gpu_time
            result["speedup_factor"] = round(cpu_time / gpu_time, 3) if gpu_time > 0 else None
        else:
            result["gpu_time_s"] = None
            result["speedup_factor"] = None
            print("⚠️ ROCm not available — GPU benchmark skipped")
        print(f"📈 Speedup: {result.get('speedup_factor', 'N/A')}x")
        return result


# ============================================================
# 7. SHA-256 LEDGER
# ============================================================

class SHA256Ledger:
    def __init__(self):
        self.entries = []

    def add_entry(self, name: str, data: Any, provenance_status: str = "n/a"):
        timestamp = datetime.datetime.utcnow().isoformat()
        data_str = json.dumps(data, sort_keys=True, default=str)
        data_hash = hashlib.sha256(data_str.encode()).hexdigest()
        prev_hash = self.entries[-1]["chain_hash"] if self.entries else "0" * 64
        chain_hash = hashlib.sha256((prev_hash + data_hash).encode()).hexdigest()
        entry = {
            "index": len(self.entries), "timestamp": timestamp, "name": name,
            "data_hash": data_hash, "prev_hash": prev_hash, "chain_hash": chain_hash,
            "provenance_status": provenance_status,  # does NOT imply data correctness —
            # only that the chain is internally consistent. See note in verify().
        }
        self.entries.append(entry)
        return entry

    def verify(self) -> bool:
        """Verifies hash-chain integrity only. This proves the ledger has not
        been tampered with after the fact — it does NOT prove the underlying
        engineering values are correct or signed off. Check provenance.json
        for that."""
        for i in range(1, len(self.entries)):
            expected = hashlib.sha256(
                (self.entries[i - 1]["chain_hash"] + self.entries[i]["data_hash"]).encode()
            ).hexdigest()
            if self.entries[i]["chain_hash"] != expected:
                return False
        return True

    def save(self, filepath: Path):
        with open(filepath, "w") as f:
            json.dump(self.entries, f, indent=2)


# ============================================================
# 8. MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="HBK MK-II Execution Engine")
    parser.add_argument("--mode", choices=["full", "test"], default="full")
    parser.add_argument("--config", type=str, default="config.yaml")
    parser.add_argument("--epochs", type=int, default=None)
    parser.add_argument("--samples", type=int, default=None)
    parser.add_argument("--no-gpu", action="store_true")
    args = parser.parse_args()

    global HAS_ROCM
    if args.no_gpu:
        HAS_ROCM = False

    config = load_config(args.config)
    provenance = collect_provenance(config)

    unverified = [k for k, v in provenance.items() if v["status"] == "unverified_placeholder"]
    if unverified:
        print("⚠️  UNVERIFIED ENGINEERING VALUES IN USE (synthetic-data/demo only):")
        for k in unverified:
            print(f"    - {k} = {provenance[k]['value']}  ({provenance[k]['source']})")
        print("    These will be labeled UNVERIFIED in the submission report, not 'Verified'.\n")

    if args.mode == "test":
        config["simulation"]["epochs"] = min(cfg_val(config["simulation"]["epochs"], 50), 5)
        config["simulation"]["num_samples"] = min(cfg_val(config["simulation"]["num_samples"], 10000), 500)
        print("🧪 TEST MODE: reduced parameters")
    if args.epochs:
        config["simulation"]["epochs"] = args.epochs
    if args.samples:
        config["simulation"]["num_samples"] = args.samples

    output_dir = Path(config["output"]["output_dir"])
    output_dir.mkdir(parents=True, exist_ok=True)

    sys_info = get_system_info()
    ledger = SHA256Ledger()
    ledger.add_entry("config", config, provenance_status="mixed_see_provenance_json")
    ledger.add_entry("system_info", sys_info)

    print("\n=== PHASE 1: Simulation ===")
    simulator = HydroGatewaySimulator(config, use_gpu=HAS_ROCM)
    data = simulator.run()
    ledger.add_entry("simulation_meta", data["_meta"])

    print("\n=== PHASE 2: Training ===")
    trainer = Trainer(config)
    training_results = trainer.train(data)
    ledger.add_entry("training_results", {k: v for k, v in training_results.items() if k != "history"})

    print("\n=== PHASE 3: Benchmark ===")
    benchmark = Benchmark(config)
    benchmark_results = benchmark.run_benchmark(data)
    ledger.add_entry("benchmark_results", benchmark_results)

    is_valid = ledger.verify()
    ledger.add_entry("verification", {"chain_valid": is_valid})
    ledger.save(output_dir / "ledger.json")

    results = {
        "simulation_meta": data["_meta"],
        "training": training_results,
        "benchmark": benchmark_results,
    }
    with open(output_dir / "results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    with open(output_dir / "system_info.json", "w") as f:
        json.dump(sys_info, f, indent=2)
    with open(output_dir / "provenance.json", "w") as f:
        json.dump(provenance, f, indent=2, default=str)

    metrics = {
        "accuracy": training_results["final_val_acc"],
        "speedup": benchmark_results.get("speedup_factor"),
        "samples": len(data["features"]),
        "ledger_chain_valid": is_valid,
        "used_genesis_physics": data["_meta"]["used_genesis_physics"],
    }
    with open(output_dir / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\n✅ Pipeline complete. Artifacts in {output_dir}/")
    print(f"   Ledger chain valid: {is_valid} (proves chain integrity, NOT engineering correctness)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
