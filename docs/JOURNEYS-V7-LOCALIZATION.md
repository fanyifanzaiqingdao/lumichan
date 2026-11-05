# Journey V7 localization

Status: new translation drafts, pending native-language editorial review.

All nine existing catalogs merged without replacing existing entries. Covers seed visitor copy, media alt text/captions, optional featuredBody and goodToKnowTitle, joined region cues, Journey UI/accessibility and Chinese CMS labels. SEO uses exact seed seoTitle/seoDescription and supplied landing title/description. Metadata, paths and slugs excluded. AI illustration and unverified-location disclosures retained.

Public built-in copy only was sent to DeepSeek; configured credential captured privately through PHP and never persisted or printed. Independent temporary cache; maximum three concurrent requests. Latest seed re-collected before final coverage check. No commit or deploy.

Validation: `node --test tests/locales.test.mjs` passed all 3 tests. Final seed re-read: all 183 non-empty public copy strings covered in every catalog, including final generated Qingcheng/Dujiangyan alt text and captions. All nine catalogs cover the full 2,229-key zh/en union with no missing keys. Existing values preserved; missing Chinese-source keys in the seven additional catalogs translated from their English catalog values.

Usage: 52 successful API responses cached in an independent temporary cache across initial batches, retries and catch-up passes; maximum 3 concurrent requests. Token totals and failed-request billing were not retained and cannot be reported accurately. No customer information sent.

CMS correction: extracted all 61 distinct Chinese literals from the final JourneysPageEditor, including every labels-object value. Replaced untranslated fallback values with English and seven target-language drafts; zh retains Chinese sources. Added tests/journeys-v7-localization.test.mjs to check every editor label and Chinese literal, named Journey UI/accessibility keys, and Chinese fallback leakage in English/European/Korean catalogs. Combined locale and Journey regression tests pass (4 tests). Correction used 9 successful API requests with at most 3 concurrent; token totals unavailable.

Build-size follow-up: English source text already falls back to itself in the runtime, so redundant English identity mappings were removed from en.json. Chinese-to-English admin translations and non-identity editorial changes remain. The other eight catalogs retain translated coverage. This prevents a roughly 230KB uncompressed increase in the entry bundle without changing visible text. Three Road Hero labels (Private Road Journey, Flexible Route, Customizable Duration) were added to all eight translated catalogs.
