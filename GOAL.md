# B-34 - What we are actually trying to build

A four-bedroom residential interior fit-out in Dwarka, New Delhi, designed by
Ar. Shivangi Kaushik at Studio Spindle. The design is finished and approved. Nothing
here designs anything - the job is to let people *experience* a flat that does not
exist yet.

---

## The goal

**Put the client inside his flat before it is built.**

A drawing asks someone to imagine a room. A render shows them one angle of it, chosen
by the architect. Neither lets them stand in the middle and turn around. That is the
gap this closes.

Two audiences, and they want different things:

- **The client** wants to walk through it himself, on his phone, from a link someone
  sent him. No app, no headset, no appointment.
- **The practice** wants a piece that shows the work instead of describing it - one
  link that stands on its own in a pitch, a portfolio, or a message.

---

## The standard

**Photoreal, not "3D".** The bar is that it reads as a photograph of a real room, not a
render of a model. If it looks like a 3D visualisation, it has failed - however
accurate the geometry is.

Concretely that means it has to match the architect's own renders. Her renders are the
authority on palette, materials, finishes and light. Everything built here is measured
against them rather than judged by eye: each room's panoramas sit within a few percent
of the median luminance of that room's own render set.

**Faithful, not reinterpreted.** The plan wins for position, the renders win for
appearance. Any deviation is an error, not a creative choice.

---

## The three deliverables

### 1. A photorealistic walkthrough video

A short film of the flat - 60 to 90 seconds, 1080p, built as separate takes joined by
cuts rather than one continuous wander. Eye-level camera, restrained pace, shots that
land on furniture and features and never linger on blank wall.

This is the piece you send to someone who will not click anything. It does the work for
them.

**Status: not built.** Everything so far has gone into the interactive pieces.

### 2. An interactive walkthrough

The client drives. Free first-person movement inside the real model, with collision so
you cannot walk through walls. Jump straight to any room without walking the route. A
floor-plan minimap so orientation is never lost. Runs in a normal phone browser.

This is the piece that answers "what is it actually like in there?"

**Status: built.** Walk mode, room navigation, plan view, minimap.

### 3. A 360 tour

Stand inside a path-traced panorama of the room and look anywhere. Step between
viewpoints by clicking markers on the floor, the way a Matterport or CloudPano tour
works. Each stop arrives facing something worth seeing.

This is the photoreal one. The walkthrough is the spatial one - it tells you how the
rooms connect and how big they feel. The tour tells you what it looks like. They are
different jobs and the page has both.

**Status: built.** 22 panoramas across four rooms, path-traced in Cycles.

---

## Where it stands, honestly

Live: https://hardikkaushik-a11y.github.io/b34-presentation/

**What works.** The interactive walkthrough and the 360 tour, across the Master Bedroom,
Bedroom 1, Bedroom 2 and Bedroom 3. Plus a 3D overview of the whole flat, the plan, a
client deck of the renders, and a set of coloured path-traced floor plans.

**What does not exist yet.**

- **The video.** Deliverable 1, not started.
- **Half the flat.** Only the four bedrooms are modelled. Living, dining, kitchen,
  store, lobby, balcony, walk-in wardrobe and the toilets have no model and no renders -
  and that is the half a visitor walks into first.
- **Proof it works on a phone.** The whole point is that the client opens this on his
  phone, and nobody has tried it on one yet. The site is 47 MB.

**The one place it is not 1:1.** The V-Ray shaders did not survive export from
SketchUp - materials that lived only in V-Ray arrived as missing-texture placeholders.
The palette was rebuilt by sampling the architect's renders directly. So: her geometry,
her palette, real path-traced bounce light, but not her original shaders. That closes
most of the gap, not all of it.

---

## Why it is built the way it is

Everything is a single folder of static files. No server, no build step, no framework,
no account. `index.html` opens straight from disk, or from any web host.

That is deliberate. This has to survive being emailed, handed over, opened in three
years, and opened by someone who will not install anything. A dependency is a thing that
breaks later.

See `README.md` for how it works and how to change it.
