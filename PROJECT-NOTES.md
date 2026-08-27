# Black Hat Contact Cards — Project Notes

**What this is:** a from-scratch NFC/QR digital contact card system, built entirely on static files (no backend, no database, no accounts) hosted on GitHub + Vercel at `blackhatcards.community`. This document captures the architecture, the key decisions made along the way, and *why* — so future work on this project doesn't have to rediscover reasoning that's already been worked out.

---

## 1. The Core Idea

Someone taps an NFC tag (or scans a QR code) → their phone loads a live webpage → the page shows a digital contact card → they can save it, pay the person, book time with them, or send their own info back. No app to install, no account to create.

There are **two parallel systems** built on the same foundation:
- **Person cards** — for individuals (friends, professionals)
- **Property cards** — for real estate listings (built for two realtor friends)

Both share the same visual design and file structure, but have independent rendering logic since their data is fundamentally different (a person vs. an address).

---

## 2. Architecture — Why It's Built This Way

**The core principle: separate the engine from the data.**

Every person's (or property's) live page is just two files sitting in their own folder:
- `index.html` — an **unedited copy** of a shared template, identical for every person
- `data.json` — that specific person's actual info

The `index.html` file itself contains almost no content — it's a skeleton of empty containers with IDs. A shared JavaScript file (`assets/app.js` for people, `assets/property.js` for properties) fetches that folder's `data.json` and fills in the page dynamically.

**Why this matters:** if you want to add a new field, fix a bug, or change the design, you edit **one file** (`app.js`, `property.js`, or `style.css`), and it applies to *every* existing card the next time someone loads it — no need to touch hundreds of individual person folders.

**The one real gotcha with this design:** if you change `index.html` itself (add a new section, a new button — anything requiring new HTML, not just new JS logic), that change does **not** retroactively apply to already-created folders. Their `index.html` was copied at creation time and is now frozen. Only *new* folders get the current template. This tripped us up more than once — it's the single most important thing to remember about this architecture.

---

## 3. File Map

```
your-project/
├── assets/
│   ├── style.css       ← shared visual design (person + property)
│   ├── app.js          ← renders every person card
│   └── property.js     ← renders every property card
├── generator.html              ← you build/edit person cards
├── property-generator.html     ← you build/edit listings
├── my-contact-info-form.html   ← friends self-submit their own info
├── property-intake-form.html   ← realtors self-submit a listing
├── person-template/
│   ├── index.html       ← copied unedited into every NEW person folder
│   └── data.json        ← sample schema only
├── property-template/
│   ├── index.html       ← copied unedited into every NEW property folder
│   └── data.json        ← sample schema only
├── jane-doe/                        ← a real, live person
│   ├── index.html  (copy of template)
│   ├── data.json
│   └── photo.jpg
└── for-sale-123-main-st/            ← a real, live listing
    ├── index.html  (copy of template)
    ├── data.json
    ├── hero.jpg
    └── photo1.jpg, photo2.jpg...
```

**Domain constants live in multiple places, deliberately** (not centralized, since these are independent static files with no shared config): `PROJECT_BASE_URL` in `app.js`, `property.js`, `generator.html`, and `property-generator.html`; `RECIPIENT_EMAIL` in both intake forms. All currently point to `blackhatcards.community` and `BlackHatToday+BHCC@Gmail.com` respectively. **If either the domain or the intake email ever changes, all of these need to be updated individually** — there is no single source of truth for them.

---

## 4. Why No Backend

This entire system was deliberately kept backend-free — no server, no database, no user accounts, no login. Every "smart" feature (sending an email, generating a QR, pre-filling a form) is done with client-side JavaScript and browser features (`mailto:`, `sms:`, the Clipboard API, the File System Access API, `window.print()`).

**What this buys:** free hosting, no server to maintain, no database to secure, no accounts to manage, and everything is easy to audit by just reading the HTML/JS source.

**What this costs:** there's no real authentication, no way to *enforce* anything server-side, and every "verification" mechanism in this system is really a **deterrent**, not a **lock**. This is a conscious, repeatedly-revisited trade-off — see Section 6.

---

## 5. The Two Intake Paths

Every person/listing's `data.json` gets built one of two ways:

1. **You build it directly** in `generator.html` / `property-generator.html` — fill in a form, download (or, in Chrome/Edge, **Save** directly back to the file you loaded, via the File System Access API).
2. **Someone else submits it to you** via `my-contact-info-form.html` / `property-intake-form.html` — they fill out a simplified form, hit send, and it becomes a `mailto:` draft **to you**. You then manually retype it into the generator.

