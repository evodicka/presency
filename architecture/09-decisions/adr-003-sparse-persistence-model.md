# ADR-003: Sparse Persistence Model

**Status:** Accepted
**Date:** 2026-04-10

## Context

Every working day in a month needs an effective status. The simplest approach would be to store every day explicitly (dense model). An alternative is to treat `home-office` as the implicit default and store only days that deviate from it (sparse model).

## Decision

Use a **sparse persistence model**: only days with status `on-site` or `absent` are stored in the JSON file. Days with no entry are treated as `home-office` by the application at read time. When a day is reverted to `home-office`, its key is removed from the data object before saving.

## Consequences

**Positive:**
- The JSON file remains small regardless of how many months the user has navigated; months with all default (home-office) statuses produce no entries.
- New months automatically default to all home-office without any initialisation step.
- Simplifies the first-launch scenario: the absence of a file is equivalent to an empty object.
- Aligns with the most common use pattern: most days are home-office; on-site days are the exception.

**Negative:**
- Application code must be aware of the implicit default and treat a missing key as `home-office`. This is a simple but non-obvious invariant that must be consistently applied.
- Migrating to a different default status in the future would require a data migration.

This decision was explicitly specified in REQ-007 and is not open for reconsideration.
