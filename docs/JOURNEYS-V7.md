# Journey V7 implementation

Reference: supplied 2026-10-30 Lumichan_Journey_Developer_Brief.docx. Changes are on dev. Services content is separate.

## Pages

Canonical English entrances (trailing slash matches static Nginx directories):
- /journeys/
- /journeys/cultural-gateway/
- /journeys/western-sichuan-private-road-trip/
- /journeys/deep-cultural-journey/

All nine language prefixes are supported. Existing /traveler/journeys URLs and the old chengdu-cultural-gateway slug remain client-side aliases. Install deployment/nginx-journeys.conf at server scope in the test site's HTTP and HTTPS blocks for actual HTTP 301 redirects. This local change has not modified BaoTa or deployed that configuration. Static legacy entrances also carry the new canonical URL.

Three detail pages have exactly six top-level sections: Hero, Intro, Experiences, Gallery, Image story, Good to Know + CTA. Road/Deep have six experiences, six gallery scenes and four information items; Gateway has three four-frame cards and five information items. There are no prices, numeric day counts, snapshots or audience cards.

Gateway frames crossfade every 4.2 seconds. Hover, focus, explicit pause and document visibility pause playback. Reduced-motion starts on the first frame, with manual controls retained. Text is stationary; dot buttons have individual accessible names.

## Content management

Admin → Journeys CMS. Seed is public/api/data/journeys.json, saved configuration is ignored public/api/data/journeys.live.json. Admin requires the existing login plus CSRF token, validates the whole structure and saves atomically. No new database table. Public API is /api/journeys.php, which removes drafts and internal media-rights records. The existing translation editor also indexes Journey copy; new CMS copy can be translated there.

Hero desktop/mobile sources and crop focus, SEO, experiences, per-frame captions/alt, gallery order, story, Good to Know and CTA labels are configurable. The six-module structure and canonical IDs remain fixed. Real photos must have verified publication rights before publishing; AI concepts are visibly marked. Detailed asset provenance and required replacements are in JOURNEYS-V7-ASSETS.md. No watermarked Qingcheng or company-PPT reference is copied into the build.

The built-in seed is an offline/network-error fallback. The published configuration is used when the public API responds successfully, including an empty published list. Runtime CMS drafts are not embedded in build output.

## Inquiry integration

CTA links use the existing homepage inquiry API and preserve journey ID, editable display name and source page. Attribution is stored in existing inquiries.utm_json.journey and source_page; no migration is required. Both success and error states use the existing form flow. Tests intercept requests and do not create real leads or send mail.

## Verification

npm run build:dev and npm run build include release checks and generate localized static SEO entrances. tests/journeys-browser.mjs covers four routes, six sections, no prices/day counts, viewport overflow, image decoding, slideshow interaction and consented inquiry success/error. tests/journeys-api.php validates schema and publication projection; tests/journey-inquiry.php validates attribution without a database. Existing multilingual/SEO regression tests remain applicable.

Operational confirmations remain external: actual site access, stops, local hosts, vehicle/driver scope and final photographic permissions. The Jinsha copy describes archaeology and promises no museum visit; opening status must be checked when confirming a real itinerary. No remote deployment, live lead submission, Git commit or push is performed by this implementation.
