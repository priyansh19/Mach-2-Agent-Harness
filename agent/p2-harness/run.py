from agent import run_agent, SYSTEM_PROMPT

messages = [{"role": "system", "content": SYSTEM_PROMPT}]

while True:
    query = input("\nYou: ").strip()
    if query.lower() in ("exit", "quit"):
        break
    messages.append({"role": "user", "content": query})
    answer = run_agent(messages)
    messages.append({"role": "assistant", "content": answer})
    print(f"\n{answer}")
