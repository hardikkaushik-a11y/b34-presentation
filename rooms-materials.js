/* Colour substitutions for materials that came out of SketchUp as placeholders.
   Anything whose look lived only in V-Ray exports as a checker swatch in a random
   pastel, so GOLD METAL arrives lavender and GREY FABRIC arrives green.
   build/fbx_optimise.py drops those maps; these values replace them, read off
   Ar. Shivangi Kaushik's renders.

   Values are pixel samples taken out of the renders with build/sample_renders.py and
   then divided by 1.68, which is how much the walkthrough's lighting lifts a surface.
   Feeding in the lit colour directly made every room render pale and flat, because it
   forced the lighting down to nothing. This way the rig keeps its window light, its
   shadows and its warm floor bounce, and a lit surface still lands on the render's
   colour. Re-measure the factor if you change the lighting in index.html.

   `rooms` wins over `common`, and matches the material name EXACTLY.
   `common` matches a lowercased substring, first hit wins, and is only applied to
   materials that have no texture left.

   To find the name of whatever you are looking at, stand in the room and run:
     const r=new THREE.Raycaster();
     r.setFromCamera(new THREE.Vector2(0,0),wcam);
     r.intersectObject(wscene,true)[0].object.material.name             */

window.ROOMMAT = {

  /* ---- exact, per room. Identified by where the geometry actually sits. ---- */
  rooms: {
    master: {
      // sampled from r00: headboard 5.6-6.3, wall 2.2-3.8, wardrobe 3.0-6.0, dresser 7.2-8.8
      "GREY_FABRIC_1"       : { color:0x80735C, rough:0.84 },   // channel tufted headboard
      "Two_Sided"           : { color:0x847D73, rough:0.90 },   // curtains, r01
      "wall"                : { color:0xA09C92, rough:0.90 },
      // the real wall, ceiling and floating nightstands here. SketchUp left it #5c5c5c
      "ChenZc_210512_JRI58" : { color:0xA09C92, rough:0.90 },
      "Generic_1"           : { color:0xAFAAA0, rough:0.52 },   // wardrobe fronts, r00
      "M_0136_Charcoal"     : { color:0xFFF4E4, rough:0.40, emissive:0xFFDFAE, glow:0.55 },
      "Emissive_1"          : { color:0xFFF0DA, rough:0.85, emissive:0xFFD69A, glow:0.90 },
      "Chrome_Polished_1"   : { color:0xC9CED2, rough:0.06, metal:true },
      "Plastic_Leather_C01_Black_10cm": { color:0x1F1C19, rough:0.46 }
    },
    bed2: {
      "GREY_FABRIC_1"       : { color:0x9A958D, rough:0.84 },   // low headboard, r11
      "wall"                : { color:0x9D978D, rough:0.90 },
      "M_0136_Charcoal"     : { color:0xFFF4E4, rough:0.40, emissive:0xFFDFAE, glow:0.55 },
      "Emissive_1"          : { color:0xFFF0DA, rough:0.85, emissive:0xFFD69A, glow:0.90 },
      "fluted_glass"        : { color:0xA9AFAF, rough:0.22 },
      "Plastic_Leather_C01_Black_10cm": { color:0x1F1C19, rough:0.46 }
    },
    bed3: {
      // sampled from r14
      "GREY_FABRIC_1"       : { color:0x777164, rough:0.84 },   // headboard and bed
      "Two_Sided"           : { color:0x787568, rough:0.90 },   // curtain wall
      "wall"                : { color:0x928D83, rough:0.90 },
      "Generic1_3"          : { color:0x9B968C, rough:0.55 },   // wave wardrobe fronts
      "Generic1_1"          : { color:0xAAA49A, rough:0.60 },   // floating nightstands
      "M_0136_Charcoal"     : { color:0xFFF4E4, rough:0.40, emissive:0xFFDFAE, glow:0.55 },
      "Emissive_1"          : { color:0xFFF0DA, rough:0.85, emissive:0xFFD69A, glow:0.90 },
      "Plastic_Leather_C01_Black_10cm": { color:0x1F1C19, rough:0.46 }
    },
    bed1: {
      // sampled from r22
      "GREY_FABRIC_7"       : { color:0x776957, rough:0.84 },   // fluted slat wall
      "GREY_FABRIC_2"       : { color:0x9F9585, rough:0.84 },   // cushion headboard
      "_25"                 : { color:0xA29B92, rough:0.90 },   // wall planes
      "_1"                  : { color:0xA29B92, rough:0.90 },
      "hubsmart"            : { color:0xA29B92, rough:0.90 },
      "M_0136_Charcoal"     : { color:0xFFF4E4, rough:0.40, emissive:0xFFDFAE, glow:0.55 },
      "Emissive_1"          : { color:0xFFF0DA, rough:0.85, emissive:0xFFD69A, glow:0.90 },
      "Plastic_Leather_C01_Black_10cm": { color:0x1F1C19, rough:0.46 }
    }
  },

  /* ---- fallback, matched on a substring of the lowercased name ---- */
  common: [
    { match:"gold_metal",        color:0xB08C4E, rough:0.30, metal:true  },
    { match:"gold",              color:0xB08C4E, rough:0.30, metal:true  },
    { match:"brass",             color:0xB08C4E, rough:0.30, metal:true  },
    { match:"bronze",            color:0x8A6A3E, rough:0.36, metal:true  },
    { match:"chrome",            color:0xC6CACE, rough:0.14, metal:true  },
    { match:"aluminum_polished", color:0xBFC3C7, rough:0.18, metal:true  },
    { match:"aluminum",          color:0xA8A8A4, rough:0.34, metal:true  },
    { match:"espelho",           color:0xC9CED2, rough:0.05, metal:true  },
    { match:"mirror",            color:0xC9CED2, rough:0.05, metal:true  },
    { match:"glass",             color:0xA1A7AA, rough:0.10 },
    { match:"grey_fabric",       color:0x7B7468, rough:0.84 },
    { match:"fabric",            color:0x766E64, rough:0.84 },
    { match:"two_sided",         color:0x817B70, rough:0.90 },
    { match:"leather",           color:0x1A1815, rough:0.46 },
    { match:"emissive",          color:0xFFF0DA, rough:0.85, emissive:0xFFD69A, glow:0.90 },
    { match:"candle",            color:0xC0B7A8, rough:0.80 },
    { match:"plain_white",       color:0xBEBAB3, rough:0.84 },
    { match:"plain_natural",     color:0xACA598, rough:0.86 },
    { match:"sheer",             color:0xB9B6AE, rough:0.92 },
    { match:"curtain",           color:0xA69F93, rough:0.90 },
    { match:"rubber",            color:0x211F1D, rough:0.80 },
    { match:"laminate",          color:0x1F1D1A, rough:0.42 },
    /* the generic wall and ceiling paint. SketchUp left this flat grey because the
       finish was a V-Ray material, and it covers more surface than anything else. */
    { match:"wall",              color:0x9D978D, rough:0.90 },
    { match:"ceiling",           color:0xA49F96, rough:0.92 }
  ]
};
