# Black Hat Contact Cards — Manual

Task-first reference. If you need to know *how the system works and why*, see `PROJECT-NOTES.md` instead — this document is for *doing something right now*.

---

## Quick Reference

| I need to... | Go to |
|---|---|
| Add one new person | §1 |
| Add one new property listing | §2 |
| Add many people at once from a spreadsheet | §3 |
| Set up a new business's brand colors | §4 |
| Let someone submit their own info | §5 |
| Edit an existing person or listing | §6 |
| Write a physical NFC tag | §7 |
| Update existing cards after an engine change | §8 |
| Push changes live | §9 |
| Handle a lost or compromised card | §10 |
| Check if an update request is real | §11 |
| Fix something that's not working | §12 |
| Do my weekly upkeep | §13 |
| Understand which button does what, and why | §14 |
| Check whether a tool works on my phone/tablet | §15 |
| Organize a realtor team's folders | §16 |

---

## 1. Adding a New Person (Solo)

1. Open `generator.html`.
2. Click **New Person** if you were previously editing someone else.
3. Fill in Identity — Prefix, First/Last Name, Title, Org, Tagline. Leave **Brand** blank unless this person belongs to a business you've already set up (§4).
4. Fill in Phone and Email — at least one, so Share Your Info and Collect Info work.
5. Click **Add more details** if you want About, Experience, Skills, Social, Payments, Address, Websites, or Calendly.
6. Check the **Security Token** and **Folder Name** fields — Folder Name auto-fills from the person's name; edit it if you want something different.
7. Click **Preview** to see the actual card before saving anything.
8. Click **Copy** next to the **Tag URL** field — you'll need this in §7.
9. Click **Save** (if you loaded an existing file) or **Download data.json**.
10. Create a new folder at your project root named exactly like the Folder Name field. Copy `person-template/index.html` into it unedited, place the downloaded `data.json` inside, and add a photo named to match the `photoFile` field (default `photo.jpg`).

---

## 2. Adding a New Property Listing (Solo)

Same shape as §1, using `property-generator.html` instead:

1. Open `property-generator.html`. Click **New Listing** if needed.
2. Fill in Address, Price, Sqft, Beds, Baths, Description.
3. Fill in Agent info (Name, Phone, Email), a **Brand** slug if this listing belongs to a branded business, and Booking link if applicable.
4. Leave **Another Listing** blank unless a second listing's card already exists live.
5. Preview, copy the Tag URL, Download/Save.
6. Create the folder, copy `property-template/index.html` in unedited, add `data.json`, add `hero.jpg` plus any gallery photos.

---

## 3. Bulk-Adding Multiple People

Use this when you receive a list of names all at once (a business, an event, etc.) rather than one at a time. **Desktop only** — see §15.

1. Open `bulk-generator.html`.
2. Click **Download CSV Template** and send it to whoever's collecting the names.
3. Once it comes back, click **Choose CSV File** and load it.
4. **Read the preview table before doing anything else.** Rows marked "Missing name" or "Duplicate in this file" get skipped automatically. Rows marked "No phone or email" still get created but flagged.
5. Click **Create Folders**, and pick your project's root folder when asked.
6. Read the log. Anything that already existed as a folder was **skipped, not overwritten** — check the log for those names specifically.
7. Photos are not part of this process — add each new person's photo manually afterward.

---

## 4. Setting Up a Business Brand

1. Open `brand-generator.html`.
2. Enter the business name — the slug auto-fills.
3. Pick an accent color. The hover/soft variant auto-generates; override it if you want a specific shade.
4. Watch the **live preview** — this is the actual card design with your chosen colors, not a guess.
5. Download the file, and place it in a `brands/` folder at your project root, named `{slug}.json`.
6. For every employee at that business, put the same slug into their **Brand** field in `generator.html`. For any of their property listings, the same **Brand** field exists in `property-generator.html` too — same slug, same result.
7. Click **Preview** in either generator — it fetches the real brand colors and applies them to the preview card, so what you see is what actually goes live, not the default palette.
8. To rebrand later: **Load Brand File** in `brand-generator.html`, adjust colors, **Save** — every person and listing referencing that slug updates automatically.

---

## 5. Having Someone Self-Submit Their Own Info

Use this instead of §1 when the person should type in their own details.

1. Send them the plain link: `my-contact-info-form.html` (people) or `property-intake-form.html` (realtors) — text it, don't email an attachment.
2. They fill it in and hit send — it becomes a `mailto:` draft **to you**, not a live submission.
3. When it arrives, **retype it into the generator yourself** rather than forwarding it straight into a live folder. This manual step is your one review checkpoint before anything goes public.
4. If the subject line starts with `[Verified]` or `[UNVERIFIED]`, see §11 before acting on it.

---

## 6. Editing an Existing Person or Listing

1. Open the matching generator (`generator.html` or `property-generator.html`).
2. Click **Load data.json**, and pick that person/listing's actual file.
3. In Chrome/Edge **on desktop**, this remembers the file — edit anything, then click **Save**, and it writes straight back to that exact file. No re-picking, no manual moving.
4. On mobile (any phone or tablet browser, Chrome included) or any other desktop browser, edit and click **Download data.json** instead, then manually replace the old file with the new one.

