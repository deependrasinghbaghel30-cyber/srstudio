# Ekadashi Heritage admin

Admin: `/ekadashi/admin.html`. Public shop: `/ekadashi/darbar/`.

## Current state

Mobile-installable panel with a local IndexedDB draft catalogue. The public Firebase web config is intentionally empty: no Ekadashi Firebase project or owner account was available in the connected repository or Vercel project. Drafts never update the shop and are not shared between devices. The screen explicitly labels this state. The existing Darbar website demo catalogue is imported into device drafts once, including its current prices and photo links. Existing draft edits are preserved; deleting a draft product does not re-import it on reopen. This does not import demo products into any live database. Each product has a direct Edit price button. Brand logo and maroon theme are locked.

Features: saree CRUD, price/MRP, availability, weave, fabric, occasions, dimensions, blouse, featured/hidden flags, ordered compressed photo uploads, website banner and collection photos, states/weaves, backup export and draft-only restore. Secure live sign-in, verified invitation binding, password reset/change and owner team controls are implemented but require backend activation and end-to-end testing. No credentials are in these files.

## Activate live mode

1. Use a dedicated Ekadashi Firebase project; do not connect SR Handicraft's product collections. Enable email/password Authentication, Firestore and Storage, reviewing any required provider billing first.
2. Add `srstudio-t59h.vercel.app` and the eventual shop domain to Authentication authorized domains.
3. Deploy the accompanying Firestore and Storage rules to that project. The first owner must be provisioned by a trusted project administrator: create the Auth user, verify their email, then set `admins/<lowercase-email>` to `{role: "owner", enabled: true, uid: "<matching-auth-uid>"}`. Owner identity is not inferred from an email entered on the public page.
4. Put only the public Firebase web config in `../admin-config.js`. Both storefronts read this same config. Keep service account credentials out of source and out of browser code.
5. In Firestore set `site/config` with `states` from `admin-defaults.mjs` and the initial `photos` map if desired. Review the inventory before activation: live products replace demo products, including when the collection is empty.
6. Verify owner login, a saved real product and its photos on the storefront, invited-editor verification, denied anonymous writes, denied self-invitation/role changes, revocation, and mobile installation. Test the rules with Firebase emulators before enabling live editing. The deployed draft does not exercise these cloud paths.

The catalogue, including entries hidden from navigation, is publicly readable. No private customer records, orders, payment data or internal notes belong in these collections. The panel does not include checkout or CRM. Backups from live mode contain photo URLs, not a storage-bucket export. Device drafts can be lost if browser data is cleared; download backups. Restoring a backup affects only local drafts. Team invitations are saved records; no invitation email is sent automatically.

The service worker caches only admin shell assets. It does not cache authenticated responses or database records. The shared Firebase config is network-only, and offline fallback disables live mode. The app uses the site's existing icons and logo files without changing them.
