"""
Prompt definitions for zero-shot tagging of VILL portfolio images.
Can be directly edited by the Lead to adjust classification behavior.
"""

PIECE_PROMPTS = {
    "dressing table/vanity": [
        "a photo of a bedroom makeup dressing table or vanity desk with mirror and drawers",
        "a vanity table with mirror and stool in a bedroom",
        "a cosmetic dressing table or makeup vanity with backlit mirror",
    ],
    "sofa": [
        "a photo of a living room sofa couch or salon seating",
        "an upholstered straight salon sofa",
        "a luxury upholstered couch in a living room",
    ],
    "corner sofa": [
        "a photo of an L-shaped corner sectional sofa in a living room",
        "a modular corner sectional sofa suite",
        "an L-shaped living room sectional couch",
    ],
    "armchair": [
        "a photo of a single upholstered armchair or lounge accent chair",
        "a salon wingback armchair or single barrel chair",
        "a decorative upholstered armchair",
    ],
    "bed": [
        "a photo of a master bedroom bed with tufted or upholstered headboard",
        "a king size or queen size bed frame in a master bedroom",
        "an adult bedroom double bed with headboard and mattress",
    ],
    "kids bed": [
        "a photo of a children's bedroom bed, kids bunk bed, or cartoon themed bed",
        "a twin bed in a kids bedroom or children bunk bed set",
        "a Spider-Man or Mickey Mouse themed cartoon children bed",
    ],
    "wardrobe": [
        "a photo of a fitted bedroom wardrobe cabinet with sliding or hinged doors",
        "a built-in bedroom clothes wardrobe closet",
        "a large storage wardrobe with wooden or mirrored doors",
    ],
    "dressing room": [
        "a photo of an open walk-in dressing room or walk-in closet with shelves and LED lighting",
        "a custom walk-in dressing room wardrobe system with open shelving and hanging rails",
        "a walk-in closet room interior",
    ],
    "kitchen": [
        "a photo of a custom fitted kitchen with cabinets, countertops, sink and appliances",
        "a modern kitchen cabinetry installation with cooking island and built-in appliances",
        "fitted kitchen wall and base cabinets",
    ],
    "dining table": [
        "a photo of a dining room table or large wooden dining table",
        "a solid wood or marble dining table in a dining area",
        "a central dining table",
    ],
    "dining chairs": [
        "a photo of dining chairs or upholstered dining room seating",
        "a set of dining chairs around a dining table",
        "upholstered dining chairs with legs",
    ],
    "coffee table": [
        "a photo of a living room central coffee table",
        "a low salon coffee table in front of a sofa",
        "a round or geometric coffee table on a rug",
    ],
    "side table": [
        "a photo of a small accent side table or bedside nightstand",
        "a small round side table or pedestal table next to a sofa or bed",
        "a compact end table or bedside table",
    ],
    "console": [
        "a photo of an entrance console table or decorative foyer credenza with mirror",
        "a slim entryway console table against a wall",
        "a luxury credenza or buffet console with decorative mirror",
    ],
    "TV wall": [
        "a photo of a living room TV wall unit with wood paneling, marble, or backlight",
        "a decorative television feature wall with LED lighting and floating console",
        "a modern media wall and TV cladding unit",
    ],
    "desk": [
        "a photo of an office desk, computer study desk, or executive work desk with drawers",
        "a home office study desk with chair and storage",
        "an executive wooden desk",
    ],
    "bathroom vanity": [
        "a photo of a bathroom vanity unit with washbasin sink, cabinet and mirror",
        "an under-sink bathroom storage cabinet with countertop and sink",
        "a modern bathroom vanity counter with mirror",
    ],
    "shower cabin": [
        "a photo of a glass shower cabin enclosure in a bathroom",
        "a walk-in tempered glass shower enclosure or shower door",
        "a bathroom glass shower cubicle",
    ],
    "door": [
        "a photo of an interior wooden room door with frame and handle",
        "a modern flush interior wooden door",
        "an interior door panel in a hallway or room",
    ],
    "staircase": [
        "a photo of an interior staircase with balustrade, railings, or floating stairs",
        "a duplex residential staircase with decorative handrail",
        "indoor marble or wooden stairs with railing",
    ],
    "ceiling": [
        "a photo looking up at a decorative gypsum ceiling with cove lighting and spotlights",
        "a false gypsum ceiling design with recessed LED strip lights and chandelier",
        "a decorative architectural ceiling",
    ],
    "flooring": [
        "a photo focused down on floor finish, porcelain tiles, or marble flooring",
        "interior floor tiles, polished porcelain floor, or parquet wood flooring",
        "interior flooring finish",
    ],
    "wall finish": [
        "a photo of decorative wall finish, CNC screen partition, wall paneling or wallpaper",
        "accent wall moldings, decorative gypsum wall trim, or wooden slat cladding",
        "interior wall finish and architectural wall decoration",
    ],
    "outdoor furniture": [
        "a photo of outdoor patio furniture, garden terrace seating, or exterior wooden sofa",
        "wooden outdoor garden patio seating furniture",
        "slatted wood exterior terrace sofa or bench",
    ],
    "none": [
        "a photo of an empty rough construction site, bare concrete, electrical wires, tools, rubble, or uninstalled materials",
        "a smartphone screenshot, catalog graphic flyer, advertisement banner, text graphic, or floor plan diagram",
        "a non-furniture photo showing only tools, construction mess, or random objects",
    ],
}