---

## 7. Writing a Physical NFC Tag

1. In whichever generator you used, copy the **Tag URL** field — this already includes the person's or listing's unique security token.
2. Open NFC Tools on your phone → **Write** → **Add a record** → **URL**.
3. Paste the Tag URL exactly as copied. Do not use the plain folder link — the token only exists in the Tag URL.
4. Write the tag, then **test it before locking** — tap it with both an iPhone and an Android phone if you can.
5. **Only lock person tags.** Leave property tags unlocked — an unlocked tag can be wiped and reused for the next listing once one sells.

---

## 8. Refreshing Existing Cards After an Engine Update

Any change to `person-template/index.html` or `property-template/index.html` only affects *new* folders automatically — existing ones need to be refreshed manually.

1. Confirm exactly which folders need the update — don't guess. If any folder name is ambiguous (a business name instead of a person, a folder you're not sure is even live), ask before including it.
2. Use Cowork (Claude Desktop) with an explicit prompt: name every folder individually, explicitly exclude `assets/` and the root-level `.html` tools, and require it to preserve each folder's `data.json` and photos untouched — only replace `index.html`.
3. Spot-check 2–3 results afterward, especially any folder with a lot of custom data (Payments, Listings, About) — that's where a mismatch would most likely show up.

---

## 9. Deploying Changes

1. Confirm every file that needs to move is sitting at your project's **root** — never nested inside a person or property folder.
2. `git add .`
3. `git commit -m "..."`
4. `git push`
5. Give Vercel about a minute, then check a live card to confirm.

---

## 10. Handling a Lost or Compromised Card

1. Open the generator for that person/listing, load their file.
2. Click **Generate New Token** — this instantly invalidates the old physical tag; anyone still holding it can no longer send a `[Verified]` update request.
3. Save/Download, copy the new Tag URL.
4. Get a new physical tag and write it with the new Tag URL — the old one is now permanently dead for verification purposes, even though the plain card page itself still loads.

---

## 11. Checking Whether an Update Request Is Real

Every "Contact / Support / Updates" email carries a tag — read it before acting on anything in the message.

- **`[Verified]`** — the request was sent using the actual physical tag's link, and its token matched what's on file. This is meaningful evidence the sender is who they claim to be, though not absolute proof (a screenshot or forwarded link could still carry a valid token).
- **`[UNVERIFIED]`** — the token is missing or didn't match. This could mean someone typed the plain URL from memory (a legitimate person being lazy) or someone who only knows the person's name trying their luck. Don't assume malice, but don't skip verification either.
- **No tag at all** — this person's card predates the token system, or their tag was never reissued. Neither `[Verified]` nor `[UNVERIFIED]` applies; fall back to manual judgment.

**Regardless of the tag**, for any request touching **payment information specifically**, verify out-of-band (text or call) before making the change — the tag is a helpful signal, not a substitute for that check.

---

## 12. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Card shows only the raw skeleton (no styling) | `assets/` folder missing from the repo | Confirm `assets/style.css`, `app.js`, `property.js` are pushed |
| 404 on a person's page | Folder name capitalized, or `Index.html` instead of `index.html` | Vercel is case-sensitive — check exact casing |
| Photo doesn't load on the live site | Missing trailing slash on the URL | Folder URLs need a trailing `/` |
| Card looks empty despite a filled-in `data.json` | Wrong template used — person data loaded into `property-template/index.html` or vice versa | Re-copy the correct matching template |
| "Need to update" email has no `[Verified]`/`[UNVERIFIED]` tag | This card predates the token system | Reissue the tag per §10 if you want it covered |
| Generator's Save button doesn't appear | Either: on mobile or a desktop browser other than Chrome/Edge, where the underlying feature doesn't exist at all — or nothing was loaded via Load first, so there's no file to save back to | Use Download instead (see §15 for which tools this affects), or Load a file first |

---

## 13. Weekly Checklist

- [ ] Update `PROJECT-NOTES.md` with anything built or changed this week
- [ ] Update `project-file-map.html` if any file was added, removed, or renamed
- [ ] Update this manual if a new task type came up that isn't covered yet
- [ ] Skim recent "Contact / Support / Updates" emails — confirm none were missed or left unactioned
- [ ] Spot-check one live card end-to-end (tap, save contact, share info) to confirm nothing silently broke
- [ ] Confirm the domain and any business `brands/` files are still accurate

---

## 14. Understanding the Card's Buttons

The bottom of every person card has six buttons, split into two columns. This section is the "why," not a task — read it once to understand the intent, then the buttons themselves should be self-explanatory.

**"For You" (left column) — built for whoever's looking at the card, not its owner:**
- **Save to Contacts** — the obvious one. Downloads a vCard.
- **Share Your Info** — a visitor sends *their own* info back to the card owner. This only appears if the owner has a phone or email on file to receive it.
- **Save as PDF** — a printable copy of the whole card, for someone who wants a portable record beyond just tapping again later.

