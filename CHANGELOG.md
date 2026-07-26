# typed-regex-groups

## 0.1.2

### Patch Changes

- beb7c46: Reject a flags string carrying both `u` and `v`. The two select different
  character-class grammars, so the `RegExp` constructor throws on them, and
  `typedRegex` now reports it at compile time along with the other flag errors
  instead of accepting a call that always throws.

## 0.1.1

### Patch Changes

- 6c17a50: Fix a typo in the package description and add npm keywords so the package is
  discoverable by search.

## 0.1.0

### Minor Changes

- Add `typedRegex`, `TypedRegExp`, `TypedMatch`, and `Groups`: named capture groups
  typed from the pattern literal, including optionality from quantifiers, enclosing
  groups, alternation, and negative lookarounds.
