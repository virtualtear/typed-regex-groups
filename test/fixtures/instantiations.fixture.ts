// The fixed workload the instantiation ceiling is measured against. Nothing imports
// this file: its only job is to give the parser a stable amount of work to do, so the
// ceiling tracks the cost of the type-level parser rather than the size of the test
// suite. Add a case here only to represent a pattern shape real callers write.

import type { Groups } from '../../src/parse/groups.js';

export type Date = Groups<'(?<year>\\d{4})-(?<month>\\d{2})(?<day>-\\d{2})?'>;

export type Semver =
  Groups<'^(?<major>0|[1-9]\\d*)\\.(?<minor>0|[1-9]\\d*)\\.(?<patch>0|[1-9]\\d*)(?:-(?<prerelease>[0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?(?:\\+(?<buildmetadata>[0-9a-zA-Z-]+(?:\\.[0-9a-zA-Z-]+)*))?$'>;

export type Package = Groups<'^(?<scope>@[a-z0-9-]+/)?(?<name>[a-z0-9-_.]+)(@(?<version>.+))?$'>;

export type Duration = Groups<'^(?<value>\\d+(?:\\.\\d+)?)(?<unit>ms|s|m|h|d)$'>;

export type LogLine =
  Groups<'^\\[(?<ts>[^\\]]+)\\]\\s+(?<level>DEBUG|INFO|WARN|ERROR)\\s+(?<msg>.*)$'>;

export type ClassHeavy = Groups<'[[a-z]--[aeiou]]+(?<consonants>[^\\d\\s]{2,8})', 'v'>;

export type Alternation = Groups<'(?<get>GET)|(?<post>POST)|(?<put>PUT)|(?<delete>DELETE)'>;

export type Nested = Groups<'(?:(?<outer>a(?:(?<inner>b)|c)?)|(?<other>d))+'>;
