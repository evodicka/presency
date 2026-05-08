# ADR-009: Tag-Driven Release Versioning

**Status:** Accepted
**Date:** 2026-05-08

## Context

The application version is consumed in two places that, prior to this decision, had no enforced relationship:

1. **`package.json` `version`** — read by electron-builder to stamp the version into installer filenames (`Presency-1.0.0.dmg`) and into the macOS / Windows / Linux package metadata. Also accessible at runtime via `app.getVersion()`.
2. **GitHub Release tag** — used by `.github/workflows/release.yml` to identify which release to upload installer artifacts to.

The original release workflow triggered on the GitHub `release: created` event and read the tag from `github.event.release.tag_name`. Nothing verified that this tag matched `package.json.version`. A maintainer who created a release as `v1.2.0` while `package.json` still said `1.0.0` would silently produce installers named `Presency-1.0.0.dmg` attached to a release tagged `v1.2.0`. The drift would only be discovered by a user inspecting the downloaded file.

Because Presency has no installed analytics or auto-update channel, such drift is hard to detect after the fact. The risk grows with every additional release.

A second, related concern is the maintainer flow itself. The previous workflow required two distinct manual steps (push a tag, then create a Release in the GitHub UI), which made the silent-drift failure mode easy to trigger.

## Decision

Adopt a **tag-driven** release model with `package.json.version` as the single source of truth:

- Releases are cut by running `npm version <patch|minor|major>` locally. This atomically bumps `package.json` and `package-lock.json`, creates a Git commit, and creates an annotated tag `vX.Y.Z`.
- The maintainer pushes both with `git push --follow-tags`.
- The release workflow triggers on `push: tags: ['v*']` and runs four sequential jobs: `verify-version` → `test` → `create-release` → `build` (matrix) → `publish-release`.
- The `verify-version` job fails the entire run if `$GITHUB_REF_NAME` does not equal `v$(node -p "require('./package.json').version")`.
- The `create-release` job programmatically creates the GitHub Release as a draft via `gh release create --generate-notes --draft`, adding `--prerelease` when the tag contains a hyphen.
- The `publish-release` job flips the draft to published only after all three matrix builds have uploaded their installers.

## Rationale

| Criterion | Previous flow (`release: created`) | Tag-driven flow |
|-----------|------------------------------------|-----------------|
| Version source of truth | Ambiguous (two unsynchronised) | `package.json` only |
| Drift detection | None | `verify-version` fails fast |
| Maintainer steps per release | 2 (push tag + create Release) | 1 (`npm version` + push) |
| GitHub Release creation | Manual, in UI | Automated by workflow |
| Prerelease support | Manual checkbox in UI | Automatic from tag suffix (`-`) |
| Half-uploaded release exposure | Possible (publish on partial failure) | Prevented (publish only after all builds succeed) |

Alternatives considered:

- **Keep `release: created` trigger and add only the `verify-version` job.** Rejected: it solves drift but preserves the two-step maintainer flow and leaves Release creation as a manual UI action.
- **`release-please` (Google's PR-driven release bot).** Rejected as overkill for a single-app repository with no need for PR-driven CHANGELOG automation, conventional-commit enforcement, or multi-package coordination. Adds dependencies and a bot account for benefits we do not yet need. Reconsider if a tracked-in-repo CHANGELOG becomes a requirement.
- **`semantic-release`.** Rejected for the same reasons as `release-please`, plus tighter coupling to commit-message conventions we have not adopted.

## Consequences

Positive:

- One source of truth for the version number; drift between `package.json` and the published tag is structurally impossible.
- One-command release ritual: `npm version` + `git push --follow-tags`.
- Prereleases work without a workflow change — `npm version prerelease --preid=beta` produces a `v1.0.1-beta.0` tag that the pipeline marks as Pre-release automatically.
- A failed build leaves a draft release in place for inspection rather than a half-published one for users.

Negative / accepted trade-offs:

- Hand-editing `package.json.version` is now actively discouraged. A manual edit committed without the matching `npm version` flow would create a transient mismatched state on `main` until a tag is pushed; the next release run for a tag created from that state would fail in `verify-version`. Maintainers must use `npm version`.
- The release workflow is structurally more complex (four jobs instead of two). The `create-release` and `publish-release` jobs exist specifically to avoid the matrix race condition (`422 already_exists` if multiple runners try to create the same Release) and to defer publication until all platform builds succeed.
- The first release (`v1.0.0`) has no prior tag for `--generate-notes` to diff against, so its auto-generated notes will span repository inception. This is acceptable as a one-time cost; the maintainer can edit the generated notes before publishing if needed.
- Branch-protection on `main` would conflict with the ritual (the version-bump commit must be pushed directly). The current repository has no protection on `main`; if protection is added later, this ADR will need to be revisited or the ritual moved to a release branch with PR.