**"[Owner's Initials]'s Tools" (right column) — built for the person whose card it is, not the visitor:**
- **Collect Info** — the owner's own shortcut. Shows a QR that skips straight to the Share Your Info screen, bypassing the rest of the card entirely. The actual use case: you're in a crowd (after a talk, at a networking event) and want several people to hand you their info quickly without each of them scrolling past your whole profile — or someone's phone has NFC scanning turned off, and a QR is the only path that works for them at all.
- **Scan a Card** — the reverse direction: *you* scan a physical business card someone hands *you*, and it sends the extracted info to your own email or phone. Deliberately requires a quick review before sending (name always has to be typed in manually) — OCR gets phone numbers and emails right most of the time, names almost never.
- **Refer a Friend** — technically usable by anyone viewing the card, but realistically this is for the people you've already given a card to, so they can pass the idea along themselves. Don't expect to use this one on your own cards much — it's built for your clients, not for you.

**Why the owner's initials sit above that column instead of a generic "Your Tools" label:** a stranger scanning someone else's card needs to immediately understand that column isn't meant for them. "Jane's Tools" or "JD's Tools" reads as *hers*, not a generic app menu — a small wording choice that does a lot of the disambiguating work on its own.

**If you're ever unsure whether a new button belongs in the visitor column or the owner column**, the test that's been used so far: would a stranger tapping this card for the first time ever plausibly want to click it? If yes, it's a visitor button. If the honest answer is "only the card's actual owner would ever use this," it belongs in the owner's column — regardless of who's technically capable of clicking it.

---

## 15. Device Compatibility — What Works Where

Every tool in this project is a plain web page, so all of them technically *open* on a phone or tablet browser. The real question is whether they behave identically to desktop — three don't, because of one specific browser limitation: mobile browsers, Chrome included, don't support the File System Access API (the thing that makes the **Save** button and Bulk Generator's direct folder-writing possible). This isn't a "some phones" limitation — it's every mobile browser, on every platform, full stop.

**Identical everywhere, no compromises:**
- `my-contact-info-form.html`
- `property-intake-form.html`

Plain forms, `mailto:` links — nothing in either one depends on the missing feature.

**Works on mobile, but loses one convenience:**
- `generator.html`
- `property-generator.html`
- `brand-generator.html`

The **Save** button (writing straight back to a loaded file) doesn't work on mobile — falls back to **Download**, same end result, just one extra manual step (moving the downloaded file into place) that desktop skips. Everything else, including Preview and the branded-preview fetch, works identically. The **Scan a Card** / **Scan a Business Card** camera feature actually works *better* on mobile, since it opens your phone's real camera directly.

**Effectively desktop-only:**
- `bulk-generator.html`

Its entire purpose — writing many folders directly into your project via a folder picker — needs the same missing feature, and there's no fallback path the way there is for Save. On mobile, clicking **Create Folders** just fails. If you need to bulk-import a roster while away from your desktop, it has to wait.

---

## 16. Organizing a Realtor Team's Folders

Use this any time a realtor has (or might grow) a team — not just a single agent with a single listing. Flat, root-level folders work fine for a one-off card, but get messy fast once a team and their listings start multiplying.

**The pattern: agency → person → that person's listings, nested three deep.**

```
your-project/
├── the-real-estate-co/              ← the agency itself, matches the brand slug
│   ├── angela-hanks/                ← one agent, a peer within the agency
│   │   ├── index.html
│   │   ├── data.json
│   │   ├── photo.jpg
│   │   ├── 4098-charlie-harris-rd/  ← her listing, nested under her
│   │   │   ├── index.html
│   │   │   └── data.json
│   │   └── another-listing/
│   └── another-agent/               ← a second agent, peer to Angela
│       ├── index.html
│       ├── data.json
│       └── their-listings/
```

**Why the agency sits at the top, not the team lead's name.** A teammate isn't "inside" the broker-owner's own folder — that would model the relationship as personal ownership when it's really shared agency membership. Everyone who works for the same agency is a peer underneath that agency's own folder, whether they're the owner or a brand-new agent.

**Why each person's listings nest under *them* specifically, not the agency directly.** It keeps clear, at a glance, whose listing is whose — and it means the top-level agency folder only ever contains people, never a mix of people and properties.

1. Create the agency folder first, named to match its brand slug from `brand-generator.html`.
2. Inside it, one folder per person, built the normal way (§1).
3. Inside each person's folder, one folder per listing they personally hold, built the normal way (§2) — just physically located one level deeper than usual.
4. The Tag URL for anything nested this way is longer than a flat one — e.g. `blackhatcards.community/the-real-estate-co/angela-hanks/4098-charlie-harris-rd/` — but nothing else about writing or testing the tag changes.
5. If that agent's own card has a `listings` field pointing at their properties, make sure those URLs match the full nested path — not the flat, unnested one generator tools might suggest by default.

**Do this before any physical tags exist for that team**, if at all possible — moving folders and fixing the URLs inside them afterward is real cleanup work; doing it before anything's written to a chip costs almost nothing.
