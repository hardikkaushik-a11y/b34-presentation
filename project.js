/* ============================================================
   B-34 PROJECT CONFIGURATION
   Edit this file to update the presentation. No code changes needed.

   - rooms[].plan  : x, y, w, d in metres, taken from the R3 layout drawing
   - rooms[].shots : filenames in assets/renders/
   - To move a render to a different room, cut its filename from one
     shots array and paste it into another. That is the whole process.
   ============================================================ */

window.PROJECT = {

  meta: {
    title:        "B-34",
    subtitle:     "Dwarka, New Delhi",
    projectType:  "Residential Interior Fit-Out",
    client:       "Private client",
    practice:     "Studio Spindle",
    architect:    "Ar. Shivangi Kaushik",
    drawingRef:   "ALD-01  ·  Plan / Layout",
    revision:     "R3",
    revisionDate: "05.08.2026",
    scale:        "1:75 @ A3",
    contact:      "studiospindle",
    address:      "Dwarka, New Delhi"
  },

  // Warm cream / brass palette taken from the project's own renders
  theme: {
    bg:        "#14110E",
    surface:   "#1D1915",
    panel:     "#262019",
    line:      "#3A3129",
    text:      "#F2EDE4",
    textDim:   "#A2978A",
    accent:    "#C9A227",
    accentSoft:"#E8D9A8"
  },

  ceilingHeight: 3.05,

  /* Rooms. `plan` is metres from the drawing.
     `group` controls 3D colour: living / sleeping / service / open */
  rooms: [
    { id:"living",  name:"Living Room",     group:"living",
      dims:"11'-9\" x 12'-8\"",  plan:{x:3.60,y:5.33,w:3.58,d:3.86},
      note:"Two 4-seater sofas, nesting centre table, TV unit, bench.",
      shots:[] },

    { id:"dining",  name:"Dining",          group:"living",
      dims:"-",                   plan:{x:3.60,y:2.74,w:3.58,d:2.59},
      note:"Six-seat dining, open to living and kitchen.",
      shots:[] },

    { id:"kitchen", name:"Kitchen",         group:"service",
      dims:"-",                   plan:{x:3.60,y:0.00,w:4.27,d:2.74},
      note:"LG 650L side-by-side refrigerator, dishwasher, OTG, hob.",
      shots:[] },

    { id:"store",   name:"Store",           group:"service",
      dims:"-",                   plan:{x:7.87,y:0.00,w:1.52,d:1.52},
      note:"Dry store off the kitchen.", shots:[] },

    { id:"lobby",   name:"Lobby",           group:"open",
      dims:"-",                   plan:{x:7.18,y:5.33,w:2.74,d:3.86},
      note:"Central circulation connecting all bedrooms.", shots:[] },

    { id:"balcony", name:"Balcony",         group:"open",
      dims:"-",                   plan:{x:0.00,y:9.19,w:6.10,d:1.83},
      note:"Runs the width of the living room and Bedroom 1.", shots:[] },

    { id:"master",  name:"Master Bedroom",  group:"sleeping",
      dims:"11'-0\" x 14'-0\"",   plan:{x:10.21,y:9.19,w:3.35,d:4.27},
      glb:"master.glb",
      note:"Channel-tufted headboard with concealed cove lighting, "+
           "full-height cream lacquer wardrobe with brass handles, "+
           "marble-top dresser and arched mirror. 6'-0\" x 6'-0\" bed.",
      shots:["r00.jpg","r01.jpg","r03.jpg","r04.jpg","r05.jpg","r06.jpg","r02.jpg","r07.jpg"] },

    { id:"bed2",    name:"Bedroom 2",       group:"sleeping",
      dims:"11'-0\" x 14'-9½\"",  plan:{x:10.21,y:4.33,w:3.35,d:4.50},
      glb:"bed2.glb",
      note:"Arched marble headboard niche, upholstered bench at the foot "+
           "of the bed, dressing table. 6'-0\" x 6'-0\" bed.",
      shots:["r11.jpg","r10.jpg","r08.jpg","r09.jpg","r16.jpg"] },

    { id:"bed3",    name:"Bedroom 3",       group:"sleeping",
      dims:"9'-11½\" x 12'-8\"",  plan:{x:7.18,y:10.41,w:3.03,d:3.86},
      glb:"bed3.glb",
      note:"Sculpted wave wall panel with concealed LED, charcoal bedding, "+
           "study desk with floating shelves, timber flooring. 6'-0\" x 6'-3\" bed.",
      shots:["r14.jpg","r13.jpg","r18.jpg","r17.jpg","r12.jpg"] },

    { id:"bed1",    name:"Bedroom 1",       group:"sleeping",
      dims:"9'-11\" x 13'-9\"",   plan:{x:0.00,y:1.00,w:3.02,d:4.19},
      glb:"bed1.glb",
      note:"Tan upholstered headboard, fluted wardrobe with brass inlay "+
           "handles, walnut display joinery and floating desk.",
      shots:["r22.jpg","r23.jpg","r20.jpg","r21.jpg","r15.jpg"] },

    { id:"wiw",     name:"Walk-in Wardrobe",group:"service",
      dims:"-",                   plan:{x:0.00,y:5.19,w:1.83,d:1.37},
      note:"Off Bedroom 1, adjacent to TLT 1.", shots:[] },

    { id:"tlt1",    name:"Toilet 1",        group:"service",
      dims:"-", plan:{x:1.83,y:5.19,w:1.37,d:1.37}, note:"", shots:[] },
    { id:"tlt2",    name:"Toilet 2",        group:"service",
      dims:"-", plan:{x:13.56,y:6.83,w:1.52,d:2.00}, note:"Ensuite to Bedroom 2.", shots:[] },
    { id:"tlt3",    name:"Toilet 3",        group:"service",
      dims:"-", plan:{x:13.56,y:11.35,w:1.52,d:2.11}, note:"Ensuite to Master Bedroom.", shots:[] },
    { id:"tlt4",    name:"Toilet 4",        group:"service",
      dims:"-", plan:{x:7.18,y:9.19,w:1.37,d:1.22}, note:"Common, off the lobby.", shots:["r19.jpg"] }
  ],

  /* Presentation mode slide order. Use room ids. */
  slideOrder: ["master","bed2","bed3","bed1"],

  floorplanImage: "assets/floorplan.png",
  /* The half of the flat that was never modelled: living, dining, kitchen, store,
     lobby, balcony, wardrobe and the four toilets. Built from ALD-01 by
     build/build_shell.py as one envelope with single partitions and real door gaps,
     so it walks as one connected space. Positions are the plan's; appearance is not
     designed yet and is deliberately bare. */
  wholeFlat: {
    id: "shell", glb: "shell.glb", name: "The Whole Flat", group: "walk through",
    rooms: [
      { id:"living",  name:"Living Room",      x:3.60, y:5.33, w:3.58, d:3.86 },
      { id:"dining",  name:"Dining",           x:3.60, y:2.74, w:3.58, d:2.59 },
      { id:"kitchen", name:"Kitchen",          x:3.60, y:0.00, w:4.27, d:2.74 },
      { id:"store",   name:"Store",            x:7.87, y:0.00, w:1.52, d:1.52 },
      { id:"lobby",   name:"Lobby",            x:7.18, y:5.33, w:2.74, d:3.86 },
      { id:"balcony", name:"Balcony",          x:0.00, y:9.19, w:6.10, d:1.83 },
      { id:"wiw",     name:"Walk-in Wardrobe", x:0.00, y:5.19, w:1.83, d:1.37 },
      { id:"tlt1",    name:"Toilet 1",         x:1.83, y:5.19, w:1.37, d:1.37 },
      { id:"tlt2",    name:"Toilet 2",         x:13.56,y:6.83, w:1.52, d:2.00 },
      { id:"tlt3",    name:"Toilet 3",         x:13.56,y:11.35,w:1.52, d:2.11 },
      { id:"tlt4",    name:"Toilet 4",         x:7.18, y:9.19, w:1.37, d:1.22 }
    ]
  },

  renderPath:     "assets/renders/",
  tourPath:       "assets/tour/",
  roomPath:       "assets/rooms/"
};
