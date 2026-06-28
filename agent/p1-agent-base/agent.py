import json
import requests
from pathlib import Path
from langfuse import Langfuse

OLLAMA_URL = "http://localhost:11434/api/chat"
MODEL = "ornith:9b"

SYSTEM_PROMPT = (Path(__file__).parent.parent.parent / "docs" / "ornith-system-prompt.md").read_text(encoding="utf-8")
langfuse = Langfuse(
    public_key="pk-lf-f1ff4a91-5511-46d9-b3f2-f3db49112808",
    secret_key="sk-lf-6c61058f-a568-430f-93e6-598415159fd0",
    host="http://localhost:3000"
)

def call_ollama(messages):
    res = requests.post(OLLAMA_URL, json={"model": MODEL, "messages": messages, "stream": False, "format": "json"})
    data = res.json()
    return data["message"]["content"], data.get("prompt_eval_count", 0), data.get("eval_count", 0)

def run_agent(user_input):
    trace = langfuse.trace(name="react-agent", input={"query": user_input})
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_input}
    ]

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

if __name__ == "__main__":
    result = run_agent("What is 2 + 2?")
    print(f"\n[answer] {result}")
