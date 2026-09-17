# B-34 - Product goal and current truth

B-34 is a residential interior project in Dwarka, New Delhi by Ar. Shivangi Kaushik at Studio Spindle. This product lets the client understand the flat before construction through one browser link.

## Client experience

The public presentation must provide four layers without making the client choose between separate sites:

1. **Accurate 3D spatial plan** - the CAD-derived shell, used to understand layout and circulation.
2. **Exact 2D drawing** - the architect's ALD-01 plan, kept as the dimensional reference.
3. **Approved visual material** - render galleries for spaces that have been designed.
4. **Photoreal 360 tours** - V-Ray spherical panoramas for designed rooms, with deliberate arrival views and movement between capture points.

The presentation also includes a fullscreen render deck. A separate technical review page must not be exposed as a second client destination.

## Current design coverage

Designed visual material currently exists for:

- Master Bedroom and study extension
- Bedroom 1
- Bedroom 2
- Bedroom 3
- Toilet 3
- One Toilet 4 render

Bedroom 2 currently has the first client-ready V-Ray tour with two panorama positions.

The following spaces are spatially represented by the CAD shell but their interior design is still in progress:

- Living room
- Dining
- Kitchen
- Store
- Lobby and entrance
- Balcony
- Walk-in wardrobe
- Toilets without approved render coverage

Do not invent approved finishes, furniture or products for these areas. A neutral spatial shell is correct until the architect completes or approves the design.

## Future deliverables

### Photoreal room tours

Create 2 to 4 distinct V-Ray spherical panoramas per designed room, normally 4096 x 2048. The architect's V-Ray output is the authority for materials, lighting and colour. The web viewer supplies navigation and presentation only.

### Cinematic project film

Create a 30 to 60 second architecture film from approved room designs. Use real camera motion through the approved geometry, rendered as checkpointed image sequences. A panorama turn or slideshow is not a substitute for translational camera movement.

### Whole-flat walkthrough

Connect every designed area after living, dining, kitchen, lobby, balcony and remaining wet areas exist as approved models. Until then, the CAD shell can explain circulation but cannot honestly represent the finished interior.

### Product fidelity

Where the architect specifies a real product such as Jaquar sanitaryware, Kajaria tiles, appliances or lighting, use the manufacturer's exact model, dimensions, finish and texture when available. Keep product metadata beside the visual asset so substitutions remain traceable.

## Standard

- The drawing controls position and dimensions.
- The architect's approved renders and V-Ray files control appearance.
- Manufacturer data controls branded products.
- Unfinished design is labelled as in progress.
- One public link is the client entry point.
- Internal review tools remain available to the production team but stay out of the client flow.
