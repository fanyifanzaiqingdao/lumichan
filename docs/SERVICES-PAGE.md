# Services page — 2026-10-27

Implementation of `service 二级页面任务书/Lumichan_Service_Page_Development_Brief.docx`, with desktop/mobile reference PNGs. Route: `/traveler/services`.

## Content and configuration

- Eight reorderable/optional modules: hero, why, services, pricing, vehicles, idea, reviews, final CTA.
- Three retail services retain the existing anchors `planning-support`, `private-road-trip`, `signature-private-journey`. The education anchor remains as a program consultation link.
- `public/api/data/services-page.json` is the versioned seed. The admin's **Services 页面** tab saves an ignored `services-page.live.json` via authenticated, CSRF-protected `/api/admin-services-page.php`. Public reads use `/api/services-page.php`; private review source/consent records are redacted.
- Prices, currency and booking policy remain in the existing homepage service configuration. The Services editor links to that shared editor. Policy approval, version, confirmation date and refund steps remain there; they are not copied into a second editable policy.
- USD 99/299/699 are starting references. Existing unapproved `/ day / vehicle` units migrate in memory to `Starting reference`. After business confirmation, edit the unit and tick `计价单位已获业务确认`. Planning uses the previously confirmed 1–5 / 6–10 day bands.
- Service CTA IDs use `planning`, `road-trip`, `signature`, `education`; Contact also accepts legacy aliases. The selection populates the subject and `preferred_service`, which is validated and included in local submissions and notification mail.
- Module and gallery images have path, alt, focal point, AI flag, visibility and permission metadata. Editing the image path resets its authorization and license. Gallery order is changed with 上移/下移. Real reviews must have verified source, consent, and authorized non-AI photographs before publishing.

## Preview and production

- Development and `npm run build:dev` show illustrative assets with AI labels and three explicit sample reviews. The sample review text lives in a lazy preview-only module, outside customer review data. There are no invented names or nationalities.
- `npm run build` excludes the sample review chunk. Production displays only authorized non-AI imagery and verified published reviews; without reviews, it retains the default section text. Preview cannot be enabled with a URL query parameter.
- Supplied hero and Idea images are smaller than the source dimensions requested by the brief. They have been converted to WebP at their existing resolution; they have not been upscaled or presented as original high-resolution photographs. Replace with full-resolution authorized photography before production publication.
- Live configuration, uploaded files and secrets are excluded from build output. Deployment should preserve existing server live config and uploads. No deployment or remote push is performed by this change.

## Assets

Source directory: `../service 二级页面任务书/assets/`.

| WebP output | Supplied source | Use |
|---|---|---|
| hero.webp | ai_hero_travelers_suv_concept.png | Hero |
| planning.webp | ai_traveler_map_concept.png | Planning, gallery, preview review |
| road-trip.webp | ai_vehicle_exterior_concept.png | Road trip, gallery |
| signature.webp | ai_signature_welcome_concept.png | Signature, gallery |
| interior.webp | ai_vehicle_interior_concept.png | Gallery |
| driver.webp | ai_private_road_trip_concept.png | Gallery, preview review |
| idea.webp | ai_idea_banner_concept.png | Idea background |
| landscape.webp | western-sichuan.jpg | Illustrative preview review |

These are supplied prototype illustrations, not inventory, actual drivers or actual customers. New AI generation was not needed. Supplied Playfair 600 and DM Sans 400/600 are served locally for this page.

## Verification

- `node tests/services-page-api.mjs`: isolated temporary PHP server, authentication/CSRF, save/read, invalid data rejection, review publication and consent redaction, contact selection persistence. No live data or notifications.
- `PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node tests/services-page-browser.mjs`: 320/390/768/1440/1920 widths, eight modules, keyboard dropdowns/gallery, full-image dialog, contact and legacy links. No actual form submissions.
- `PLAYWRIGHT_MODULE=... node tests/services-page-admin-browser.mjs`: mocked admin reads/writes, editing, save/reload, media permission reset and mobile layout.
- Existing homepage content and PHP validation checks, staging and production builds.