MATERIAL_PROMPTS = {
    "white lacquer": [
        "furniture with smooth white lacquer or high-gloss white painted finish",
        "clean white polyurethane lacquer painted furniture",
        "white lacquered cabinet surfaces",
    ],
    "colored lacquer": [
        "furniture with colored lacquer paint, like black, grey, red, blue, green, or cream lacquer finish",
        "high-gloss colored painted wood or acrylic cabinets",
        "colored lacquer coating on furniture",
    ],
    "wood veneer": [
        "furniture with natural wood veneer finish, oak or walnut wood grain pattern",
        "engineered wood veneer surface with clear grain",
        "natural wood veneer paneling",
    ],
    "solid wood": [
        "handcrafted solid natural timber or carved solid hardwood furniture",
        "solid natural wood planks or raw carpentry timber",
        "solid wood carpentry",
    ],
    "velvet": [
        "furniture upholstered in soft plush velvet fabric with sheen and texture",
        "rich velvet upholstery fabric on sofa, chairs, or headboard",
        "tufted velvet fabric",
    ],
    "leather": [
        "furniture upholstered in genuine leather or faux leather surface",
        "leather sofa, armchair, or padded headboard",
        "smooth leather upholstery",
    ],
    "fabric pattern": [
        "furniture upholstered in patterned fabric, floral print, textured woven cloth, or jacquard",
        "woven textured textile upholstery or patterned cushions",
        "upholstery fabric with decorative pattern",
    ],
    "marble": [
        "surfaces made of polished natural marble stone, granite, quartz, or onyx slab",
        "marble tabletop, marble wall cladding, or marble countertop",
        "natural veined marble slab",
    ],
    "gypsum": [
        "architectural gypsum board plaster, cornice moldings, or drywall ceiling",
        "white gypsum decorative ceiling and wall moldings",
        "plasterboard gypsum finish",
    ],
    "glass": [
        "transparent tempered glass panels, mirror glass, or glass cabinet doors",
        "clear glass shower cabin or decorative glass mirrors",
        "architectural glass surfaces",
    ],
    "metal/gold": [
        "electroplated gold stainless steel, brass, chrome metal accents, legs or frames",
        "metallic gold hardware, metal profile trim, or steel furniture legs",
        "shiny gold or bronze metal elements",
    ],
    "porcelain tiles": [
        "ceramic or porcelain tiles on bathroom walls or floors",
        "large format porcelain tiles or bathroom wall tiling",
        "glazed ceramic wall and floor tiles",
    ],
}

STAGE_PROMPTS = {
    "workshop/raw frame": [
        "a photo inside a carpentry workshop or wood factory, raw unfinished wooden frames, saws, unpainted furniture skeletons",
        "carpentry manufacturing in workshop, bare wood pieces being cut, assembled or sanded",
        "raw wooden frame fabrication in factory",
    ],
    "under installation": [
        "a photo of interior finishing or furniture under installation on site, workers fitting cabinets, rough wiring, open tools",
        "active construction site with ongoing installation of carpentry, kitchens, or gypsum",
        "assembly and mounting in progress inside an unfinished room",
    ],
    "finished/handover": [
        "a photo of completed finished interior space ready for handover, clean room with fully installed and styled furniture",
        "a professionally completed room handover with clean lighting, polished floors, and finished pieces",
        "completed turnkey handover photo",
    ],
}

ANGLE_PROMPTS = {
    "front": [
        "a straight-on frontal view of the furniture piece, facing directly towards it",
        "a direct front elevation photo of the furniture",
    ],
    "three-quarter": [
        "a three-quarter perspective angle view of the furniture piece, showing both front and side in perspective",
        "an angled perspective photograph of the furniture",
    ],
    "close-up detail": [
        "a close-up macro detail photo focused tightly on materials, joints, carving, hardware, or fabric texture",
        "a tight detail close-up shot of furniture craftsmanship",
    ],
    "wide room": [
        "a wide-angle establishing shot showing the entire room interior and surrounding environment",
        "a panoramic or wide view of the whole room and space",
    ],
}
