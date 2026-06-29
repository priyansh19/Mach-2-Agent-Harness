import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent / "agent" / "p2-harness"))
from agent import run_agent, SYSTEM_PROMPT

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid

class ChatRequest(BaseModel):
    message: str
    session_id: str = ""

app = FastAPI()
app.add_middleware(
        CORSMiddleware, 
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"]
    )

sessions =  {}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat")
def chat(req: ChatRequest):
    sid = req.session_id or str(uuid.uuid4())
    if sid not in sessions:
        sessions[sid] = [{"role": "system", "content": SYSTEM_PROMPT}]
    sessions[sid].append({"role": "user", "content": req.message})
    answer = run_agent(sessions[sid])
    sessions[sid].append({"role": "assistant", "content": answer})
    return {"answer": answer, "session_id": sid}


















