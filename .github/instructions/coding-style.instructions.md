---
description: Universal coding philosophy — language-agnostic principles for all code
applyTo: '**/*.dart,**/*.ts,**/*.tsx,**/*.js,**/*.jsx,**/*.astro,**/*.css,**/*.html'
---

# Coding Style — Universal Principles

These principles apply to all code in every project regardless of language or framework.

---

## 1. Never Nester

Flat code is readable code. This is the foundational structural rule.

| Depth | Status         | Meaning                                   |
| ----- | -------------- | ----------------------------------------- |
| 0–2   | **Target**     | Where most code should live               |
| 3     | **Exception**  | Acceptable for specific, justified cases  |
| 4     | **Hard limit** | Never exceed — refactor before proceeding |

### Techniques to Stay Flat

**Guard clauses / early returns:**

```dart
// ❌ Nested
Future<Result> handleRequest(Request request) async {
  if (request.isValid) {
    if (request.isAuthorized) {
      return await process(request);
    }
    return Result.unauthorized();
  }
  return Result.invalid();
}

// ✅ Guard clauses — happy path at lowest indentation
Future<Result> handleRequest(Request request) async {
  if (!request.isValid) return Result.invalid();
  if (!request.isAuthorized) return Result.unauthorized();
  return await process(request);
}
```

**Continue in loops:**

```dart
// ❌ Wrapped loop body
for (final item in items) {
  if (item.isActive) {
    if (item.isValid) {
      process(item);
    }
  }
}

// ✅ Skip early
for (final item in items) {
  if (!item.isActive || !item.isValid) continue;
  process(item);
}
```

**Extract to functions** when nesting grows:

```dart
// ❌ Deeply nested
for (final zone in zones) {
  for (final record in zone.records) {
    if (record.needsUpdate) {
      try {
        await update(record); // Level 4 — too deep
      } catch (e) {
        throw UpdateException('Failed: $e');
      }
    }
  }
}

// ✅ Extracted
for (final zone in zones) {
  await reconcileZone(zone);
}

Future<void> reconcileZone(Zone zone) async {
  for (final record in zone.records) {
    if (!record.needsUpdate) continue;
    await update(record);
  }
}
```

---

## 2. Single Responsibility

A function does one thing. If you need the word "and" to describe it, split it.

- Aim for functions under ~40 lines — a smell threshold, not a hard rule
- Name functions as verbs: `validateInput()`, `buildResponse()`, `saveConfig()`
- If a function is hard to name, it's probably doing too much

---

## 3. Fail Fast, Fail Loud

- Validate inputs at the boundary (function entry, API handler, user input)
- Return errors immediately — don't accumulate invalid state
- Never silently swallow errors unless explicitly justified with a comment
- Prefer specific error handling over bare catch-all blocks

```dart
// ❌ Silent swallow
try {
  await saveData(item);
} catch (e) {
  // do nothing
}

// ✅ Handle or re-throw with context
try {
  await saveData(item);
} on FirebaseException catch (e) {
  throw DataException('Failed to save "${item.title}": ${e.message}');
}
```

---

## 4. Naming Is Design

Good names eliminate the need for most comments.

| Element       | Convention                                  | Examples                                             |
| ------------- | ------------------------------------------- | ---------------------------------------------------- |
| Variables     | Descriptive at distance, short at proximity | `i` in a 3-line loop; `userAccount` across 20 lines  |
| Functions     | Verb phrases                                | `getRecord()`, `validateConfig()`, `buildResponse()` |
| Booleans      | Read as questions                           | `isValid`, `hasPermission`, `canRetry`               |
| Constants     | Describe meaning, not value                 | `maxRetries` not `three`                             |
| Classes/Types | Nouns or noun phrases                       | `UserRepository`, `DebtItem`, `PaymentResult`        |

**Abbreviations:** Only universally understood ones — `ctx`, `err`, `req`, `res`, `db`.
When in doubt, spell it out.

---

## 5. Comments Explain Why, Not What

