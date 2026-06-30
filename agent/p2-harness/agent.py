import json
import requests
from pathlib import Path
from langfuse import Langfuse

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "ornith:9b"

SYSTEM_PROMPT = (Path(__file__).parent.parent.parent / "docs" / "ornith-system-prompt.md").read_text(encoding="utf-8")
langfuse = Langfuse(
    public_key="pk-lf-df92732e-8905-4eea-a561-4a906b963471",
    secret_key="sk-lf-42a96bc1-2d67-4741-a7c7-598c4a2506a9",
    host="http://localhost:3000"
)

def call_ollama(messages):
    res = requests.post(OLLAMA_URL, json={"model": MODEL, "messages": messages, "stream": False, "format": "json"})
    data = res.json()
    return data["message"]["content"], data.get("prompt_eval_count", 0), data.get("eval_count", 0)

def run_agent(messages):
    trace = langfuse.trace(
        name="react-agent",
        input={"query": messages[-1]["content"]},
        tags=["harness", "ornith"],
        metadata={"model": MODEL, "phase": "p2-harness"}
    )
    
    for round_num in range(10):
        raw, input_tokens, output_tokens = call_ollama(messages)
        step = json.loads(raw)
        span = trace.span(name=f"step-{round_num + 1}", input={"thought": step.get("thought"), "action": step.get("action")}, usage={"input": input_tokens, "output": output_tokens, "total": input_tokens + output_tokens})
        print(f"\n[thought] {step['thought']}")

        if step["action"] == "finish":
            ai = step.get("action_input")
            answer = ai.get("answer") if isinstance(ai, dict) else step.get("answer", str(ai))
            span.end(output=answer)
            trace.update(output=answer)
            langfuse.flush()
            return answer

        messages.append({"role": "assistant", "content": raw})
        span.end()
    
    langfuse.flush()
    return "Agent hit max rounds without finishing."

