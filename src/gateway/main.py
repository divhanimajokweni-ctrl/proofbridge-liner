from fastapi import FastAPI, Depends, HTTPException, Header
from typing import Annotated

app = FastAPI()

# Placeholder for authorized email - this should be loaded from secure environment variables
AUTHORIZED_EMAIL = "divhanimajokweni@example.com"

async def verify_email(x_user_email: Annotated[str | None, Header()] = None):
    if x_user_email != AUTHORIZED_EMAIL:
        raise HTTPException(status_code=403, detail="Access forbidden: unauthorized email")
    return x_user_email

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/analyze-intent", dependencies=[Depends(verify_email)])
async def analyze_intent():
    # Will integrate intent parser here
    return {"message": "Intent analysis endpoint"}

@app.post("/execute-workflow", dependencies=[Depends(verify_email)])
async def execute_workflow():
    # Will integrate prover pipeline here
    return {"message": "Workflow execution endpoint"}
