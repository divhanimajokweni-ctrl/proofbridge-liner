# apps/api/server.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List
import os
import json

app = FastAPI(title="ProofBridge Liner API")

@app.get("/")
async def root():
    return {"status": "online", "service": "ProofBridge API"}

@app.post("/metrics/canary/success")
async def canary_success():
    # Metric: zk_canary_success_total
    return {"status": "ok"}

@app.post("/metrics/canary/failure")
async def canary_failure():
    # Metric: zk_canary_failure_total
    return {"status": "ok"}
