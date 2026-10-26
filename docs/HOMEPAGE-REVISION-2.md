# Homepage revision 2.0

Implemented on dev, 2026-10-23. Source: `../首页修改建议2.0.docx`.

## Scope

- Bold homepage headings; preserve existing palette and sentence breaks.
- USD 99 / 299 / 699 service starting prices; booking summaries collapsed by default.
- Planning day five stays in the first band per the owner's earlier confirmation: 1-5 days USD 99, 6-10 days USD 199. The new document overlaps day five; this resolves that overlap without charging it twice.
- Updated journey titles, summaries, tags and approved starting-price badges. No unconfirmed per-person or group basis invented.
- Eight AI illustrations: three service images and five autoplay Why gallery images. All disclosed as AI illustrations, not real fleet, office or customer evidence.
- Carousel pauses on hover/focus, outside the viewport and in hidden tabs; reduced-motion users get manual navigation. Manual navigation pauses autoplay.
- Journey and Why CTAs link to inquiry. Contact choices: Email, Ins, WeChat, with required account for the latter two.
- Corrected registered company and address; cancellation schedules rendered as semantic text without changing approved policy terms.
- Synced fallback, API, detail pages, FAQ and support knowledge pricing.

## CMS and deployment

`contentRevision: homepage-2.0-2026-10-23` migrates the changed fields of older saved homepage configurations in memory. GET never overwrites the live file. Later CMS edits are retained after this revision is saved. Existing hero, reviews, policy approvals and other unrelated fields remain intact.

The admin homepage editor exposes five gallery images, alt text, AI labels and approved price badges. Deploy frontend AND updated `api` code and seed JSON together. Preserve the server's private `api/config.php`, database, uploads and live content; never replace server credentials with local test settings. No SQL migration is required for this revision.

## Image provenance and prompts

Generated with the built-in image generation tool, 1536 x 1024. Optimized JPEG and WebP copies live under `public/images/home-revision2/`. Original generated PNGs remain in the generation output directory. Prompts below are the exact generation requests.

### road-trip

Assets: `public/images/home-revision2/road-trip.jpg`, `public/images/home-revision2/road-trip.webp`.

```text
Use case: photorealistic-natural. Create one wide landscape 3:2 photographic concept image for Lumichan's Private Road Trip service. A premium unbranded dark green off-road SUV driving safely along a paved winding road in western Sichuan, China, with open grasslands and dramatic distant mountain peaks. Clear natural daylight, realistic geography and vehicle proportions, vehicle fully visible in the middle third and generous landscape around it for responsive crops. Editorial travel photography, crisp detail, no advertising text, no watermarks, no logos, no invented signage. This is an illustrative AI travel scene, not evidence of an actual company's vehicle.
```

### signature

Assets: `public/images/home-revision2/signature.jpg`, `public/images/home-revision2/signature.webp`.

```text
Use case: photorealistic-natural. Asset: Lumichan travel website AI concept photography. Generate one landscape 3:2 image. A luxurious unbranded black MPV parked at a refined Sichuan courtyard entrance, two adult international travelers with a local host arriving for a private gongfu tea and traditional craft experience. Vehicle completely visible, tasteful premium cultural experience, natural daylight, candid realistic composition. Editorial travel photography, high detail, natural colors and clear soft daylight. Subjects centered with room for responsive crops. No watermarks, no collage, no advertising captions, no logos except the specified office wordmark. Do not add any text unless explicitly requested. Illustrative AI-generated scene, not documentation of actual clients or facilities.
```

### education

Assets: `public/images/home-revision2/education.jpg`, `public/images/home-revision2/education.webp`.

```text
Use case: photorealistic-natural. Asset: Lumichan travel website AI concept photography. Generate one landscape 3:2 image. A small group of European university-age adult students and a Chinese teacher practicing Chinese calligraphy around a table in a bright traditional Sichuan cultural workshop. Focus on genuine interaction, brushes, ink and paper, respectful everyday clothing, not ceremonial costumes. Editorial travel photography, high detail, natural colors and clear soft daylight. Subjects centered with room for responsive crops. No watermarks, no collage, no advertising captions, no logos except the specified office wordmark. Do not add any text unless explicitly requested. Illustrative AI-generated scene, not documentation of actual clients or facilities.
```

