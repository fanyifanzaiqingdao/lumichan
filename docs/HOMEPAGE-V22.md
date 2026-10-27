# Homepage V2.2 — 2026-10-27

Source: `../首页修改任务书/Lumichan_Homepage_Design_Plan_CN.docx`, desktop/mobile references and supplied WebP assets. The user's instruction makes the newly implemented Services brief authoritative for conflicting prices, service scope and cancellation rules.

## Implemented

- Navy/champagne homepage with a Road Trip feature, Planning/Signature secondary cards and a lightweight Education entry. Title and image detail links are independently configurable for retail services; Education has neither link.
- Journeys use a large/two-small composition and default `showHomepagePrice=false`. Approval records and detail-page pricing have not been removed.
- Five-scene Why slideshow and high-contrast item headings; dark six-step timeline with a single-line intro at standard desktop width.
- Three story cards, four supplied AI stills per card, automatic rotation, manual controls, pause, visibility/hover/focus handling and reduced-motion support. These are image sequences, with no video player or implied customer recording.
- Guest Stories uses a balanced two-line title. Explicitly labeled fictional review layouts exist only in the dev/staging lazy component. Production retains the section with an empty state until verified real reviews are available. Real reviews require source, quotation permission and image permission; consent records are redacted on public reads.
- Five FAQs; four required visible inquiry fields and optional preferences. Ins/WeChat accounts appear conditionally and are discarded when returning to Email. Form continues to use the existing inquiry endpoint.
- Admin adds story frames/intervals, hero mobile image/focal point, service detail link flags, homepage journey price visibility and separate footer/registration records.

## Shared service content

Homepage includes read `/api/services-page.php`, while starting prices and policy summaries share `/api/homepage.php` with Services. Planning retains the previously confirmed 1–5 / 6–10 day split. Unapproved vehicle price units are not republished. No refund formula or insurance/meal inclusion was invented.

`homepageLayoutRevision` upgrades old saved layout fields once. Existing custom service images, unpublished image status, prices and policy records are retained. Save/reload keeps subsequent operator edits. Legacy schema/content migrations remain compatible.

## Legal records

Footer contact address remains No. 140, Annex of Tianfu Avenue. The different registered address from the new task brief is stored in `legalIdentity` as a draft, with Chinese/English wording and separate approval/version/effective-date fields. Dev/staging legal pages clearly label it as a draft. Public API and production display do not publish draft registration details; an approved record requires reviewer and dates. Legal pages use searchable HTML; existing Services cancellation schedules remain authoritative. WhatsApp was removed from the outdated contact label in Booking Terms.

## Validation

- `tests/homepage-v22-browser.mjs`: 320/390/768/1440/1920 layouts, image/title links, no homepage route prices, story frame counts, sample labels, form condition/reset/consent, draft registration and separate footer address. Inquiry submission is intercepted locally.
- Existing homepage JS unit tests and PHP validation, extended for layout migration, stories, link flags and registration publication.
- Services API and admin browser regression checks. Independent story playback check covers autoplay, pause, manual navigation and reduced-motion suppression.
- Dev/staging and production builds; production review examples and draft legal display checked separately.

No deployment or Git push is part of this change.
