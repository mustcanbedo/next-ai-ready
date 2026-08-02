# create-next-ai-ready

## 0.1.0-alpha.12

### Patch Changes

- b972b61: Add searchable npm metadata, repository links, and a release-time metadata gate for every public package. The alpha release workflow can now explicitly promote verified user-facing packages to the `latest` dist-tag.

## 0.1.0-alpha.11

### Minor Changes

- dd4eb8d: Generate a runnable minimal Next.js App Router TypeScript project with starter
  content instead of only a package manifest. Refuse unsafe targets, path
  traversal, symbolic-link escapes, non-empty directories, and file overwrites.
