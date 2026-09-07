---
name: deep-research
description: Conducts multi-phase recursive technical and architectural research on app concepts and saves a comprehensive report.
---

# Deep Research Protocol

When the user runs `/deep-research <topic>`:

1. **Deconstruct & Plan**:
   - Break the topic into 4 distinct research tracks:
     1. Architecture & Core Tech Stack (modern 2025/2026 battle-tested choices)
     2. Open-source references & competitor reverse-engineering
     3. Data schemas, state management, & edge cases (offline sync, scale, rate limits)
     4. Potential landmines, breaking changes, & security vulnerabilities.

2. **Iterative Web Search & Verification**:
   - Search the web for each track using live grounding.
   - For any referenced library or pattern, search GitHub and official documentation to verify it is actively maintained and not deprecated.

3. **Deliverable**:
   - Create a new file: `docs/research/<topic-slug>.md`
   - Structure the output:
     - Executive Architecture Summary
     - Recommended Stack & Library Matrix (with pros/cons)
     - Concrete Data Flow / Schema Snippets
     - Implementation Phasing (Wave 1: MVP, Wave 2: Scale)
     - Unresolved Risks & Mitigations