- Code tells you _what_. Comments tell you _why_.
- Every workaround gets a comment explaining what it works around
- **TODO format:** `// TODO(#issue): description`
- **Delete commented-out code** — git history preserves everything

```dart
// ❌ Explains what (the code already says this)
// Increment counter by one
counter++;

// ✅ Explains why (context the code can't convey)
// Delay between API calls — Firebase rate-limits above 60 req/min
await Future.delayed(rateLimitDelay);
```

---

## 6. DRY but Not Premature

- **Rule of Three:** Don't abstract until you've seen the pattern three times
- Duplication is cheaper than the wrong abstraction
- When abstracting, the shared code must represent the _same concept_, not just similar text

---

## 7. Explicit Over Implicit

- Don't rely on default behavior unless it's well-documented
- Explicit null checks, explicit type conversions, explicit default values
- No magic numbers — use named constants

```dart
// ❌ Magic number
if (retries > 3) { ... }

// ✅ Named constant
const maxRetries = 3;
if (retries > maxRetries) { ... }
```

---

## 8. Consistent Error Handling

Wrap errors with context about _what was being attempted_:

```dart
try {
  final result = await fetchRecord(name);
} on IOException catch (e) {
  throw RecordFetchException('Failed to fetch record "$name"', e);
}
```

```typescript
try {
  const result = await fetchRecord(name);
} catch (error) {
  throw new Error(`Failed to fetch record '${name}': ${error.message}`);
}
```

- Never bare `catch (e)` without re-throwing or explicit justification
- Log errors at the point where you have the most context

---

## 9. State Management

- Minimize mutable state — prefer transforming data through functions
- Keep state close to where it's used
- No global mutable variables
- In UI code: single source of truth, unidirectional data flow

---

## 10. Code Layout / Reading Order

A reader should understand a file top-to-bottom without jumping.

1. Imports / package declaration
2. Constants and type definitions
3. Public / exported functions or classes (entry points near top)
4. Private / internal functions

Organize by **logical grouping**, not alphabetically.

---

## 11. Performance Philosophy

**No premature optimization.** Follow the ladder:

| Step | Action                                      |
| ---- | ------------------------------------------- |
| 1    | Notice a real, measurable problem           |
| 2    | Measure it with profilers/timing            |
| 3    | Check data structures first (biggest lever) |
| 4    | Profile for hotspots                        |
| 5    | Look under the hood (last resort)           |

Write clear code first. Correct and readable beats fast and clever.

---

## 12. Anti-Patterns Summary

| ❌ Avoid                          | ✅ Prefer                                     |
| --------------------------------- | --------------------------------------------- |
| Deep nesting (4+ levels)          | Guard clauses, extraction, early returns      |
| Functions that do multiple things | Single-purpose functions composed together    |
| Silent error swallowing           | Explicit handling or justified suppression    |
| Clever one-liners                 | Clear multi-line code humans read easily      |
| Magic numbers and strings         | Named constants                               |
| Commented-out code blocks         | Delete it — git remembers                     |
| `dynamic` / `any` escape hatches  | Proper types, even if verbose                 |
| Copy-pasting on first duplication | Accept duplication until the pattern is clear |
| Optimizing without measuring      | Follow the performance ladder                 |
| Abbreviations only you understand | Spell it out                                  |

---

## 13. Testing Philosophy

**No testing theater.** Every test should exist for a reason.

| Test It                                    | Why                                     |
| ------------------------------------------ | --------------------------------------- |
| Functions with branching logic             | Multiple paths = multiple ways to break |
| Core business logic                        | If this breaks, everything breaks       |
| Edge cases (empty input, null, max values) | Off-by-one and boundary bugs are common |
| Code likely to be refactored               | Tests are your safety net               |
| Anything that's bitten you before          | Regression tests prevent repeat pain    |

| Skip It                        | Why                                 |
| ------------------------------ | ----------------------------------- |
| Simple getters with no logic   | Testing the language, not your code |
| Thin wrappers around libraries | Test your logic, not theirs         |
