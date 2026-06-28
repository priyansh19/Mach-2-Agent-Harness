TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "finish",
            "description": "Call this when you have a final answer for the user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "answer": {"type": "string", "description": "Your final answer"}
                },
                "required": ["answer"]
            }
        }
    }
]
