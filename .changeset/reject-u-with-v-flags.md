---
'typed-regex-groups': patch
---

Reject a flags string carrying both `u` and `v`. The two select different
character-class grammars, so the `RegExp` constructor throws on them, and
`typedRegex` now reports it at compile time along with the other flag errors
instead of accepting a call that always throws.
