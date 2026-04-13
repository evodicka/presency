# Architecture Documentation — Office Presence Tracker

> **Status: Draft** — This architecture is based on requirements and has not yet been implemented.

The Office Presence Tracker is a self-contained Electron desktop application that lets a single user plan their monthly office presence. Users click on calendar day cells to set a planned status (home-office, on-site, absent), and the application continuously calculates whether the 40% on-site presence goal is met. All data is stored locally as a JSON file; no network connectivity or external server is required.

## Sections

1. [Introduction & Goals](01-introduction-goals.md)
2. [Constraints](02-constraints.md)
3. [Context & Scope](03-context-scope.md)
4. [Solution Strategy](04-solution-strategy.md)
5. [Building Block View](05-building-block-view.md)
6. [Runtime View](06-runtime-view.md)
7. [Deployment View](07-deployment-view.md)
8. [Crosscutting Concepts](08-crosscutting-concepts.md)
9. [Architectural Decisions](09-decisions/README.md)
10. [Quality Requirements](10-quality-requirements.md)
11. [Risks & Technical Debt](11-risks-technical-debt.md)
12. [Glossary](12-glossary.md)
