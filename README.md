# Datebook Expo prototype

Datebook is a private date-planning prototype for two people. This repository explores the native-mobile-shaped version using Expo and React Native, with Android as the first target.

The prototype is interactive rather than a set of screenshots. You can browse fake date ideas, filter them, open a full detail screen, shortlist up to three choices, assemble an invitation, choose a day, invoke the Android share sheet, add and edit curated listings, archive listings, and simulate connecting a Google account. All data is temporary and local to the running JavaScript process.

## Why Expo is being tested

Expo provides a fast route back into Android development without requiring Android Studio for the first round. React Native components become native views, the development server can send the bundle to Expo Go on a physical phone, and platform APIs can be introduced later through Expo modules or development builds.

This repository intentionally does not share source code with the sibling PWA prototype. The concepts and fake records match closely enough for comparison, but each implementation is allowed to feel natural on its platform. The Expo version uses a persistent bottom tab bar, modal editing, the Android back gesture, React Native layout, and the system share sheet.

## Run it on an Android phone

Requirements:

- Node.js 22.13 or newer (the minimum documented for Expo SDK 57)
- npm
- Expo Go installed from Google Play
- The computer and phone on the same local network

Install dependencies:

    npm install

Start the Expo development server:

    npm start

Expo prints a QR code. Open Expo Go on the phone and scan it. Changes to App.tsx or files under src should refresh the running app.

If the phone cannot reach the computer over the local network, try:

    npx expo start --tunnel

Tunnel mode uses an external relay and can be slower, but it avoids many router and firewall issues.

Android Studio is not required for this Expo Go prototype. It becomes useful when the project needs an emulator, custom native code, release diagnostics, or a local native build.

Useful checks:

    npm run typecheck
    npm run export:android

The export command produces a production JavaScript bundle for Android. It does not create an APK. APK/AAB generation would be a later EAS Build or native-build step after the prototype is selected.

## What to explore

### Discover tab

Discover is the private member’s starting point. The hero emphasizes the repeat action—planning the next date—rather than onboarding. Filters are horizontally scrollable because that pattern remains comfortable on a narrow phone. Each live idea can be opened or added directly to the current shortlist.

The catalogue mixes reusable ideas and a dated local event to test whether they can coexist in one discovery feed. They share presentation, but they should not become the same database entity in production. A venue can remain available indefinitely; an event occurrence needs a real start, end, timezone, source, and expiry policy.

### Detail screen

The detail screen temporarily replaces the tab layout, giving the selected idea an immersive image and focused call to action. The back control returns to Discover. Structured facts and tags sit below the persuasive description.

Add to invite updates selectedIds in the root App. Review invite changes the root tab to Our plan. The detail screen therefore contains no private copy of the shortlist; every screen sees the same selection.

### Our plan tab

Our plan resolves the selected IDs into current catalogue records. Removing an option updates Discover as well. The chosen day and personal note represent information attached to a future plan, not information attached to a venue.

Preview private invitation moves to a local success state. Share prototype link invokes React Native’s Share API, which should open the Android system share sheet. The displayed URL is fake and does not lead to a guest page.

A production version would create the plan on the backend first, receive a random invitation token, and share a real web URL. Even if the owner uses a native app, the recipient should be able to open an invitation in a browser without installing the app.

### Manage tab

Manage sketches the future private curator workflow. Counts summarize live ideas, local events, and drafts. Add opens a native modal containing a controlled form. Edit fills the same form from an existing record. Archive and Publish toggle whether an item appears in Discover.

The form deliberately focuses on information architecture rather than media handling. A newly created record receives the generic hero image and remains in memory only until reload. The future version needs image selection, upload progress, source URLs, timestamp inputs, validation, and clear draft/publish permissions.

### You tab

The profile tab shows the current product boundary: one private space with two people. Continue toggles a simulated Google identity. It does not invoke OAuth, store credentials, or contact Google.

Authentication and Google Calendar access should remain separate. Google sign-in proves identity. Calendar access would be an optional integration requested only when someone wants confirmed plans added automatically.

## How the files connect

The structure is deliberately modest:

    index.ts
      registers the root Expo component
        App.tsx
          owns navigation and cross-screen state
          imports fake data from src/data.ts
          imports domain shapes from src/types.ts
          renders React Native screens and modals

    app.json
      defines the Expo application name, Android package, icons, and orientation

    assets/dates
      holds the visual assets reused from the original fun_date experiment

### index.ts

This is the native entry point generated by Expo. registerRootComponent connects App to the Android activity created by Expo. Most product work should not need to touch this file.

### App.tsx

App is currently both the composition root and the prototype navigation coordinator. It owns state that must persist when tabs change:

- activeTab identifies the visible top-level destination.
- ideas is the mutable in-memory catalogue.
- selectedIds is the current invitation shortlist.
- selectedDay and inviteSent describe the invitation draft.
- detailId replaces the tab screen with a detail screen.
- editorVisible, editingId, and draft coordinate the curator modal.
- signedIn controls only the fake Google state.

The screen components accept data and callbacks. They do not import and mutate a global catalogue. For example, EditorModal reports the completed draft to App; App decides whether to insert a record or update one. This boundary prepares the code for later query and mutation hooks.

