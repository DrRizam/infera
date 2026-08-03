# Archived content

Banks in this folder are **not loaded by the app**. The content loader globs
`../banks/*.json` only, so nothing here is bundled — that keeps placeholder
material out of the payload as well as out of the UI.

## Why these are here

`shoulder.json` (32 items) and `lumbar.json` (18 items) are the original
prototype content, written before the citation pipeline existed. Every item
carries a placeholder citation — *"UNVERIFIED — prototype draft; citation
pending clinical review"* — rather than a real source.

They were pulled from the pilot because half a library of "citation pending"
does more damage to a clinician's trust than a smaller, fully-sourced library
does. The app's whole claim is that every number has a source behind it.

## What to do with them

They are a decent source of *question ideas*. The intended path is to rewrite
them as properly-cited items in new `banks/*.json` batches, not to restore
them wholesale.

To restore one anyway: move the file back into `banks/` and set its `status`
to `"active"` (or remove the field).
