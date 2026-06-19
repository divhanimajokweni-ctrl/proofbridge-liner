"""
@file sae_monitor.py
Sparse Autoencoder monitor for runtime safety evaluation.
Used by AlignmentCircuitBridge to detect anomalous latent features.
"""

import torch
import torch.nn as nn


class SparseAutoencoderMonitor(nn.Module):
    def __init__(self, d_hidden: int = 4096, m_expansive: int = 65536):
        super().__init__()
        self.encoder = nn.Linear(d_hidden, m_expansive, bias=True)
        self.decoder = nn.Linear(m_expansive, d_hidden, bias=True)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        encoded = torch.relu(self.encoder(x))
        decoded = self.decoder(encoded)
        return decoded

    def compute_sparse_latents(self, x: torch.Tensor) -> torch.Tensor:
        return torch.relu(self.encoder(x))

    def max_activation(self, x: torch.Tensor) -> tuple:
        latents = self.compute_sparse_latents(x)
        max_val, max_idx = torch.max(latents, dim=-1)
        return max_val.item(), int(max_idx.item())
