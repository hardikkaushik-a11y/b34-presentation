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
      "fluted_glass"        : { color:0xA79D88, rough:0.46 }, // warm cream fluted wardrobe, r11-r13
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
  /* ---- generated: gaps filled from her own V-Ray materials ----
     Only materials the hand-tuned palette above never covered. Colours are
     her unlit albedo converted to sRGB and scaled by 0.808, measured from
     the materials present in both sets so the two sources sit on one scale.
     Regenerate with build/palette_from_vray.py. */
  vray: {
    master: {
      "Aluminum_Polished"                   : { color:0xC1C1C1, rough:0.04 },   // Aluminum_Polished
      "BEIGE_FLOORING"                      : { color:0xB9B5AE, rough:0.2 },   // BEIGE FLOORING
      "BEIGE_dunhil_grey"                   : { color:0xB9B5AE, rough:0.1 },   // BEIGE dunhil grey
      "ChenZc_210512_JRI17"                 : { color:0x9A8D7A, rough:0.04 },   // ChenZc-210512-JRI17
      "ChenZc_210512_JRI18"                 : { color:0x786048, rough:0.04 },   // ChenZc-210512-JRI18
      "ChenZc_210512_JRI19"                 : { color:0x6E5A41, rough:0.04 },   // ChenZc-210512-JRI19
      "ChenZc_210512_JRI25"                 : { color:0x000000, rough:0.04, opacity:0.3 },   // ChenZc-210512-JRI25
      "ChenZc_210512_JRI44"                 : { color:0x0C0C0C, rough:0.04 },   // ChenZc-210512-JRI44
      "ChenZc_210512_JRI45"                 : { color:0x5B5247, rough:0.04 },   // ChenZc-210512-JRI45
      "ChenZc_210512_JRI51"                 : { color:0x101010, rough:0.04 },   // ChenZc-210512-JRI51
      "ChenZc_210512_JRI57"                 : { color:0x959595, rough:0.04, opacity:0.3 },   // ChenZc-210512-JRI57
      "ChenZc_210512_JRI84"                 : { color:0x2F2C2C, rough:0.25 },   // ChenZc-210512-JRI84
      "GOLD_METAL"                          : { color:0xC6B7A8, rough:0.1 },   // GOLD METAL
      "GREY_FABRIC_9"                       : { color:0xB69232, rough:0.45 },   // GREY FABRIC#9
      "Generic"                             : { color:0x686868, rough:0.2 },   // Generic
      "Generic1"                            : { color:0xB7B3AC, rough:0.05 },   // Generic#1
      "Generic1_1"                          : { color:0xAAA59D, rough:0.2 },   // Generic1#1
      "Generic4"                            : { color:0x686868, rough:0.15 },   // Generic#4
      "Generic_3"                           : { color:0x96938E, rough:0.2 },   // Generic#3
      "Leather_White_01_30cm"               : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Maps_kisn_033"                       : { color:0xA4A19D, rough:0.25 },   // Maps_kisn_033
      "Material__0"                         : { color:0xAE4BA2, rough:0.04 },   // Material #0
      "Plain_White_Texture_2281256_44cm1"   : { color:0xC4C5C0, rough:0.04 },   // Plain White Texture 2281256 44cm1
      "Plain_White_Texture_2281256_44cm1_1" : { color:0xC4C5C0, rough:0.04 },   // Plain White Texture 2281256 44cm1#1
      "Plastic_Simple_Shiny_Black"          : { color:0xA8A8A8, rough:0.25 },   // Plastic_Simple_Shiny_Black
      "R192_G192_B192"                      : { color:0x9B9B9B, rough:0.04 },   // R192_G192_B192
      "THREAD_926F76CE_BF50_4c7a_A889_CF4CAA97EB5E_png3": { color:0x9C9C9C, rough:0.04 },   // THREAD-926F76CE-BF50-4c7a-A889-CF4CAA97EB5E.png3
      "WOOD1"                               : { color:0x62391B, rough:0.3 },   // WOOD1
      "WOOD1_1"                             : { color:0x62391B, rough:0.4 },   // WOOD1#1
      "WOOD1_2"                             : { color:0x62391B, rough:0.4 },   // WOOD1#2
      "_0043_SaddleBrown_1_1"               : { color:0x626262, rough:0.04 },   // [0043_SaddleBrown]1#1
      "_0136_Charcoal_3"                    : { color:0x181818, rough:0.25 },   // [0136_Charcoal]3
      "_12"                                 : { color:0x292929, rough:0.3 },   // *12
      "_Translucent_Glass_Gray_6"           : { color:0x676767, rough:0.04, opacity:0.3 },   // [Translucent Glass Gray]6
      "vray_ChenZc_200606_DCZ22"            : { color:0x676462, rough:0.04 },   // vray ChenZc-200606-DCZ22
    },
    bed1: {
      "Aluminum_Brushed_5cm_1"              : { color:0xAAA399, rough:0.38 },   // Aluminum_Brushed_5cm#1
      "Aluminum_Polished"                   : { color:0xC1C1C1, rough:0.04 },   // Aluminum_Polished
      "BEIGE_dunhil_grey"                   : { color:0xB9B5AE, rough:0.1 },   // BEIGE dunhil grey
      "ChenZc_190609_rt27"                  : { color:0x000000, rough:0.24 },   // ChenZc-190609-rt27
      "GOLD_METAL"                          : { color:0xB7AA9F, rough:0.1 },   // GOLD METAL
      "GREY_FABRIC_8"                       : { color:0xB69232, rough:0.45 },   // GREY FABRIC#8
      "Generic1_1"                          : { color:0xAAA59D, rough:0.15 },   // Generic1#1
      "Generic2"                            : { color:0x686868, rough:0.3 },   // Generic#2
      "Generic3"                            : { color:0x686868, rough:0.3 },   // Generic#3
      "Generic_1"                           : { color:0xA09D99, rough:0.04 },   // Generic#1
      "Generic_4"                           : { color:0xA8A39E, rough:0.04 },   // Generic#4
      "Generic_5"                           : { color:0x322B24, rough:0.04 },   // Generic#5
      "Glass_Frosted"                       : { color:0x000000, rough:0.25, opacity:0.34 },   // Glass_Frosted
      "Leather_White_01_30cm"               : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "M_1_logo_ch"                         : { color:0x72629D, rough:0.35 },   // 1_logo ch
      "Material1_1"                         : { color:0x706C67, rough:0.2 },   // Material1#1
      "Material__2"                         : { color:0x676767, rough:0.04 },   // Material__2
      "Material__2766776"                   : { color:0x020202, rough:0.04 },   // Material #2766776
      "Material__2766852"                   : { color:0x353535, rough:0.04 },   // Material #2766852
      "Material__3"                         : { color:0xA6A6A4, rough:0.04 },   // Material__3
      "Material__4"                         : { color:0xB2B2B2, rough:0.04 },   // Material__4
      "Material__5"                         : { color:0x387D7D, rough:0.04 },   // Material__5
      "Material__6"                         : { color:0x748284, rough:0.04 },   // Material__6
      "Plain_Natural_Texture_2573294_20cm"  : { color:0x8D8A87, rough:0.63 },   // Plain Natural Texture 2573294 20cm
      "Plain_White_Sheer_2682088_28cm1_1"   : { color:0x959591, rough:0.04 },   // Plain White Sheer 2682088 28cm1#1
      "Plain_White_Texture_2281256_44cm"    : { color:0xCACAC8, rough:0.71 },   // Plain White Texture 2281256 44cm
      "Plastic_Leather_F01_Black_10cm"      : { color:0x8C8C8C, rough:0.04 },   // Plastic_Leather_F01_Black_10cm
      "Plastic_Simple_Shiny_Black"          : { color:0xA8A8A8, rough:0.25 },   // Plastic_Simple_Shiny_Black
      "R192_G192_B192"                      : { color:0x9B9B9B, rough:0.04 },   // R192_G192_B192
      "STONE1_1"                            : { color:0x191C20, rough:0.2 },   // STONE1#1
      "THREAD_926F76CE_BF50_4c7a_A889_CF4CAA97EB5E_png3": { color:0x9C9C9C, rough:0.04 },   // THREAD-926F76CE-BF50-4c7a-A889-CF4CAA97EB5E.png3
      "WOOD1"                               : { color:0x62391B, rough:0.3 },   // WOOD1
      "_0043_SaddleBrown_1_1"               : { color:0x626262, rough:0.04 },   // [0043_SaddleBrown]1#1
      "_0136_Charcoal_3"                    : { color:0x181818, rough:0.25 },   // [0136_Charcoal]3
      "_12"                                 : { color:0x292929, rough:0.3 },   // *12
      "_2"                                  : { color:0x929292, rough:0.04 },   // *2
      "_5"                                  : { color:0xBBBBBB, rough:0.04 },   // *5
      "_6"                                  : { color:0x7B6B3E, rough:0.04 },   // *6
      "_Translucent_Glass_Gray_6"           : { color:0x676767, rough:0.04, opacity:0.3 },   // [Translucent Glass Gray]6
      "____www_3dfox_cn_zldt_5220102"       : { color:0x9D9D9D, rough:0.04 },   // 狐模网-www.3dfox.cn-zldt-5220102
      "____www_3dfox_cn_zldt_5220221"       : { color:0x979797, rough:0.3 },   // 狐模网-www.3dfox.cn-zldt-5220221
      "vray_ChenZc_200606_DCZ22"            : { color:0x676462, rough:0.04 },   // vray ChenZc-200606-DCZ22
      "vray_Decor_b17"                      : { color:0x727272, rough:0.04 },   // vray Decor b17
      "vray_Decor_b18"                      : { color:0xAEAEAE, rough:0.04 },   // vray Decor b18
      "vray_Decor_b19"                      : { color:0x565250, rough:0.04 },   // vray Decor b19
      "vray_Decor_b20"                      : { color:0x040404, rough:0.04 },   // vray Decor b20
      "vray_Decor_b24"                      : { color:0x3E1A13, rough:0.04 },   // vray Decor b24
      "vray_Decor_b27"                      : { color:0x7C7C7C, rough:0.04, opacity:0.3 },   // vray Decor b27
      "vray_Decor_b28"                      : { color:0x050505, rough:0.04 },   // vray Decor b28
      "vray_Decor_b32"                      : { color:0xBFBCB9, rough:0.04 },   // vray Decor b32
      "vray_Decor_b33"                      : { color:0xBFBCB8, rough:0.04 },   // vray Decor b33
      "vray_Decor_b34"                      : { color:0xBFBCB8, rough:0.04 },   // vray Decor b34
      "vray_Decor_b35"                      : { color:0xBFBCB9, rough:0.04 },   // vray Decor b35
      "vray_Decor_b36"                      : { color:0x998F83, rough:0.04 },   // vray Decor b36
      "vray_Decor_b37"                      : { color:0x8D816E, rough:0.04 },   // vray Decor b37
      "vray_Decor_b38"                      : { color:0x8D8277, rough:0.04 },   // vray Decor b38
      "vray_Decor_b39"                      : { color:0x746658, rough:0.04 },   // vray Decor b39
      "vray_Decor_b40"                      : { color:0x565553, rough:0.04 },   // vray Decor b40
      "vray_Decor_b41"                      : { color:0x99958F, rough:0.04 },   // vray Decor b41
      "vray_Decor_b42"                      : { color:0x7D6D58, rough:0.04 },   // vray Decor b42
      "vray_Decor_b44"                      : { color:0x635A4E, rough:0.04 },   // vray Decor b44
      "vray_Decor_b6"                       : { color:0x373737, rough:0.04 },   // vray Decor b6
      "vray_Decor_b7"                       : { color:0xAEACA8, rough:0.04 },   // vray Decor b7
      "vray_Decor_b9"                       : { color:0x6F6A64, rough:0.04 },   // vray Decor b9
    },
    bed2: {
      "Aluminum_Polished"                   : { color:0xC1C1C1, rough:0.04 },   // Aluminum_Polished
      "Aluminum_Polished1"                  : { color:0xA8A8A8, rough:0.04 },   // Aluminum_Polished1
      "Armchair_Coral_vray_Coral_Furniture" : { color:0x171717, rough:0.04 },   // Armchair Coral_vray_Coral_Furniture
      "BEIGE_dunhil_grey"                   : { color:0xB9B5AE, rough:0.1 },   // BEIGE dunhil grey
      "BEIGE_dunhil_grey_1"                 : { color:0xB9B5AE, rough:0.2 },   // BEIGE dunhil grey#1
      "CYF09080031"                         : { color:0xB2B2B2, rough:0.15 },   // CYF09080031
      "GOLD_METAL"                          : { color:0xB7AA9F, rough:0.1 },   // GOLD METAL
      "GREY_FABRIC_4"                       : { color:0x895E5E, rough:0.04 },   // GREY FABRIC#4
      "Generic1_1"                          : { color:0xAAA59D, rough:0.15 },   // Generic1#1
      "Generic1_3"                          : { color:0x9C9890, rough:0.25 },   // Generic1#3
      "Generic_1"                           : { color:0xAAA59D, rough:0.2 },   // Generic#1
      "Generic_2"                           : { color:0x686868, rough:0.3 },   // Generic#2
      "Generic_9"                           : { color:0x787978, rough:0.25 },   // Generic#9
      "Leather_White_01_30cm"               : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm110"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm111"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm120"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm138"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm144"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm151"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm152"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm154"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm172"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm177"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm19"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm196"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm197"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm2"              : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm202"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm206"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm209"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm212"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm223"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm225"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm229"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm231"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm235"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm236"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm237"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm239"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm247"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm248"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm256"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm260"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm271"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm273"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm279"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm281"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm283"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm29"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm291"            : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm30"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm31"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm35"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm40"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm63"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm65"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm7"              : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm70"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm71"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm72"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm74"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm82"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm83"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm84"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm92"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Leather_White_01_30cm96"             : { color:0x8D8A78, rough:0.41 },   // Leather White 01 30cm
      "Marais_bed_vray_Marais_bed_006"      : { color:0x979797, rough:1.0 },   // Marais-bed_vray_Marais bed-006
      "Marais_bed_vray_Marais_bed_007"      : { color:0x979797, rough:1.0 },   // Marais-bed_vray_Marais bed-007
      "Marais_bed_vray_Marais_bed_009"      : { color:0x5E3E00, rough:0.53 },   // Marais-bed_vray_Marais bed-009
      "Marais_bed_vray_Marais_bed_011"      : { color:0x111111, rough:0.22 },   // Marais-bed_vray_Marais bed-011
      "Plain_White_Sheer_3769679_28cm_2"    : { color:0xC7CACA, rough:0.04 },   // Plain White Sheer 3769679 28cm#2
      "Plain_White_Texture_2281256_44cm1"   : { color:0xC4C5C0, rough:0.04 },   // Plain White Texture 2281256 44cm1
      "R192_G192_B192"                      : { color:0x9B9B9B, rough:0.04 },   // R192_G192_B192
      "THREAD_926F76CE_BF50_4c7a_A889_CF4CAA97EB5E_png3": { color:0x9C9C9C, rough:0.04 },   // THREAD-926F76CE-BF50-4c7a-A889-CF4CAA97EB5E.png3
      "Two_Sided_3"                         : { color:0x686868, rough:0.04 },   // Two Sided#3
      "_0136_Charcoal_3"                    : { color:0x181818, rough:0.25 },   // [0136_Charcoal]3
      "_1"                                  : { color:0x2B2B2B, rough:0.04 },   // *1
      "_2"                                  : { color:0x222222, rough:0.3 },   // *2
      "____www_3dfox_cn_zldt_25110011"      : { color:0x979797, rough:0.25 },   // 狐模网-www.3dfox.cn-zldt-25110011
      "____www_3dfox_cn_zldt_25110012"      : { color:0x979797, rough:0.04 },   // 狐模网-www.3dfox.cn-zldt-25110012
      "vray_Arm_cut"                        : { color:0x272727, rough:0.04 },   // vray_Arm cut
      "vray_ChenZc_200606_DCZ22"            : { color:0x676462, rough:0.25 },   // vray ChenZc-200606-DCZ22
      "vray_Glass_2"                        : { color:0x010101, rough:0.04, opacity:0.3 },   // vray_Glass 2
      "vray_Metall"                         : { color:0x070606, rough:0.04 },   // vray_Metall
      "vray_Plastic_Black"                  : { color:0x242424, rough:0.04 },   // vray_Plastic Black
      "vray_Plastic_Orang"                  : { color:0xCE2D02, rough:0.25 },   // vray_Plastic Orang
      "vray_rubber"                         : { color:0x7C7C7C, rough:0.04 },   // vray_rubber
      "vray_white_plastic"                  : { color:0x6E6E6E, rough:0.04 },   // vray_white plastic
    },
    bed3: {
      "Aluminum_Polished"                   : { color:0xC1C1C1, rough:0.04 },   // Aluminum_Polished
      "Color_000"                           : { color:0xCECECE, rough:0.04 },   // [Color_000]
      "Color_004"                           : { color:0x737373, rough:0.04 },   // [Color_004]
      "Color_007"                           : { color:0x2F2F2F, rough:0.04 },   // [Color_007]
      "Color_009"                           : { color:0x000000, rough:0.04 },   // [Color_009]
      "Color_D04"                           : { color:0xCEB97C, rough:0.04 },   // [Color_D04]
      "Floor_Beveled_Oak_Sonoma_34_83_350cm": { color:0x5D5447, rough:0.21 },   // Floor Beveled Oak Sonoma 34-83 350cm
      "GOLD_METAL_1"                        : { color:0x797169, rough:0.35 },   // GOLD METAL#1
      "Generic"                             : { color:0x686868, rough:0.35 },   // Generic
      "Generic1_2"                          : { color:0x71706E, rough:0.15 },   // Generic1#2
      "M_13___Default"                      : { color:0x828282, rough:0.04 },   // 13 - Default
      "M_2111146_133"                       : { color:0x5B5F62, rough:0.04 },   // *
      "M_2111146_134"                       : { color:0x5B5F62, rough:0.04 },   // *
      "M_2111146_135"                       : { color:0x5B5F62, rough:0.04 },   // *
      "M_2111146_136"                       : { color:0x5B5F62, rough:0.04 },   // *
      "Plain_White_Texture_2281256_44cm1"   : { color:0xC4C5C0, rough:0.04 },   // Plain White Texture 2281256 44cm1
      "Plain_White_Texture_2281256_44cm1_1" : { color:0xCACAC8, rough:0.71 },   // Plain White Texture 2281256 44cm
      "Plain_White_Texture_2281256_44cm1_2" : { color:0xCACAC8, rough:0.71 },   // Plain White Texture 2281256 44cm
      "Plastic_Simple_Shiny_Black"          : { color:0xA6A6A6, rough:0.25 },   // Plastic_Simple_Shiny_Black
      "R192_G192_B192"                      : { color:0x9B9B9B, rough:0.04 },   // R192_G192_B192
      "THREAD_926F76CE_BF50_4c7a_A889_CF4CAA97EB5E_png3": { color:0x9C9C9C, rough:0.04 },   // THREAD-926F76CE-BF50-4c7a-A889-CF4CAA97EB5E.png3
      "_"                                   : { color:0x5B5F62, rough:0.04 },   // *
      "_0130_Gainsboro_1"                   : { color:0xB2B2B2, rough:0.04 },   // [0130_Gainsboro]1
      "_0136_Charcoal_3"                    : { color:0x181818, rough:0.25 },   // [0136_Charcoal]3
      "_Color_006_2"                        : { color:0x454545, rough:0.04 },   // [Color_006]2
      "____m210109_04707"                   : { color:0x0B0B0B, rough:0.2 },   // 集简空间m210109-04707
      "_auto_1"                             : { color:0x545553, rough:0.04 },   // <auto>1
    },
  },
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
