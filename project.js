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
      dims:"-", plan:{x:13.56,y:11.35,w:1.52,d:2.11},
      note:"Ensuite to the Master Bedroom. Wet room: large-format beige veined "+
           "marble to all walls, terrazzo counter, sill and shower threshold, "+
           "walnut floating vanity with a vessel basin and backlit mirror, "+
           "wall-hung WC, frameless glass screen and a ceiling rain shower at "+
           "the window end.",
      shots:["r24.jpg","r25.jpg","r26.jpg","r27.jpg"] },
    { id:"tlt4",    name:"Toilet 4",        group:"service",
      dims:"-", plan:{x:7.18,y:9.19,w:1.37,d:1.22}, note:"Common, off the lobby.", shots:["r19.jpg"] }
  ],

  /* Presentation mode slide order. Use room ids. */
  slideOrder: ["master","bed2","bed3","bed1"],

  floorplanImage: "assets/floorplan.png",

  /* Exact ALD-01 drawing used by the interactive overview. The coordinates below
     are traced over the apartment-only crop, so the drawing remains the visual
     source of truth while the regions provide room selection and camera focus. */
  overviewPlan: {
    image: "assets/floorplan-3d.jpg",
    width: 15.0,
    depth: 13.01,
    sourceWidth: 1740,
    sourceHeight: 1509,
    regions: [
      {id:"balcony", poly:[[12,10],[755,10],[755,405],[610,405],[610,322],[265,322],[265,440],[12,440]], label:[420,185]},
      {id:"bed3",   poly:[[770,80],[1110,80],[1110,445],[770,445]], label:[930,235]},
      {id:"master", poly:[[1112,132],[1692,132],[1692,648],[1112,648]], label:[1390,385]},
      {id:"tlt3",   poly:[[1345,505],[1720,505],[1720,760],[1345,760]], label:[1580,660]},
      {id:"tlt4",   poly:[[610,405],[770,405],[770,575],[610,575]], label:[684,490]},
      {id:"lobby",  poly:[[770,445],[1112,445],[1112,724],[770,724]], label:[930,575]},
      {id:"tlt2",   poly:[[1345,735],[1720,735],[1720,920],[1345,920]], label:[1580,840]},
      {id:"bed2",   poly:[[1112,650],[1505,650],[1505,1082],[1112,1082]], label:[1315,920]},
      {id:"dining", poly:[[610,700],[1112,700],[1112,1082],[610,1082]], label:[870,865]},
      {id:"kitchen",poly:[[430,1060],[1125,1060],[1125,1435],[430,1435]], label:[825,1280]},
      {id:"store",  poly:[[350,1120],[610,1120],[610,1415],[350,1415]], label:[485,1310]},
      {id:"living", poly:[[180,322],[610,322],[610,1060],[180,1060]], label:[410,720]},
      {id:"wiw",    poly:[[12,405],[170,405],[170,735],[12,735]], label:[82,585]},
      {id:"tlt1",   poly:[[170,405],[300,405],[300,735],[170,735]], label:[235,585]},
      {id:"bed1",   poly:[[12,735],[300,735],[300,1405],[12,1405]], label:[155,1090]}
    ]
  },
  /* The half of the flat that was never modelled: living, dining, kitchen, store,
     lobby, balcony, wardrobe and the four toilets. Built from ALD-01 by
     build/build_shell.py as one envelope with single partitions and real door gaps,
     so it walks as one connected space. Positions are the plan's; appearance is not
     designed yet and is deliberately bare. */
  /* The whole flat, rebuilt from ALD-01 after the first attempt got the arrangement
     wrong. The dining sits BESIDE the living room, not under it, and it is not a room -
     it is a table standing in the circulation. The lobby is a hub: Bedroom 3, the
     Master and Bedroom 2 all open directly off it, and Toilet 4 faces the Master across
     it. The balcony runs along the top and serves both the living room and Bedroom 3.
     Corrected against a photograph of the lobby and the architect's own description.
     Built by build/build_shell.py, navigation grid by build/shell_nav.py:
     90.0 of 90.1 m2 walkable is reachable from the lobby, so it walks as one space. */
  wholeFlat: {
    id: "shell", glb: "flat.glb", name: "The Whole Flat", group: "walk through",
    rooms: [
      { id:"bed1", name:"Bedroom 1", x:0.000, y:0.900, w:3.023, d:4.191 },
      { id:"wiw", name:"Wiw", x:0.000, y:5.091, w:1.830, d:1.510 },
      { id:"tlt1", name:"Tlt 1", x:1.830, y:5.091, w:1.193, d:1.510 },
      { id:"entry", name:"Entry", x:3.023, y:0.000, w:1.500, d:2.740 },
      { id:"store", name:"Store", x:4.523, y:0.000, w:1.200, d:2.740 },
      { id:"kitchen", name:"Kitchen", x:5.723, y:0.000, w:2.800, d:2.740 },
      { id:"living", name:"Living Room", x:3.023, y:2.740, w:3.581, d:3.861 },
      { id:"balcony", name:"Balcony", x:0.000, y:6.601, w:6.686, d:1.830 },
      { id:"dining", name:"Dining (open)", x:6.604, y:2.740, w:3.117, d:1.460 },
      { id:"lobby", name:"Lobby", x:7.974, y:4.200, w:1.747, d:2.401 },
      { id:"tlt4", name:"Tlt 4", x:6.604, y:4.200, w:1.370, d:2.401 },
      { id:"bed3", name:"Bedroom 3", x:6.686, y:6.601, w:3.035, d:3.861 },
      { id:"master", name:"Master", x:9.721, y:5.540, w:3.353, d:4.267 },
      { id:"bed2", name:"Bedroom 2", x:9.721, y:1.032, w:3.353, d:4.508 },
      { id:"tlt3", name:"Tlt 3", x:13.074, y:5.540, w:1.520, d:2.110 },
      { id:"tlt2", name:"Tlt 2", x:13.074, y:3.440, w:1.520, d:2.100 }
    ]
  },

  renderPath:     "assets/renders/",
  tourPath:       "assets/tour/",
  roomPath:       "assets/rooms/"
};