For a prototype, screen components and styles remain together so the entire interaction is easy to trace. If Expo is selected, the first cleanup should move screens, reusable controls, theme tokens, and state hooks into focused modules before adding backend complexity.

### src/types.ts

DateIdea is the central record shape. Its image uses React Native’s ImageSourcePropType, allowing bundled require calls today and remote image objects later. IdeaDraft contains only editable fields. AppTab and DateKind are unions so unsupported navigation and category strings produce TypeScript errors.

### src/data.ts

This is a fake data source. It exports the seed catalogue, suggested days, and blank editor state. Bundled images are resolved at build time with require. If the prototype advances, remote records should provide validated image URLs while a data-access hook maps database rows into the DateIdea shape expected by the screens.

### app.json

The Expo configuration supplies the display name and slug, locks the prototype to portrait orientation, configures icons, enables Android predictive back behavior, and assigns a placeholder Android application ID. A production app would use a final package name because changing it after store publication creates a different Android application.

### assets

The date artwork comes from the original fun_date repository. Bundling these images keeps the visual prototype independent of a network connection. The source files are much larger than phone cards require. A production pass should create appropriately sized WebP/AVIF or optimized PNG variants and use remote storage for curator uploads.

## State and event flow

    Seed catalogue in src/data.ts
                 |
                 v
          App ideas state <------ Editor modal and archive actions
                 |
         +-------+--------------------+
         |                            |
         v                            v
      Discover -----------------> selectedIds
                                      |
                                      v
                                Our plan tab
                                      |
                                      v
                         Local preview and Share API

The Profile screen is independent for now. Once authentication exists, the session will sit above catalogue queries because identity determines which private space and records may be loaded.

## Native behavior this prototype exercises

- React Native views, text, images, press targets, and scroll containers
- A persistent mobile bottom navigation pattern
- Modal create/edit presentation
- Android hardware or gesture dismissal for the editor modal
- Keyboard-aware form structure
- Android system sharing
- Bundled image resolution through Metro
- Expo Go development on a physical device

There is no navigation library yet. That keeps the first draft readable, but it also means screen history, deep links, and Android back behavior are incomplete. Expo Router would be a natural next step if this version wins.

## What is deliberately mocked

- Google sign-in
- User sessions and secure token storage
- Private spaces and membership
- Database reads and writes
- Image selection and upload
- A working guest invitation URL
- Notifications
- Calendar permissions and event creation
- Community feeds, RSS, or external event APIs
- Durable drafts after an app restart
- Authorization between the owner and guest

The app should not be treated as secure simply because it looks private. Real privacy begins with backend authorization rules and non-guessable invitation tokens.

## A sensible production path

If Expo is selected, the next work should be one thin backend-connected path rather than every feature at once:

1. Introduce Expo Router with Discover, plan, manage, profile, detail, and guest routes.
2. Add Supabase and platform-appropriate secure session storage.
3. Implement Google authentication with Android redirect/deep-link configuration.
4. Create profiles, private spaces, and memberships.
5. Load date ideas and event occurrences from authenticated queries.
6. Convert curator actions into validated inserts and updates.
7. Add image selection and Supabase Storage uploads.
8. Create plans, options, suggested times, and guest responses.
9. Host a small web guest surface for tokenized invitation links.
10. Add notifications and optional calendar integration after confirmation.

That small web guest surface matters even if Expo remains the primary app. Requiring a date recipient to install an application before answering a private invitation would introduce unnecessary friction.

## Suggested backend concepts

- profiles: application identity linked to an authenticated user
- spaces: a private planning area, initially used by two people
- space_members: owner/member roles and invitation lifecycle
- date_ideas: reusable curated locations and activities
- event_occurrences: dated community events with source and expiry metadata
- plans: proposed, confirmed, completed, or cancelled date plans
- plan_options: the shortlist offered to a guest
- suggested_times: proposed time windows stored as timezone-aware timestamps
- responses: guest choice, availability, and message
- media: uploaded asset ownership and storage paths
- device_tokens: opt-in notification destinations, added only when notifications exist

The UI can stay intimate and say “the two of us,” while the data model uses spaces and memberships so a later public product is not trapped by assumptions made during private testing.

## Prototype limitations worth noticing

- All state resets when Expo reloads.
- Suggested dates are display strings, not calculated timestamps.
- The invitation URL is fake.
- Google identity is simulated.
- The Android package name is provisional.
- New records always receive the same placeholder image.
- The app has no formal navigation history or deep linking.
- There is no server validation, authorization, or retry behavior.
- Large bundled images increase download and memory cost.
- Accessibility labels and dynamic type behavior need a dedicated audit.
- The prototype targets portrait phones and has not been designed for tablets.

## What to compare with the PWA

Perform the same sequence on the same Android phone:

1. Browse and filter date ideas.
2. Open a detail and add it to the shortlist.
3. Remove an option, choose a day, and preview the invitation.
4. Open the share sheet.
5. Add a fake local event and edit it.
6. Archive an item and confirm that Discover updates.
7. Simulate connecting Google.

Notice touch feedback, scroll momentum, image transitions, keyboard and modal behavior, bottom navigation, reload speed, and how much you miss having a wide desktop admin view. The goal is to select the development experience and product feel you want to live with, not merely the prototype with the prettiest first screen.
