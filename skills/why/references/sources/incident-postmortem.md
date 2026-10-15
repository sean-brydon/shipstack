# Incident & Postmortem Context

- **Issue / ticket tracker**: look for tickets labeled `incident`, `sev-*`, `postmortem-action-item`, `reliability`
- **Real-time team chat**: search incident channels (often named like `#sev-*` or `#incident-*`) around the dates the target code was added
- **Infrastructure observability**: incident records and monitors that fired in the window before the target code was added
- **Git**: commits with messages like "fix for incident", "add defensive check", "revert" followed by "re-apply with..." are strong signals