**Why the manual retype step is intentional, not a missing feature:** a stranger's raw submission going straight into a live page with no human review is exactly how typos, bad-faith submissions, or mistakes end up on a physical card. The retype step is your one deliberate checkpoint before anything ships.

**The intake form is deliberately short by default.** Only Message, Identity, Phone, and Email show up front — everything else (About, Experience, Skills, Social, Payments, Address, Websites, Calendly) is collapsed behind an "Add more details" button, so a brand-new person isn't scared off by a huge form. If someone arrives via their own **pre-filled edit link** (see Section 7), that section auto-expands automatically, since they already have real data to review.

---

## 6. Security & Trust Model (Read This Before Assuming More Protection Exists Than There Is)

**The honest baseline:** since there's no backend, there is no way to truly *prevent* someone from impersonating a card holder or tampering with a request. Every safeguard below raises the bar or gives you better information to make a judgment call — none of them are a hard lock.

- **Security tokens** (`accessToken` in `data.json`) — a random string appended to the *physical tag's URL only* (`?t=xxxxx`), never the plain link you'd hand out. When someone uses "Contact / Support / Updates," the page compares the token in the URL against what's on file and tags the resulting email `[Verified]` or `[UNVERIFIED]` right in the subject line. This only protects the *update-request* flow — it does **not** gate the card page itself, which stays fully public and viewable regardless of whether the token is present or correct. That's intentional: the whole point of a card is to be publicly viewable.
- **Sender-email cross-checking** — always compare the *actual* sending address on a request against what's on file for that person before making a change.
- **Payment changes get extra scrutiny, always** — verify any change to Cash App/Venmo/PayPal/Zelle out-of-band (text or call) before updating, regardless of how convincing the request looks. This is the single highest-stakes category, since it's a direct path to redirecting money.
- **Real authentication was explicitly deferred**, not forgotten. If this system ever needs to scale past "friends and known professionals," that's the point where a real backend with actual accounts becomes worth the added complexity — noted on the standing suggestions checklist, not built.

---

## 7. Key Features and Why They Exist

