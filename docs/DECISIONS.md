# Decisions

Product and technical decisions, with why they were made. Add new ones at the end with the next number. When a decision is replaced, mark it **Superseded** and link the one that replaced it; don't delete it.

The roadmap keeps a short list of the same decisions as ADRs; this file holds the reasoning.

| # | Decision | Date | Status |
| --- | --- | --- | --- |
| 1 | [A personal app, not a workplace tool](#1-a-personal-app-not-a-workplace-tool) | 2026-09-24 | Accepted |
| 2 | [Web first, phones straight after](#2-web-first-phones-straight-after) | 2026-09-24 | Accepted |
| 3 | [Suggestions, never automatic actions](#3-suggestions-never-automatic-actions) | 2026-09-24 | Accepted |
| 4 | [Memories stay inside the chat they came from](#4-memories-stay-inside-the-chat-they-came-from) | 2026-09-24 | Accepted |
| 5 | [Full motion for everyone, for now](#5-full-motion-for-everyone-for-now) | 2026-09-24 | Accepted, revisit before launch |
| 6 | [Every chat end-to-end encrypted, smart features on the device](#6-every-chat-end-to-end-encrypted-smart-features-on-the-device) | 2026-09-25 | Accepted |
| 7 | [MLS through OpenMLS on every client](#7-mls-through-openmls-on-every-client) | 2026-09-25 | Accepted |
| 8 | [One Expo app for iPhone and Android](#8-one-expo-app-for-iphone-and-android) | 2026-09-25 | Accepted |
| 9 | [The phone app imports the web app's logic](#9-the-phone-app-imports-the-web-apps-logic) | 2026-09-25 | Accepted |
| 10 | [Encrypted local storage on every client](#10-encrypted-local-storage-on-every-client) | 2026-09-25 | Accepted |
| 11 | [No unread badge on the Chats tab](#11-no-unread-badge-on-the-chats-tab) | 2026-09-25 | Accepted |
| 12 | [Passkeys, Apple and Google sign-in](#12-passkeys-apple-and-google-sign-in) | 2026-09-24 | Superseded by 13 |
| 13 | [India first, sign in with a phone number](#13-india-first-sign-in-with-a-phone-number) | 2026-09-26 | Accepted |
| 14 | [Saved plans live in a pinned Up next bar](#14-saved-plans-live-in-a-pinned-up-next-bar) | 2026-09-26 | Accepted |

---

### 1. A personal app, not a workplace tool

**Decision:** Lynk is for friends, family, flatmates and clubs. Workspaces, five roles, audit logs, context capsules, the knowledge graph and the conversation map were cut or shrunk.
**Why:** the original spec made Lynk a workplace tool, a crowded market with different needs. Group chats among friends are where plans get lost.
**Consequences:** only two roles (group admin and member). Decisions became plans with RSVPs, action items became to-dos and shared lists.

### 2. Web first, phones straight after

**Decision:** build the messaging core on the web, then the phone apps immediately.
**Why:** the web was fastest to iterate on, and the protocol is generated for every client, so phones reuse the same server.
**Consequences:** personal chat happens on phones, so the phone app came early (decision 8).

### 3. Suggestions, never automatic actions

**Decision:** plan and to-do spotting only ever creates a suggestion card. Nothing is saved without a tap.
**Why:** a wrong automatic plan in a group chat is embarrassing and erodes trust. One tap to save, one tap to dismiss.
**Consequences:** every spotted item has `status: "proposed"` until someone confirms it.

### 4. Memories stay inside the chat they came from

**Decision:** a memory ("Mei is vegetarian") is visible only to that chat's members, disappears with its source message, and the person it's about can see and remove it.
**Why:** a fact said in one chat must never surface in a chat the person isn't in.
**Consequences:** no cross-chat memory in v1. "What Lynk remembers about you" on the profile lets people remove facts about themselves.

### 5. Full motion for everyone, for now

**Decision:** the OS "Reduce motion" setting is not honoured, by product decision.
**Why:** a product decision for the prototype: the motion is part of Lynk's character.
**Consequences:** this conflicts with WCAG 2.3.3. Revisit before launch. Recorded in `design-system/lynk/MASTER.md`.

### 6. Every chat end-to-end encrypted, smart features on the device

**Decision:** every chat is end-to-end encrypted, with no opt-out and no server-readable mode. Search, spotting, transcripts and translation run on each device. Replaces an earlier plan for "normal" and "private" chat modes.
**Why:** a private mode forces people to choose between smart and safe. Running the smart features on the device removes the choice.
**Consequences:** answers are weaker on older phones, and the server can't compute anything across devices. pgvector and server-side AI were dropped.

### 7. MLS through OpenMLS on every client

**Decision:** use MLS (RFC 9420) through OpenMLS: one Rust core, compiled to WASM for the web, with Swift and Kotlin bindings for phones.
**Why:** libsignal has no supported web build. MLS gives forward secrecy, post-compromise security and signed membership changes, from one implementation on every client.
**Consequences:** key transparency and security codes ship in phase 1. There will be no home-made crypto.

### 8. One Expo app for iPhone and Android

**Decision:** `apps/mobile` is a single Expo app. The planned `apps/ios` and `apps/android` folders are gone.
**Why:** one codebase, shared logic and design tokens with the web, and roughly half the mobile work of two native apps.
**Consequences:** native-only features (on-device transcripts, Apple Translation) need native modules added later. Config plugins handle platform setup (iOS 27 scene lifecycle).

### 9. The phone app imports the web app's logic

**Decision:** the phone app imports `apps/web/src/lib` through `@shared/*` and a Metro watch folder, instead of a separate `packages/` folder.
**Why:** it was the smallest step that guaranteed both apps behave the same, with no build step.
**Consequences:** shared modules must stay free of DOM and React Native APIs. Move them to `packages/` when the server's generated protocol arrives.

### 10. Encrypted local storage on every client

**Decision:** the phone app stores data in SQLCipher, keyed from 32 random bytes in the Keychain or Keystore (this device only). The web app encrypts IndexedDB with AES-256-GCM under a non-extractable WebCrypto key.
**Why:** end-to-end encryption means little if the device copy is readable as files.
**Consequences:** a lost key means the local copy is unreadable. Encrypted backups (decision 13) cover that once the server exists.

### 11. No unread badge on the Chats tab

**Decision:** the Chats tab has no badge. The unread count shows in the Chats header and on Catch up.
**Why:** iOS pins tab badges past the icon's corner, so "12" and even a dot overlapped the next tab's highlight. Apps can't move native tab badges.
**Consequences:** none beyond the missing badge. The count is visible in two places.

### 12. Passkeys, Apple and Google sign-in

**Status:** Superseded by [13](#13-india-first-sign-in-with-a-phone-number).
**Decision:** passkey first, then Continue with Apple and Google. No passwords.
**Why:** phishing-resistant and familiar in Western markets.

### 13. India first, sign in with a phone number

**Decision:** Lynk launches in India. You sign in with a phone number and a 6-digit texted code, with +91 as the default. Passkeys, Apple and Google are removed. Friends find you by @username and never see your number.
**Why:** in India the phone number is how people already identify themselves in chat apps. Three sign-in options made the first screen a decision.
**Consequences:** SIM swaps and recycled numbers become a risk, so a registration-lock PIN is planned. Backups are keyed from that PIN (through a rate-limited secure enclave) or a recovery code. OTP templates must be registered on TRAI's DLT system. SMS costs money and attracts fraud, so codes are rate-limited per number, device and network.

### 14. Saved plans live in a pinned Up next bar

**Decision:** every chat has a bar under its header with the next plan, who's going and what's still open. Tapping it opens a sheet (phones) or a drop-down (web) to RSVP, add the plan to a calendar, tick off to-dos and edit lists. The bar hides when nothing saved is still ahead.
**Why:** saved items lived only in chat details, so checking a plan meant leaving the conversation. Three options were compared: a strip on the chat list, a reworked Saved tab, and a bar inside the chat. The bar won because a plan belongs to its conversation.
**Consequences:** `upNext()` in the shared layer decides what counts, so both apps agree. Chat details still hold past plans, done to-dos and memories.
