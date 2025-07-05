# ⚠️ AI Debug & Interaction Guidelines (BoBIconic)

## User Expectations (MANDATORY)

- **Autonomous Debug**: The AI must chain actions (diagnosis, correction, test, relaunch) without ever asking for manual intervention from the user, as long as the application does not work according to the specs.
- **Continuous Loop**: The AI must stay in "Generating" mode (active loop) until the problem is fully resolved, never yielding or waiting for user validation.
- **Local Logs**: All logs (info, debug, error) must be generated and accessible locally (in `logs/app.log`), so the AI can diagnose and fix without human interaction.
- **Zero Manual Interaction**: The user must never have to copy/paste logs, click buttons, or provide debug info. The AI must do everything itself.
- **Transparency**: The AI must detail every action, command, code change, and result in the execution thread.
- **Cursor Prompt**: The prompt must remind the AI of these rules and force it to stay in a loop until success, never asking the user for help.

## Ideal Cursor Workflow
1. The user launches a command or reports a bug.
2. The AI automatically chains:
   - Diagnosis (analyze logs/app.log, code, errors)
   - Correction (code/scripts/config changes)
   - Relaunch (build, servers, tests)
   - Verification (logs, UI, app state)
   - Loop until success
3. The user never intervenes, except to restart the AI if it stops.

---

**MANDATORY for any future AI on this project.**

# AI Guidelines - Logging

- Tous les logs (backend, frontend, navigateur) doivent être centralisés automatiquement dans `logs/app.log` et `logs/console.log` via le proxy et la capture CDP.
- Le script `start-all.ps1` doit garantir la capture automatique des logs navigateur sans intervention manuelle.
- Aucun `console.log` direct ne doit subsister dans le code applicatif, tout doit passer par `LoggerService` ou être capturé par CDP.
- Les logs doivent inclure le niveau, la catégorie, le message, le contexte, et être horodatés.
- Les logs navigateur sont capturés via `capture-logs.js` et Opera lancé en mode remote debugging. 