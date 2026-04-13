# ADR-007: Inline Computus Algorithm for Easter Computation

**Status:** Proposed
**Date:** 2026-04-10

## Context

Five of the thirteen Bavarian public holidays are moveable feasts derived from Easter Sunday (Good Friday, Easter Monday, Ascension Day, Whit Monday, Corpus Christi). Easter Sunday's date must be computed algorithmically. Options:

1. **External library** (e.g., `date-holidays`, `holiday-de`) — provides a full dataset of German/Bavarian holidays; removes the need to implement the algorithm.
2. **Inline Computus algorithm** — implement the well-known Anonymous Gregorian algorithm (also called the Meeus/Jones/Butcher algorithm) directly in `HolidayService`. Fewer than 20 lines of arithmetic.

## Decision

Implement the **Computus algorithm inline** in `HolidayService`. No external holiday library is added as a dependency.

## Consequences

**Positive:**
- No additional npm dependency for a well-understood, stable algorithm.
- Reduces supply-chain risk; the holiday list is explicit and auditable in the source.
- The algorithm is correct for all years in the Gregorian calendar (post-1582) and requires no updates.
- The exact set of Bavarian holidays is fixed in the requirements (REQ-006 AC4); a library would provide far more than needed.

**Negative:**
- The algorithm must be correctly implemented and tested; a bug would affect all moveable-feast calculations across all years.
- If holiday rules ever change (very rare for Bavarian public holidays), the code must be updated manually rather than by upgrading a library.

The algorithm is short, deterministic, and thoroughly documented in literature. The correctness risk is low and mitigated by unit tests against known Easter dates.