- **Save to Contacts** (renamed from "Save Contact") — downloads a `.vcf` vCard. Only a subset of fields (name, org, title, phone, email, address, website, notes) actually fit the vCard format — richer fields (skills, payments, social) have no standard vCard slot and only ever live on the webpage.
- **Share Your Info** — the reverse flow: a visitor sends *their* info back to the card owner, via a pre-filled Text or Email choice (their choice, not automatic). Includes a timestamp and a best-effort location link (only if the visitor grants permission — never required, never blocks the flow if denied).
- **Collect Info** (renamed from "Collect Contact Info") — the card owner's tool for the same flow, but *initiated by them*: shows a QR that jumps straight to a stripped-down "share your info" screen (`?action=share`), skipping the full card entirely. Built specifically so a card holder can actively request someone's info mid-conversation instead of relying on the visitor to find the button themselves.
- **Scan a Card** (renamed from "Scan a Visitor's Card") — the card owner's own OCR tool (Tesseract.js, entirely client-side, no backend): scan a physical business card someone hands them, review the extracted phone/email (name is always manual — OCR can't reliably find it), then send it to their *own* email or phone as a personal record. Deliberately requires that review step before sending, unlike Share Your Info, since an unreviewed OCR mistake here would be silently wrong with no one to catch it. Notably absent from the two client-facing intake forms — that placement was tried and reverted, since a mis-scanned field there would just cause back-and-forth corrections with no upside.
- **Refer a Friend** — lets *anyone* viewing a card (not just its owner) share a link to the general intake form, formatted as "Request a Black Hat Card." Deliberately points at a fixed URL (never derived from the current page's domain), so it's correct even if viewed via an old `.vercel.app` tag.
- **Two-column button layout** — the six buttons above split into "For You" (Save to Contacts, Share Your Info, Save as PDF — things a *visitor* would use) and a column headed by the owner's own initials, e.g. "JD's Tools" (Collect Info, Scan a Card, Refer a Friend — things the *card owner* would use). The initials-based header is deliberate: a generic "Your Tools" label reads ambiguously to a visitor, but naming the actual owner makes "not mine to use" obvious at a glance. Every button in both columns shares a consistent minimum height, so whichever label happens to wrap to two lines on a given screen, its neighbor in the other column still lines up with it.
- **Payment / Donate section** — Cash App, Venmo, and PayPal render as real tappable links with an optional QR popup; Zelle renders as plain text with an explicit "not clickable" caption, since Zelle has no public payment link. The section's title itself is configurable per person (defaults to "Payment," can be set to "Donate" or anything else).
- **Book a Time** — a configurable-label button (defaults to "Book a Time," can become "Schedule a Showing" on a property card) linking to a Calendly URL.
- **Listings** (person cards only, capped at 5) — lets a realtor's *personal* card link out to their active property listings. Deliberately not available on the friend-facing intake form, since a brand-new person filling out their own card wouldn't have live listing URLs to reference yet — this is a field you add after the fact, in the generator.
- **Another Listing** (property cards) — the property-side equivalent: cross-links one listing's card to another, with its own QR. Same reasoning: only editable by you, after both cards already exist.
- **Save as PDF** — a print-styled version of the whole card, with the dark theme forced to render correctly (`print-color-adjust: exact`) and only the non-functional JavaScript-only buttons hidden; every real link (Book a Time, Contact rows, Listings) stays clickable in the saved PDF.
- **Print QR Code Only** — a second, more surgical print mode: strips the page to just the photo, name, and QR code, for someone who wants a standalone printable code rather than the whole card.
- **Contact / Support / Updates** — the single catch-all link at the bottom of every card. Originally two separate links (a quick blank note vs. a full pre-filled edit form); consolidated into one, since the fuller flow does everything the quick one did and more.

---

## 8. Notable Design Decisions (the "why," specifically)

- **Property tags should never be locked.** Unlike a person (permanent), a listing has a natural expiration — an unlocked tag can be wiped and reused for the next property once one sells.
- **Photos and "attach it yourself."** `mailto:`/`sms:` links cannot carry file attachments — this is a hard protocol limitation, not a bug. Every flow that needs a photo (intake forms, Share Your Info) asks the person to manually attach it themselves rather than pretending otherwise.
- **Voice recording / photo capture as attachments were considered and declined**, for now — same underlying `mailto:`/`sms:` attachment limitation means it would require record → download → manually attach, adding real friction for a marginal gain. Text (SMS) was added instead, since it had no such limitation.
- **The Web Share API was tried, then deliberately replaced** for the Refer button, since its available share targets are entirely OS-controlled and inconsistent (desktop browsers often only offer Mail, no SMS at all). Replaced with an explicit Text/Email/Copy choice menu that behaves identically on every device.
- **Case sensitivity and trailing slashes are recurring real bugs**, not hypothetical ones — Vercel's servers are case-sensitive (`Index.html` ≠ `index.html`), and relative asset paths break without a trailing slash on the visited URL. Both `photoFile` resolution and the whole `assets/` folder structure account for this.
- **The stray root-level `index.html`/`data.json`** left over from very early testing are known clutter, not part of either system — safe to delete, never got cleaned up.
- **Share Your Info and Collect Info converge on the same underlying action** — both end at the visitor picking Text or Email and sending their own info to the card owner. They were kept as two separate buttons anyway, deliberately, because they differ in *entry point*: Share Your Info only gets used if a visitor happens to notice it while browsing the full card (passive); Collect Info is a QR the owner can proactively hand to someone, skipping straight past the rest of the card (active) — useful specifically in a crowd, or when someone's phone has NFC reading disabled and a QR is the only path that works at all.

---

## 9. Open Items / Standing Checklist

*(Also tracked separately in ongoing memory — this is the durable snapshot as of this write-up.)*

- [ ] Keep a private log (Name/Address → Folder → Token → Tag issued date) — not stored anywhere in this repo
- [ ] Set a calendar reminder for domain renewal
- [ ] Periodically spot-check live cards after any `assets/` or template change
- [ ] Real authentication/backend — explicitly deferred, revisit only if scale demands it
- [ ] Watch whether the 5-listing cap and referral system actually get used the way they were designed, once there's real usage data via Analytics

---

## 10. If You're Picking This Back Up After a Long Break

1. Check `assets/app.js` and `assets/property.js` first — that's where almost all the actual logic lives.
2. Remember: editing the shared engine changes every *future* card automatically, but never retroactively updates already-created folders.
3. When in doubt about a specific button or field's purpose, search this document — most of what's here was worked out through real back-and-forth, not guessed.
