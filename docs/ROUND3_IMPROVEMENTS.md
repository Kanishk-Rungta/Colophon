# Three substantial Round 3 improvements

These are planned, not advertised as working Round 2 functionality.

## 1. Visual Brand Governance

Add image uploads with bounded file sizes and authenticated object storage. Extract text via OCR, compare logo embeddings to versioned approved assets, identify known outdated logos, inspect palette/spacing constraints, and map findings to source-image regions. Keep uncertainty visible and require explicit human review for visual exceptions.

Acceptance: a labelled image evaluation set must include correct logos, known obsolete assets, prohibited palette usage, and ambiguous crops. Findings must point to an image region and an approved asset/policy version. Report measured precision/recall by category, test malicious uploads and workspace isolation, and preserve the approved asset hash/version in the Publication Record.

## 2. Guideline Debt Analytics

Aggregate reason-coded disputes, overrides, recurrent warnings, source changes, and review turnaround by policy revision. Distinguish unclear guidelines from careless draft patterns. Provide trends and a reviewer-confirmed proposal queue for policy improvements. Never weaken a rule automatically because it is frequently overridden.

Acceptance: repeat disputes and overrides must be traceable to their content and source versions, with role-restricted views and date/scope filters. Analytics should agree with audit counts on a seeded multi-review dataset. A proposed guideline revision must require explicit administrator approval and preserve the old policy history.

## 3. Advanced Evidence Verification

Extend the current expiry/scope filters with explicit supersession chains, normalized fact subjects, richer source spans, conservative claim decomposition, better contradiction detection, and lineage validation. Add multi-source conflict handling and an expanded regression suite covering expired evidence, subject ambiguity, qualifier semantics, adversarial content, and outdated citations.

Acceptance: all consequential findings must reference a current applicable source/policy version and an exact claim span; invented IDs and invalid source excerpts must be rejected. Superseded evidence must never silently support a current approval. Publish measured results on a held-out labelled set, including unsupported-claim detection and false-positive rates. Keep deterministic checks operational during provider outages.
