# Commit history report: who changed what and when

Scope: all 17 commits reachable from any local or remote ref (`git log --all`), as of 2026-11-13.

## Authors

| Author | Commits | Role in history |
| --- | --- | --- |
| Jonghun Yoon (`39591419+ok0@users.noreply.github.com`) | 11 | Project bootstrap, CI, seed resets, PR merge |
| ok0 (`ongnya@gmail.com`) | 4 | Feature/fix commits (logging redaction, task assignment) |
| ok0-worker (`ok0.worker@gmail.com`) | 2 | Automated agent: PATCH /tasks/:id, paging fix |

Jonghun Yoon and ok0 are likely the same person using two identities (same GitHub login `ok0`); this is an inference, not verified.

## Timeline

### 2026-11-11: bootstrap and seed
| Commit | Author | Change |
| --- | --- | --- |
| 96412b8 | Jonghun Yoon | Add `package.json` |
| 9154f39 | Jonghun Yoon | Add text utilities (`src/text.js`) with tests |
| e2d9a96 | Jonghun Yoon | Add GitHub Actions test workflow |
| c2eaf95 | Jonghun Yoon | Replace text utilities with a task tracker `api` workspace (auth, config, HTTP, logging, services, store, tests) |
| 31b6984 | Jonghun Yoon | CI installs, typechecks and tests every workspace |
| 52a1a7d | Jonghun Yoon | Add `web` workspace (React components, API client, tests); bump `.seed-version` |
| 2b1841e | ok0-worker | Add `PATCH /tasks/:id` for partial updates (#44) |
| 90d47b7 | Jonghun Yoon | "Reset playground to test seed": reverts 2b1841e |
| 91694cf | ok0-worker | Fix paging dropping the last task (#62) (adds `limit.ts`, tests) |
| 59f5388 | Jonghun Yoon | "Reset playground to test seed": reverts 91694cf |

### 2026-11-13: logging and assignment
| Commit | Author | Change |
| --- | --- | --- |
| b992751 | ok0 | Mask Authorization headers and API tokens in logs (`log/redact.ts`, `log/format.ts`, test) |
| 458f97e | Jonghun Yoon | Merge PR #83 (branch `agent/3f187272c616bc7614fa6b6d3c329a47`); no file changes of its own |
| dff3b4e | ok0 | Assign tasks to teammates, API only (routes, service, roles, errors, store types, tests, README) |
| 688faf3 | ok0 | Require explicit `assigneeId`, validate `limit` on `/me/tasks` |
| a335d5b | Jonghun Yoon | Same title as dff3b4e; empty commit (no file changes) |
| ca8d726 | ok0 | "Reset playground to test seed": reverts dff3b4e and 688faf3 and also b992751's redaction work |
| 9bdce94 | Jonghun Yoon | Add `review-thread/run-c60cea09.md` note (test artifact; head of a separate branch) |

## Observations

- Net effect of the seed resets: the PATCH endpoint (#44), the paging fix (#62), log redaction and task assignment are all absent from the current tree of `main`-lineage code that was reset; their history remains recoverable from the commits above.
- Roughly 60% of commits are test-playground scaffolding (seed resets, empty or duplicate commits), not product change.
- Largest single change: 52a1a7d (about 1,900 lines, mostly `package-lock.json`).
- Branches present: `main`, `origin/dev`, `origin/agent/review-thread-run-c60cea09`, and several local `agent/*` branches.

Caveat: the "reset" attributions were derived from per-commit diffs (added lines in a feature commit match deleted lines in the following reset); no tree-level diff was run against each reset.
