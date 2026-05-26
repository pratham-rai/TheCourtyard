# Search routes in server.js
import re

with open(r"C:\Users\raipr\.gemini\antigravity\scratch\the-courtyard\backend\server.js", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("--- EXPOSED ENDPOINTS ---")
for i, line in enumerate(lines):
    if "app." in line or "router." in line or "const " in line and "require(" in line:
        if any(keyword in line for keyword in ["get(", "post(", "put(", "delete(", "use(", "Router("]):
            print(f"Line {i+1}: {line.strip()}")