### fleet

Assets: `public/images/home-revision2/fleet.jpg`, `public/images/home-revision2/fleet.webp`.

```text
Use case: photorealistic-natural. Asset: Lumichan travel website AI concept photography. Generate one landscape 3:2 image. A clean unbranded dark SUV and a premium silver MPV parked together at a landscaped Sichuan travel departure courtyard. Both vehicles completely visible, three-quarter view, realistic proportions, clear vehicle sample display. No claim that these are actual fleet vehicles. Editorial travel photography, high detail, natural colors and clear soft daylight. Subjects centered with room for responsive crops. No watermarks, no collage, no advertising captions, no logos except the specified office wordmark. Do not add any text unless explicitly requested. Illustrative AI-generated scene, not documentation of actual clients or facilities.
```

### office

Assets: `public/images/home-revision2/office.jpg`, `public/images/home-revision2/office.webp`.

```text
Use case: photorealistic-natural. Asset: Lumichan travel website AI concept photography. Generate one landscape 3:2 image. A contemporary small Chinese travel agency office, three Chinese adult travel planners discussing a Sichuan itinerary around a meeting table with a paper map, notebooks and laptop. Tasteful daylight office with a clear simple wall wordmark reading exactly LUMICHAN. This is a concept visualization, not an actual office photograph. No other readable text. Editorial travel photography, high detail, natural colors and clear soft daylight. Subjects centered with room for responsive crops. No watermarks, no collage, no advertising captions, no logos except the specified office wordmark. Do not add any text unless explicitly requested. Illustrative AI-generated scene, not documentation of actual clients or facilities.
```

### travelers

Assets: `public/images/home-revision2/travelers.jpg`, `public/images/home-revision2/travelers.webp`.

```text
Use case: photorealistic-natural. Asset: Lumichan travel website AI concept photography. Generate one landscape 3:2 image. Three adult European and American travelers taking a scenic break beside a dark SUV at a safe roadside viewpoint in western Sichuan. Alpine meadow and distant mountain peaks, cheerful natural candid conversation, panoramic environment, vehicle parked safely off the road. Editorial travel photography, high detail, natural colors and clear soft daylight. Subjects centered with room for responsive crops. No watermarks, no collage, no advertising captions, no logos except the specified office wordmark. Do not add any text unless explicitly requested. Illustrative AI-generated scene, not documentation of actual clients or facilities.
```

### culture

Assets: `public/images/home-revision2/culture.jpg`, `public/images/home-revision2/culture.webp`.

```text
Use case: photorealistic-natural. Asset: Lumichan travel website AI concept photography. Generate one landscape 3:2 image. Two European and American adult travelers sharing tea with a local Tibetan host in a courtyard in western Sichuan on the Sichuan-Tibet cultural route. Everyday modern clothing, respectful engaging conversation, authentic Tibetan architectural details in background, no exoticized staging. Editorial travel photography, high detail, natural colors and clear soft daylight. Subjects centered with room for responsive crops. No watermarks, no collage, no advertising captions, no logos except the specified office wordmark. Do not add any text unless explicitly requested. Illustrative AI-generated scene, not documentation of actual clients or facilities.
```

### pandas

Assets: `public/images/home-revision2/pandas.jpg`, `public/images/home-revision2/pandas.webp`.

```text
Use case: photorealistic-natural. Asset: Lumichan travel website AI concept photography. Generate one landscape 3:2 image. A European and American adult couple observing a giant panda eating bamboo from the public visitor viewing area at a green Sichuan panda conservation park. Clearly separated by a safe visitor barrier, no touching or feeding, panda and visitors both visible, natural green environment. Editorial travel photography, high detail, natural colors and clear soft daylight. Subjects centered with room for responsive crops. No watermarks, no collage, no advertising captions, no logos except the specified office wordmark. Do not add any text unless explicitly requested. Illustrative AI-generated scene, not documentation of actual clients or facilities.
```

