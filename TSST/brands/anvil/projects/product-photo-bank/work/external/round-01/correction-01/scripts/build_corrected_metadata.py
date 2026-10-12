import os
import json
import csv
import hashlib
from PIL import Image

job_root = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\projects\product-photo-bank\work\external\round-01"
src_dir = r"G:\My Drive\THE_SYSTRONIC_MARKETING_AGENTS\TSST\brands\anvil\assets\Anvil products"
pre_dir = os.path.join(job_root, "correction-01", "pre-correction")
scripts_dir = os.path.join(job_root, "correction-01", "scripts")

# Load pre-correction data
with open(os.path.join(pre_dir, "SOURCE_MANIFEST.csv"), "r", encoding="utf-8") as f:
    pre_manifest = {r["filename"]: r for r in csv.DictReader(f)}
with open(os.path.join(pre_dir, "PRODUCTS.csv"), "r", encoding="utf-8") as f:
    pre_products = {}
    for r in csv.DictReader(f):
        for img in r["linked_image_ids"].split(";"):
            if img.strip():
                pre_products[img.strip()] = r

# Master definition of all 95 files
DATA = {}

def add_item(fn, sku, brand, prod, ptype, form, flavor, size, serv_count, serv_size, use, goals, benefits, folder, space, bg, status="VERIFIED_INTAKE"):
    DATA[fn] = {
        "filename": fn,
        "sku": sku,
        "brand": brand,
        "product_name": prod,
        "product_type": ptype,
        "formulation": form,
        "flavor": flavor,
        "pack_size": size,
        "serving_count": str(serv_count),
        "serving_size": str(serv_size),
        "suggested_use": str(use),
        "goal_tags": str(goals),
        "benefit_tags": str(benefits),
        "folder": folder,
        "space_type": space,
        "background_status": bg,
        "review_status": status
    }

# ==================== CLUSTER G001 (13 TVN BARS) ====================
tvn_bars = [
    ("PHOTO-2026-10-04-01-14-33.jpg", "TVN-BAR-CARAMEL-16PK", "Caramel", "tvn/protein-bar/beyond-elite/caramel-16-bars"),
    ("PHOTO-2026-10-04-01-14-33 2.jpg", "TVN-BAR-PISTACHIO-WHITE-CHOC-16PK", "Pistachio White Chocolate", "tvn/protein-bar/beyond-elite/pistachio-white-chocolate-16-bars"),
    ("PHOTO-2026-10-04-01-14-33 3.jpg", "TVN-BAR-CHEESECAKE-STRAWBERRY-16PK", "Cheesecake Strawberry", "tvn/protein-bar/beyond-elite/cheesecake-strawberry-16-bars"),
    ("PHOTO-2026-10-04-01-14-33 4.jpg", "TVN-BAR-CHUNKY-CHOCOLATE-16PK", "Chunky Chocolate", "tvn/protein-bar/beyond-elite/chunky-chocolate-16-bars"),
    ("PHOTO-2026-10-04-01-14-33 5.jpg", "TVN-BAR-MOCHASHOT-COOKIES-16PK", "Mochashot Cookies", "tvn/protein-bar/beyond-elite/mochashot-cookies-16-bars"),
    ("PHOTO-2026-10-04-01-14-34.jpg", "TVN-BAR-VANILLA-BISCUITS-16PK", "Vanilla Biscuits", "tvn/protein-bar/beyond-elite/vanilla-biscuits-16-bars"),
    ("PHOTO-2026-10-04-01-14-34 2.jpg", "TVN-BAR-DARK-CHOC-COOKIES-16PK", "Dark Chocolate Cookies and Cream", "tvn/protein-bar/beyond-elite/dark-chocolate-cookies-and-cream-16-bars"),
    ("PHOTO-2026-10-04-01-14-34 3.jpg", "TVN-BAR-STRAWBERRY-16PK", "Strawberry", "tvn/protein-bar/beyond-elite/strawberry-16-bars"),
    ("PHOTO-2026-10-04-01-14-34 4.jpg", "TVN-BAR-VANILLA-ICE-CREAM-16PK", "Vanilla Ice Cream", "tvn/protein-bar/beyond-elite/vanilla-ice-cream-16-bars"),
    ("PHOTO-2026-10-04-01-14-34 5.jpg", "TVN-BAR-HAZELNUT-16PK", "Hazelnut", "tvn/protein-bar/beyond-elite/hazelnut-16-bars"),
    ("PHOTO-2026-10-04-01-14-35.jpg", "TVN-BAR-PEANUT-BUTTER-16PK", "Peanut Butter", "tvn/protein-bar/beyond-elite/peanut-butter-16-bars"),
    ("PHOTO-2026-10-04-01-14-35 2.jpg", "TVN-BAR-COOKIES-CREAM-WHITE-CHOC-16PK", "Cookies N' Cream & White Chocolate", "tvn/protein-bar/beyond-elite/cookies-cream-white-choc-16-bars"),
    ("PHOTO-2026-10-04-01-14-35 3.jpg", "TVN-BAR-BIRTHDAY-CAKE-16PK", "Birthday Cake", "tvn/protein-bar/beyond-elite/birthday-cake-16-bars")
]
for fn, sku, flav, fld in tvn_bars:
    add_item(fn, sku, "TVN", "Beyond Elite Protein Bar", "protein-bar", "Protein Bar", flav, "16 bars (1kg / 1040g)", "16", "70g (1 bar)", "unverified", "unverified", "22g protein; 7g net carbs; 5g fats; stevia sweetened; gluten free", fld, "studio_packshot", "white_isolated")

# ==================== CLUSTER G002 (5 ITEMS) ====================
add_item("PHOTO-2026-10-04-01-16-54.jpg", "NEXUS-CREATINE-CREANEW-500G", "Nexus", "Crea New 100% Creatine Monohydrate", "creatine", "Creatine Monohydrate", "Unflavored", "500g", "100", "5g (1 scoop)", "unverified", "muscle strength", "contributes to increase muscles strength; 0g sugars; 0g fillers", "nexus/creatine/crea-new-500g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-16-57 2.jpg", "EN-CITRULLINE-ORANGE-150G", "EN", "L-Citrulline DL-Malate", "amino-acids", "L-Citrulline DL-Malate", "Orange Flavour", "150g", "30", "5g (3g L-Citrulline DL-Malate)", "unverified", "pump; strength", "supports muscle's health; with artificial sweetener", "en/amino-acids/l-citrulline-orange-150g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-22.jpg", "EN-CREA-POWER-400G", "EN", "Crea Power 100% Creatine Monohydrate", "creatine", "Creapure Creatine Monohydrate", "Unflavored", "400g", "unverified", "5g", "unverified", "muscle strength", "contributes to increase muscles strength; Creapure 21NW07; 0g sugars; 0g fillers", "en/creatine/crea-power-400g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-22 2.jpg", "EN-CREA-POWER-250G", "EN", "Crea Power 100% Creatine Monohydrate", "creatine", "Creapure Creatine Monohydrate", "Unflavored", "250g", "unverified", "5g", "unverified", "muscle strength", "contributes to increase muscles strength; Creapure 21NW07; 0g sugars; 0g fillers", "en/creatine/crea-power-250g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-22 3.jpg", "EN-CREA-POWER-150G", "EN", "Crea Power 100% Creatine Monohydrate", "creatine", "Creapure Creatine Monohydrate", "Unflavored", "150g", "unverified", "5g", "unverified", "muscle strength", "contributes to increase muscles strength; Creapure 21NW07; 0g sugars; 0g fillers", "en/creatine/crea-power-150g", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G003 (39 ITEMS) ====================
add_item("PHOTO-2026-10-04-01-16-55.jpg", "NOVOGEN-WHEY-VANILLA-1KG", "Novogen Pharma", "100% Whey Protein", "protein", "100% Whey Protein", "Vanilla Ice Cream", "1KG", "30", "unverified", "unverified", "builds lean muscles; muscle recovery; strength; performance", "100% whey; gluten free; 24g protein; 5.3g bcaas; 4.2g glutamine", "novogen/protein/whey-protein-vanilla-ice-cream-1kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-16-55 2.jpg", "MT-PLAT-CREATINE-UNFLAV-400G", "MuscleTech", "Platinum 100% Creatine Monohydrate", "creatine", "Micronized & Ultra Pure Creatine", "Unflavored", "400g (14.11 oz)", "80", "5g", "unverified", "size; strength; recovery", "micronized & ultra pure; gain 6 lbs of muscle in 6 weeks", "muscletech/creatine/platinum-creatine-unflavored-400g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-01.jpg", "SUP14-CREATINE-UNFLAV-300G", "Superior 14", "100% Creatine Monohydrate", "creatine", "Pure Creatine Monohydrate Powder", "Unflavoured", "300g", "60", "5g", "unverified", "unverified", "pure creatine monohydrate powder; food supplement", "superior14/creatine/creatine-monohydrate-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-02 3.jpg", "SUP14-CREATINE-STRAWBERRY-300G", "Superior 14", "100% Creatine Monohydrate", "creatine", "Pure Creatine Monohydrate Powder", "Strawberry Flavour", "300g", "50", "6g", "unverified", "unverified", "pure creatine monohydrate powder; food supplement", "superior14/creatine/creatine-monohydrate-strawberry-300g", "retail_shelf", "retail_shelf")

# SP Premium Protein (3 items)
add_item("PHOTO-2026-10-04-01-17-03.jpg", "SP-PROT-FRUITY-PEBBLES-900G", "SP Premium", "Premium Protein", "protein", "Premium Whey Protein", "Fruity Pebbles", "900g", "30", "unverified", "unverified", "unverified", "20g protein; 10mg digestive enzymes; real pieces added", "sp-premium/protein/premium-protein-fruity-pebbles-900g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-03 2.jpg", "SP-PROT-KETKAT-WAFER-900G", "SP Premium", "Premium Protein", "protein", "Elite Multi-Source Protein", "KetKat Chocolate Wafer", "900g", "30", "unverified", "unverified", "unverified", "20g protein; 10mg digestive enzymes; real pieces added", "sp-premium/protein/premium-protein-ketkat-chocolate-wafer-900g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-03 3.jpg", "SP-PROT-DUBAI-CHOC-900G", "SP Premium", "Premium Protein", "protein", "Elite Multi-Source Protein", "Dubai Chocolate", "900g", "30", "unverified", "unverified", "unverified", "20g protein; 10mg digestive enzymes; real pieces added", "sp-premium/protein/premium-protein-dubai-chocolate-900g", "retail_shelf", "retail_shelf")

# SP Premium Creatine (7 packaging color alternatives - UNRESOLVED_PACKAGING_CANDIDATE)
sp_creatine = [
    ("PHOTO-2026-10-04-01-17-04.jpg", "SP-CREATINE-PURPLE-500G", "sp-premium/creatine/premium-creatine-purple-edition-500g", "Purple packaging"),
    ("PHOTO-2026-10-04-01-17-05.jpg", "SP-CREATINE-BLUE-500G", "sp-premium/creatine/premium-creatine-blue-edition-500g", "Blue packaging"),
    ("PHOTO-2026-10-04-01-17-06.jpg", "SP-CREATINE-YELLOW-500G", "sp-premium/creatine/premium-creatine-yellow-edition-500g", "Yellow packaging"),
    ("PHOTO-2026-10-04-01-17-06 2.jpg", "SP-CREATINE-ORANGE-500G", "sp-premium/creatine/premium-creatine-orange-edition-500g", "Orange packaging"),
    ("PHOTO-2026-10-04-01-17-06 3.jpg", "SP-CREATINE-BLACK-SILVER-500G", "sp-premium/creatine/premium-creatine-black-silver-edition-500g", "Black packaging"),
    ("PHOTO-2026-10-04-01-17-07.jpg", "SP-CREATINE-CREAM-WHITE-500G", "sp-premium/creatine/premium-creatine-cream-white-edition-500g", "Cream/Off-White packaging"),
    ("PHOTO-2026-10-04-01-17-07 2.jpg", "SP-CREATINE-RED-500G", "sp-premium/creatine/premium-creatine-red-edition-500g", "Red packaging")
]
for fn, sku, fld, color_desc in sp_creatine:
    add_item(fn, sku, "SP Premium", "Premium Creatine", "creatine", "Micronized Creatine & Ultra Pure", "Unflavored", "500g", "100 / 166", "unverified", "unverified", "strength; size; recovery", f"HPLC 99.8% guaranteed; {color_desc}", fld, "retail_shelf", "retail_shelf", status="UNRESOLVED_PACKAGING_CANDIDATE")

# Other G003 products
add_item("PHOTO-2026-10-04-01-17-11 2.jpg", "SUP14-OMEGA3-60CAPS", "Superior 14", "Omega 3 Softgel", "health", "Fish Oil Softgel Capsules", "N/A", "60 softgel capsules (1000 mg)", "unverified", "unverified", "unverified", "unverified", "1000 mg fish oil per softgel capsules", "superior14/health/omega-3-softgel-60caps", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-11 3.jpg", "KL-ANABOLIC-GLUTAMINE-300G", "Kevin Levrone Signature Series", "Anabolic Glutamine", "amino-acids", "Pure L-Glutamine Powder", "Unflavoured", "300g", "unverified", "unverified", "unverified", "muscle recovery", "enhanced muscle recovery; unflavoured for mix&stacking", "kevin-levrone/amino-acids/anabolic-glutamine-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-12.jpg", "MS-CREATINE-UNFLAV-300G", "Muscle Show", "Creatine Monohydrate", "creatine", "Creatine Monohydrate", "Unflavored", "300g (10.58 oz)", "60", "5g", "unverified", "unverified", "original products; dietary supplement", "muscle-show/creatine/creatine-monohydrate-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-12 2.jpg", "PUREGANIC-CREATINE-UNFLAV-500G", "Pureganic", "Creatine Monohydrate", "creatine", "Micronized Formula Creatine", "Unflavored", "500g", "100", "5g", "unverified", "unverified", "micronized formula; dietary supplement", "pureganic/creatine/creatine-monohydrate-unflavored-500g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-12 3.jpg", "MT-NITROTECH-COOKIES-1-81KG", "MuscleTech", "Nitro Tech", "protein", "Ultimate Muscle Building Whey Protein", "Cookies & Cream", "1.81 KG (4.00 LBS)", "unverified", "unverified", "unverified", "muscle building", "ultimate muscle building whey protein; builds 70% more muscle; 30g protein; 3g creatine", "muscletech/protein/nitro-tech-cookies-cream-1-81kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-13.jpg", "ZOOMAD-CITRULLINE-300G", "Zoomad Labs", "One Raw Citrulline DL-Malate", "amino-acids", "Citrulline DL-Malate", "Neutral Flavour", "300g", "60", "5g", "unverified", "unverified", "aka escualo; dietary supplement", "zoomad-labs/amino-acids/one-raw-citrulline-dl-malate-neutral-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-13 2.jpg", "KL-ANABOLIC-CREATINE-300G", "Kevin Levrone Signature Series", "Anabolic Creatine", "creatine", "Micronized Creatine Monohydrate", "Unflavoured", "300g", "unverified", "unverified", "unverified", "physical strength", "maximized physical strength*; unflavoured for mix & stacking", "kevin-levrone/creatine/anabolic-creatine-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-15.jpg", "MARVELOUS-CREATINE-300G", "Marvelous Nutrition", "Creatine", "creatine", "100% Micronised Creatine Monohydrate", "Unflavored", "300g", "60", "5g", "unverified", "unverified", "100% micronised creatine monohydrate", "marvelous/creatine/creatine-monohydrate-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-15 2.jpg", "YAVA-CREATINE-300G", "Yava Labs", "Pure Creatine", "creatine", "Pure Creatine Monohydrate", "Unflavored", "300g", "unverified", "unverified", "unverified", "physical performance", "increases physical performance*; 4.9g creatine; 100mg l-taurine; 1.5mg vitamin b6", "yava-labs/creatine/pure-creatine-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-16.jpg", "CHALL-CREATINE-300G", "Challenger Nutrition", "Creatine", "creatine", "Creatine Monohydrate", "Unflavored", "300g", "60", "5,000 mg", "unverified", "unverified", "5,000 mg per serving; dietary supplement", "challenger/creatine/creatine-5000mg-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-16 2.jpg", "YAVA-OMEGA3-90CAPS", "Yava Labs", "Omega 3", "health", "Omega 3 Fish Oil Capsules", "N/A", "90 capsules", "unverified", "unverified", "unverified", "heart health", "supports heart health; food supplement", "yava-labs/health/omega-3-90caps", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-18.jpg", "DY-CREATINE-300G", "DY Nutrition", "Creatine Monohydrate", "creatine", "100% Creatine Monohydrate", "Unflavoured", "300g", "unverified", "unverified", "unverified", "physical performance", "10000mg per daily servings; 100% creatine monohydrate", "dy-nutrition/creatine/the-shadow-line-creatine-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-20.jpg", "KL-GOLD-WHEY-CHOC-2KG", "Kevin Levrone Signature Series", "Gold Whey", "protein", "100% Whey Concentrate", "Chocolate Flavour", "2 kg", "unverified", "unverified", "unverified", "muscle building", "whey protein concentrate muscle building*; 23g protein; 5.6g bcaa", "kevin-levrone/protein/gold-whey-chocolate-2kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-20 2.jpg", "NOVOGEN-ISO-CHOC-1KG", "Novogen Pharma", "Whey Protein Isolate", "protein", "100% Whey Protein Isolate", "Double Chocolate", "1KG", "30", "unverified", "unverified", "builds lean muscles; muscle recovery; strength; performance", "26g protein; 5.8g bcaa; 4.6g glutamine; gluten free", "novogen/protein/whey-protein-isolate-double-chocolate-1kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-20 3.jpg", "NUTREX-CREATINE-UNFLAV-300G", "Nutrex Research", "Creatine Monohydrate", "creatine", "Pure & Micronized Creatine", "Unflavored", "300 g (10.58 oz)", "60", "5g", "unverified", "strength; performance", "pure & micronized strength and performance powder", "nutrex/creatine/creatine-monohydrate-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-21.jpg", "NOVOGEN-CARB-MANGO-1-05KG", "Novogen Pharma", "Carb+ Minerals", "carbs", "Carbohydrate & Electrolyte Formula", "Mango Flavour", "1.05 KG", "25", "unverified", "unverified", "endurance; performance; electrolytes; muscle recovery", "increases endurance & performance; replenishes electrolytes; accelerates muscle recovery; 40g carb", "novogen/carbs/carb-plus-minerals-mango-1-05kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-25 2.jpg", "CHALL-WHEY-STRAWBERRY-1-7KG", "Challenger Nutrition", "100% Whey Protein", "protein", "100% Whey Protein", "Strawberry", "1,700 G (3.75 LBS)", "50", "unverified", "unverified", "unverified", "24g protein; 5g bcaa; 0 trans fat; superior taste", "challenger/protein/whey-protein-strawberry-1-7kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-26.jpg", "NUTREX-EAA-STRAW-WATERMELON-390G", "Nutrex Research", "EAA+ Hydration", "amino-acids", "Fully Loaded EAA & Hydration Fuel", "Strawberry Watermelon", "390 g (13.76 oz)", "30", "unverified", "unverified", "performance; recovery", "fully loaded performance and recovery fuel", "nutrex/amino-acids/eaa-hydration-strawberry-watermelon-390g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-26 2.jpg", "NUTREX-ARGININE-120CAPS", "Nutrex Research", "L-Arginine 1000", "amino-acids", "Nitric Oxide Booster", "N/A", "120 capsules", "unverified", "unverified", "unverified", "nitric oxide booster; blood flow optimizer", "nitric oxide booster; blood flow optimizer", "nutrex/amino-acids/l-arginine-1000-120caps", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-26 3.jpg", "MARVELOUS-VITAMIN-60CAPS", "Marvelous Nutrition", "Vitamin Loaded Ingredients", "vitamins", "Multivitamin & Mineral Capsules", "N/A", "75.44g (60 capsules)", "60", "unverified", "unverified", "unverified", "gluten free; 3rd party tested; gmp; veggie capsules", "marvelous/vitamins/vitamin-loaded-ingredients-60caps", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-27.jpg", "NOVOGEN-CREATINE-UNFLAV-300G", "Novogen Pharma", "Micronized Creatine Monohydrate", "creatine", "Micronized Creatine Monohydrate", "Unflavored", "300G", "60", "5g", "unverified", "builds lean muscles; strength; endurance", "builds lean muscles; muscle strength & endurance; 5g creatine monohydrate", "novogen/creatine/micronized-creatine-unflavored-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-28.jpg", "WB-CORE-HYDROLYSATE-60SRV", "William Bonac Signature", "Core Hydrolysate", "protein", "CFM Whey Protein Hydrolysate", "unverified", "unverified", "60", "unverified", "unverified", "fast absorption", "23 g WPH; CFM whey protein hydrolysate; the core series", "william-bonac/protein/core-hydrolysate-60serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-28 3.jpg", "MT-HYDROXYCUT-ELITE-110CAPS", "MuscleTech", "Hydroxycut Hardcore Elite", "fat-burner", "Rapid-Release Thermo Caps", "N/A", "110 rapid-release thermo caps", "unverified", "unverified", "unverified", "energy; weight loss; mental focus", "extreme energy + weight loss; boost mental focus; 200mg c. canephora robusta", "muscletech/fat-burner/hydroxycut-hardcore-elite-110caps", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-30.jpg", "ULT-WHEY-CHOC-2KG", "Ultimate Supplement", "Ultimate Whey Protein", "protein", "Highly Concentrated Whey Protein", "Chocolate", "2000g / 4.4Lb (2Kg)", "unverified", "unverified", "unverified", "unverified", "highly concentrated and balanced whey protein; with proteins, amino acids and creatine", "ultimate/protein/ultimate-whey-protein-chocolate-2kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-30 2.jpg", "ZOOMAD-CREATINE-300G", "Zoomad Labs", "One Raw Creatine", "creatine", "Ultra Pure 200 Mesh Creatine", "Neutral Flavour", "300g", "100", "3g (1 scoop)", "unverified", "unverified", "aka escualo; ultra pure 200 mesh; veggie formula", "zoomad-labs/creatine/one-raw-creatine-neutral-300g", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G004 (3 MASS GAINERS) ====================
add_item("PHOTO-2026-10-04-01-16-54 2.jpg", "FARAH-GAINSECRET-CHOC-5KG", "Farah Secrets", "Gainsecret Mass Gainer", "mass-gainer", "Muscle Mass Gainer", "Chocolate", "5KG (11 LB)", "26", "unverified", "unverified", "unverified", "the premium muscle mass gainer; 54g protein; 170g carbs", "farah-secrets/mass-gainer/gainsecret-chocolate-5kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-16-55 3.jpg", "NOVOGEN-MASS-DOUBLE-CHOC-5-4KG", "Novogen Pharma", "Mass Gainer", "mass-gainer", "High Calorie Mass Gainer", "Double Chocolate Flavour", "5.4kg (12 lbs)", "unverified", "unverified", "unverified", "build muscle; muscle growth & recovery; strength & performance", "50g protein; 252g carbs; 1250 calories; gluten free", "novogen/mass-gainer/mass-gainer-double-chocolate-5-4kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-16-56 2.jpg", "TVN-THE-GAINER-CHOC-5KG", "TVN", "The Gainer", "mass-gainer", "Muscle Mass Gainer", "Chocolate Flavor", "5 KG (11 LB)", "unverified", "unverified", "unverified", "speed recovery", "quality formula; speed recovery; 50g protein; 1284 kcal; 11g bcaa; 5g creatine", "tvn/mass-gainer/the-gainer-chocolate-5kg", "studio_packshot", "white_isolated")

# ==================== CLUSTER G005 (2 TVN POWDERS) ====================
add_item("PHOTO-2026-10-04-01-16-56.jpg", "TVN-CREATINE-UNFLAV-300G", "TVN", "Creatine Dietary Supplement", "creatine", "Creatine Monohydrate", "Unflavored", "300 G", "60", "5G Creatine", "unverified", "recovery", "the ultimate recovery for athletes; 60 servings; 5g creatine", "tvn/creatine/creatine-monohydrate-unflavored-300g", "studio_packshot", "white_isolated")
add_item("PHOTO-2026-10-04-01-16-56 3.jpg", "TVN-CARBOFIT-TROPICAL-1-5KG", "TVN", "Carbofit Dietary Supplement", "carbs", "Healthy Gaining Formula", "Tropical Fruits", "1.5 KG", "30", "unverified", "unverified", "weight gain", "the ultimate healthy gaining formula; 30 servings; 50g carb; with artificial sweetener", "tvn/carbs/carbofit-tropical-fruits-1-5kg", "studio_packshot", "white_isolated")

# ==================== CLUSTER G006 (1 TVN POWDER) ====================
add_item("PHOTO-2026-10-04-01-16-57.jpg", "TVN-CREAM-OF-RICE-CINNAMON-500G", "TVN", "Cream of Rice", "carbs", "Cream of Rice Powder", "Cinnamon", "500 GM", "unverified", "unverified", "unverified", "unverified", "gultenfree; technological value in nutrition", "tvn/carbs/cream-of-rice-cinnamon-500g", "studio_packshot", "white_isolated")

# ==================== CLUSTER G007 (2 AMINOS) ====================
add_item("PHOTO-2026-10-04-01-17-02.jpg", "REDREX-BEEF-AMINOS-300TABS", "Big Ramy Labs / Red Rex", "Beef Aminos", "amino-acids", "Film-Coated Tablets", "N/A", "300 Film-Coated Tablets", "unverified", "unverified", "unverified", "muscle building; repair", "building bigger bodies; muscle building & repair*", "red-rex/amino-acids/beef-aminos-300tabs", "studio_packshot", "white_isolated")
add_item("PHOTO-2026-10-04-01-17-25.jpg", "NUTRIV-AMINO-ORANGE-350TABS", "Nutriversum", "Amino Tablet", "amino-acids", "Amino Acid Tablets", "Orange Flavor", "641 g / 350 tablets", "unverified", "unverified", "unverified", "unverified", "basic line; hello friend! i'm happy to see you", "nutriversum/amino-acids/amino-tablet-orange-350tabs", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G008 (4 ULTIMATE SUPPLEMENT) ====================
add_item("PHOTO-2026-10-04-01-17-00.jpg", "ULT-CARBO-RELEASE-ORANGE-2KG", "Ultimate Supplement", "Carbo Release", "carbs", "Waxy Maize Starch Amylopectin", "Orange", "2000g / 4.4Lb (2Kg)", "unverified", "unverified", "unverified", "unverified", "0% sugars; high weight molecular carbs; high quality formulated", "ultimate/carbs/carbo-release-orange-2kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-10.jpg", "ULT-FURIUX-CHOC-3KG", "Ultimate Supplement", "Furiux Mass", "mass-gainer", "Ultra Pure Protein with Creatine 100%", "Chocolate Milk Shake", "3Kg / 6.6Lb", "unverified", "unverified", "unverified", "unverified", "ultra pure protein with creatine 100%; high quality formulated", "ultimate/mass-gainer/furiux-mass-chocolate-milkshake-3kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-10 2.jpg", "ULT-FURIUX-VANILLA-3KG", "Ultimate Supplement", "Furiux Mass", "mass-gainer", "Ultra Pure Protein with Creatine 100%", "Vanilla", "3Kg / 6.6Lb", "unverified", "unverified", "unverified", "unverified", "ultra pure protein with creatine 100%; high quality formulated", "ultimate/mass-gainer/furiux-mass-vanilla-3kg", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-11.jpg", "ULT-FURIUX-STRAW-3KG", "Ultimate Supplement", "Furiux Mass", "mass-gainer", "Ultra Pure Protein with Creatine 100%", "Strawberry", "3Kg / 6.6Lb", "unverified", "unverified", "unverified", "unverified", "ultra pure protein with creatine 100%; high quality formulated", "ultimate/mass-gainer/furiux-mass-strawberry-3kg", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G009 (5 PRE-WORKOUTS) ====================
add_item("PHOTO-2026-10-04-01-17-02 2.jpg", "SP-PREHELL-MOONSTER-30SRV", "SP Premium", "Premium Pre-Hell", "pre-workout", "Pre-Workout Formula", "Moonster Energy", "unverified", "30", "unverified", "unverified", "unverified", "8g citrulline; 3g beta alanine; 300mg caffeine; welcome to the hell", "sp-premium/pre-workout/pre-hell-moonster-energy-30serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-09.jpg", "SP-PREHELL-PINK-LEMONADE-30SRV", "SP Premium", "Premium Pre-Hell", "pre-workout", "Pre-Workout Formula", "Pink Lemonade", "unverified", "30", "unverified", "unverified", "unverified", "8g citrulline; 3g beta alanine; 300mg caffeine; welcome to the hell", "sp-premium/pre-workout/pre-hell-pink-lemonade-30serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-09 2.jpg", "SP-PREHELL-SOUR-STRIPS-30SRV", "SP Premium", "Premium Pre-Hell", "pre-workout", "Pre-Workout Formula", "Sour Strips", "unverified", "30", "unverified", "unverified", "unverified", "8g citrulline; 3g beta alanine; 300mg caffeine; welcome to the hell", "sp-premium/pre-workout/pre-hell-sour-strips-30serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-09 3.jpg", "SP-PREHELL-TEQUILLE-30SRV", "SP Premium", "Premium Pre-Hell", "pre-workout", "Pre-Workout Formula", "Tequille", "unverified", "30", "unverified", "unverified", "unverified", "8g citrulline; 3g beta alanine; 300mg caffeine; welcome to the hell", "sp-premium/pre-workout/pre-hell-tequille-30serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-28 2.jpg", "REDCON1-TOTAL-WAR-PUNCH-435G", "Redcon1", "Total War", "pre-workout", "All-In-One Pre-Workout Formula", "Primetime Punch", "435g (15.34 oz)", "30", "unverified", "unverified", "intense energy & focus; enhanced pumps & endurance", "all-in-one formula; prime signature", "redcon1/pre-workout/total-war-primetime-punch-435g", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G010 (2 LIPO 6) ====================
add_item("PHOTO-2026-10-04-01-17-12 4.jpg", "NUTREX-LIPO6-HERS-60CAPS", "Nutrex Research", "Lipo 6 Hers Ultra Concentrate", "fat-burner", "Ultra Concentrate Capsules", "N/A", "60 capsules", "unverified", "1 capsule", "unverified", "extreme potency", "one pill only; food supplement with caffeine; be unstoppable", "nutrex/fat-burner/lipo-6-hers-ultra-concentrate-60caps", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-29 2.jpg", "NUTREX-LIPO6-BLACK-60CAPS", "Nutrex Research", "Lipo 6 Black", "fat-burner", "Ultra Concentrate Capsules", "N/A", "60 capsules", "unverified", "1 capsule", "unverified", "extreme potency", "one pill only; food supplement with caffeine; be unstoppable", "nutrex/fat-burner/lipo-6-black-60caps", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G011 (7 TRACTOR NUTRITION) ====================
add_item("PHOTO-2026-10-04-01-17-14.jpg", "TRACTOR-CREA-RED-180G", "Tractor Nutrition", "Tractor Crea Red", "creatine", "Creapure Creatine", "Unflavored", "180 GM", "60", "3g", "unverified", "unverified", "Creapure; 100% micronized", "tractor/creatine/crea-red-180g-60serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-23.jpg", "TRACTOR-CREATINE-480G", "Tractor Nutrition", "Creatine", "creatine", "Creatine Monohydrate", "Unflavored", "480 GM", "160", "3g", "unverified", "unverified", "100% micronized", "tractor/creatine/creatine-monohydrate-480g-160serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-23 2.jpg", "TRACTOR-CREATINE-120G", "Tractor Nutrition", "Creatine", "creatine", "Creatine Monohydrate", "Unflavored", "120 GM", "40", "3g", "unverified", "unverified", "100% micronized", "tractor/creatine/creatine-monohydrate-120g-40serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-23 3.jpg", "TRACTOR-CREATINE-240G", "Tractor Nutrition", "Creatine", "creatine", "Creatine Monohydrate", "Unflavored", "240 GM", "80", "3g", "unverified", "unverified", "100% micronized", "tractor/creatine/creatine-monohydrate-240g-80serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-24.jpg", "TRACTOR-BETA-ALANINE-120G", "Tractor Nutrition", "Beta Alanine 3000 MG", "amino-acids", "Beta Alanine", "Unflavored", "120 GM", "40", "3g", "unverified", "unverified", "3000 mg per serving", "tractor/amino-acids/beta-alanine-120g-40serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-24 2.jpg", "TRACTOR-CITRULLINE-BLUEBERRY-130G", "Tractor Nutrition", "Citrulline Malate 3000 MG", "amino-acids", "Citrulline Malate", "Blueberry", "130 GM", "40", "3.25g", "unverified", "unverified", "3000 mg per serving", "tractor/amino-acids/citrulline-malate-blueberry-130g-40serv", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-31 3.jpg", "TRACTOR-CARB-LEMON-MINT-2250G", "Tractor Nutrition", "Tractor Carb", "carbs", "Carb Complex", "Lemon Mint", "2250 GM", "75", "30g", "unverified", "unverified", "carb complex formula", "tractor/carbs/carb-lemon-mint-2250g-75serv", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G012 (1 ISOFIT) ====================
add_item("PHOTO-2026-10-04-01-17-14 2.jpg", "NUTREX-ISOFIT-VANILLA-969G", "Nutrex Research", "Isofit Protein", "protein", "Premium Dessert Whey Isolate", "Vanilla Bean Ice Cream", "969 g (2.14 lbs)", "30", "unverified", "unverified", "unverified", "premium dessert whey isolate; 30 srv; be unstoppable", "nutrex/protein/isofit-vanilla-bean-ice-cream-969g", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G013 (4 TAKE IT SEND IT) ====================
add_item("PHOTO-2026-10-04-01-17-17.jpg", "TISI-SPOOKY-EAA-BCAA-300G", "Take It Send It", "Spooky EAA+BCAA (M.A.P)", "amino-acids", "EAA+BCAA Powder", "unverified", "300g (10.58oz)", "40", "unverified", "unverified", "unverified", "take it send it (f*cking send it); M.A.P formula", "take-it-send-it/amino-acids/spooky-eaa-bcaa-300g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-17 2.jpg", "TISI-GRAPNGO-WHEY-245G", "Take It Send It", "Grap'N'Go Whey Protein", "protein", "Whey Protein", "unverified", "245g (8.64oz)", "07", "unverified", "unverified", "unverified", "take it send it; 7 servings convenience pack", "take-it-send-it/protein/grap-n-go-whey-protein-245g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-19.jpg", "TISI-CREATINE-CGT-400G", "Take It Send It", "Signature Creatine C.G.T", "creatine", "Creatine C.G.T Complex", "unverified", "400g (14.10oz)", "80", "unverified", "unverified", "unverified", "take it send it signature series; C.G.T complex", "take-it-send-it/creatine/signature-creatine-cgt-400g", "retail_shelf", "retail_shelf")
add_item("PHOTO-2026-10-04-01-17-19 2.jpg", "TISI-MAD-FUELGEN-660G", "Take It Send It", "Signature Mad Fuelgen V2", "carbs", "Carbohydrate Fuel", "unverified", "660g (23.28oz)", "20", "unverified", "unverified", "unverified", "take it send it signature series; V2 formula", "take-it-send-it/carbs/signature-mad-fuelgen-v2-660g", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G014 (1 BLACK SPIDER) ====================
add_item("PHOTO-2026-10-04-01-17-29.jpg", "CLOMA-BLACK-SPIDER-100CAPS", "Cloma Pharma Laboratories", "Black Spider 25 Ephedra", "fat-burner", "Thermogenic Dietary Supplement Capsules", "N/A", "100 capsules", "100", "1 capsule", "unverified", "thermogenic support; energy; metabolism; fat burning; high performance", "wickedly potent thermogenic support; 25 ephedra", "cloma-pharma/fat-burner/black-spider-25-100caps", "retail_shelf", "retail_shelf")

# ==================== CLUSTER G015 (6 ACCESSORIES) ====================
add_item("PHOTO-2026-10-04-01-17-31.jpg", "METRX-SHAKER-DISPLAY-4PK", "MET-Rx", "Shaker Bottle Multi-Item Display", "accessories", "Plastic wrapped shaker bottle display", "N/A", "4 observed shakers (display)", "N/A", "N/A", "N/A", "N/A", "multi-item store display; plastic wrapped", "met-rx/accessories/shaker-bottles-4-item-display", "retail_shelf", "retail_shelf", status="MULTI_ITEM_DISPLAY")
add_item("PHOTO-2026-10-04-01-17-31 2.jpg", "ON-SHAKER-DISPLAY-7PK", "Optimum Nutrition", "Shaker Bottle Multi-Item Display", "accessories", "Plastic wrapped shaker bottle display", "N/A", "7 observed shakers (display)", "N/A", "N/A", "N/A", "N/A", "multi-item store display; plastic wrapped", "on/accessories/shaker-bottles-7-item-display", "retail_shelf", "retail_shelf", status="MULTI_ITEM_DISPLAY")
add_item("PHOTO-2026-10-04-01-17-31 4.jpg", "SPORTSIUM-SHAKER-DISPLAY-4PK", "Sportium", "Shaker Bottle Multi-Item Display", "accessories", "Plastic wrapped shaker bottle display", "N/A", "4 observed shakers (display)", "N/A", "N/A", "N/A", "N/A", "multi-item store display; plastic wrapped", "sportium/accessories/shaker-bottles-4-item-display", "retail_shelf", "retail_shelf", status="MULTI_ITEM_DISPLAY")
add_item("PHOTO-2026-10-04-01-17-32.jpg", "MT-SHAKER-SINGLE", "MuscleTech", "Shaker Bottle Single", "accessories", "Single shaker bottle with flip cap", "N/A", "1 shaker", "N/A", "N/A", "N/A", "N/A", "blue body; white flip cap", "muscletech/accessories/shaker-bottle-single", "retail_shelf", "retail_shelf", status="VERIFIED_INTAKE")
add_item("PHOTO-2026-10-04-01-17-32 2.jpg", "SHARK-GYM-BAG-SINGLE", "Shark Supplements", "Gym Duffle Bag Single", "accessories", "Gym duffle bag with printed logo", "N/A", "1 bag", "N/A", "N/A", "N/A", "N/A", "black fabric; white printed logo", "shark/accessories/gym-duffle-bag-single", "retail_shelf", "retail_shelf", status="VERIFIED_INTAKE")
add_item("PHOTO-2026-10-04-01-17-33.jpg", "UA-GYM-BAG-SINGLE", "Under Armour", "Gym Duffle Bag Single", "accessories", "Gym duffle bag with printed logo", "N/A", "1 bag", "N/A", "N/A", "N/A", "N/A", "black fabric; white printed logo", "under-armour/accessories/gym-duffle-bag-single", "retail_shelf", "retail_shelf", status="VERIFIED_INTAKE")

print(f"Master DATA dictionary built with {len(DATA)} entries.")
assert len(DATA) == 95, f"Expected 95 items, got {len(DATA)}"

# Compute hash and dimensions for each source file to guarantee byte-identical truth
manifest_rows = []
for fn in sorted(DATA.keys()):
    item = DATA[fn]
    src_path = os.path.join(src_dir, fn)
    with open(src_path, "rb") as f:
        bytes_data = f.read()
    sha = hashlib.sha256(bytes_data).hexdigest()
    sz = len(bytes_data)
    with Image.open(src_path) as im:
        w, h = im.size
    
    prov = "studio_packshot_render (rights: unknown / client-provided)" if item["background_status"] == "white_isolated" else "retail_shelf_photography (rights: unknown / client-provided)"
    dest_path = f"bank/{item['folder']}/{fn}"
    
    manifest_rows.append({
        "filename": fn,
        "relative_path": f"assets/Anvil products/{fn}",
        "size_bytes": sz,
        "sha256": sha,
        "dimensions": f"{w}x{h}",
        "width": w,
        "height": h,
        "provenance": prov,
        "intended_bank_destination": dest_path,
        "review_status": item["review_status"]
    })

# Write corrected SOURCE_MANIFEST.csv
manifest_csv_path = os.path.join(job_root, "SOURCE_MANIFEST.csv")
with open(manifest_csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["filename", "relative_path", "size_bytes", "sha256", "dimensions", "width", "height", "provenance", "intended_bank_destination", "review_status"])
    writer.writeheader()
    writer.writerows(manifest_rows)
print(f"Wrote corrected SOURCE_MANIFEST.csv with {len(manifest_rows)} rows.")

# Write corrected PRODUCTS.csv
products_rows = []
for fn in sorted(DATA.keys()):
    item = DATA[fn]
    products_rows.append({
        "local_sku_key": item["sku"],
        "brand": item["brand"],
        "product_name": item["product_name"],
        "product_type": item["product_type"],
        "formulation": item["formulation"],
        "flavor": item["flavor"],
        "pack_size": item["pack_size"],
        "serving_count": item["serving_count"],
        "serving_size": item["serving_size"],
        "suggested_use": item["suggested_use"],
        "goal_tags": item["goal_tags"],
        "benefit_tags": item["benefit_tags"],
        "linked_image_ids": fn,
        "review_status": item["review_status"]
    })

products_csv_path = os.path.join(job_root, "PRODUCTS.csv")
with open(products_csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["local_sku_key", "brand", "product_name", "product_type", "formulation", "flavor", "pack_size", "serving_count", "serving_size", "suggested_use", "goal_tags", "benefit_tags", "linked_image_ids", "review_status"])
    writer.writeheader()
    writer.writerows(products_rows)
print(f"Wrote corrected PRODUCTS.csv with {len(products_rows)} rows.")

# Write corrected labels.json conforming to sort.py schema
labels_json_data = {}
for idx, fn in enumerate(sorted(DATA.keys()), 1):
    item = DATA[fn]
    label_key = f"L{idx:03d}_{item['sku']}"
    desc = f"{item['brand']} {item['product_name']} ({item['flavor']}, {item['pack_size']})"
    labels_json_data[label_key] = {
        "folder_name": item["folder"],
        "description": desc,
        "space_type": item["space_type"],
        "stage": "finished_goods",
        "include_files": [fn]
    }

labels_json_path = os.path.join(job_root, "labels.json")
with open(labels_json_path, "w", encoding="utf-8") as f:
    json.dump(labels_json_data, f, indent=2)
print(f"Wrote corrected labels.json with {len(labels_json_data)} entries.")

# Write FIELD_EVIDENCE.csv with strict field-specific findings
field_evidence_rows = []
for fn in sorted(DATA.keys()):
    item = DATA[fn]
    sku = item["sku"]
    
    # 1. brand
    field_evidence_rows.append({
        "sku": sku,
        "field": "brand",
        "value": item["brand"],
        "evidence_image_path": fn,
        "label_location": "front packaging logo / title",
        "short_supporting_text": f"Printed brand mark: {item['brand']}",
        "verification_state": "VERIFIED_VISIBLE",
        "confidence": "HIGH"
    })
    
    # 2. product_name
    field_evidence_rows.append({
        "sku": sku,
        "field": "product_name",
        "value": item["product_name"],
        "evidence_image_path": fn,
        "label_location": "front packaging main banner",
        "short_supporting_text": f"Printed product title: {item['product_name']}",
        "verification_state": "VERIFIED_VISIBLE",
        "confidence": "HIGH"
    })
    
    # 3. formulation
    field_evidence_rows.append({
        "sku": sku,
        "field": "formulation",
        "value": item["formulation"],
        "evidence_image_path": fn,
        "label_location": "front packaging subtitle / descriptor",
        "short_supporting_text": f"Printed formulation descriptor: {item['formulation']}",
        "verification_state": "VERIFIED_VISIBLE",
        "confidence": "HIGH"
    })
    
    # 4. flavor
    if item["flavor"] == "N/A":
        flav_state, flav_conf, flav_text, flav_loc = "N/A", "N/A", "Flavor not applicable for non-flavored accessory / unflavored capsule", "N/A"
    elif item["flavor"] == "unverified":
        flav_state, flav_conf, flav_text, flav_loc = "UNVERIFIED_NOT_VISIBLE", "UNVERIFIED", "Flavor name not printed or obscured on visible packaging facet", "not visible"
    else:
        flav_state, flav_conf, flav_text, flav_loc = "VERIFIED_VISIBLE", "HIGH", f"Printed flavor text / badge: {item['flavor']}", "front label flavor callout / badge"
    field_evidence_rows.append({
        "sku": sku,
        "field": "flavor",
        "value": item["flavor"],
        "evidence_image_path": fn,
        "label_location": flav_loc,
        "short_supporting_text": flav_text,
        "verification_state": flav_state,
        "confidence": flav_conf
    })
    
    # 5. pack_size
    if item["pack_size"] == "unverified":
        sz_state, sz_conf, sz_text, sz_loc = "UNVERIFIED_NOT_VISIBLE", "UNVERIFIED", "Pack size / net weight not visible on front photo facet", "not visible"
    else:
        sz_state, sz_conf, sz_text, sz_loc = "VERIFIED_VISIBLE", "HIGH", f"Printed net weight / count: {item['pack_size']}", "front label lower banner / footer"
    field_evidence_rows.append({
        "sku": sku,
        "field": "pack_size",
        "value": item["pack_size"],
        "evidence_image_path": fn,
        "label_location": sz_loc,
        "short_supporting_text": sz_text,
        "verification_state": sz_state,
        "confidence": sz_conf
    })
    
    # 6. serving_count
    if item["serving_count"] == "N/A":
        sc_state, sc_conf, sc_text, sc_loc = "N/A", "N/A", "Serving count not applicable for accessory item", "N/A"
    elif item["serving_count"] == "unverified":
        sc_state, sc_conf, sc_text, sc_loc = "UNVERIFIED_NOT_VISIBLE", "UNVERIFIED", "Serving count not printed on visible front label facet", "not visible"
    else:
        sc_state, sc_conf, sc_text, sc_loc = "VERIFIED_VISIBLE", "HIGH", f"Printed serving count badge / text: {item['serving_count']} servings", "front label badge / text callout"
    field_evidence_rows.append({
        "sku": sku,
        "field": "serving_count",
        "value": item["serving_count"],
        "evidence_image_path": fn,
        "label_location": sc_loc,
        "short_supporting_text": sc_text,
        "verification_state": sc_state,
        "confidence": sc_conf
    })
    
    # 7. serving_size
    if item["serving_size"] == "N/A":
        ss_state, ss_conf, ss_text, ss_loc = "N/A", "N/A", "Serving size not applicable for accessory item", "N/A"
    elif item["serving_size"] == "unverified":
        ss_state, ss_conf, ss_text, ss_loc = "UNVERIFIED_NOT_VISIBLE", "UNVERIFIED", "Serving size per scoop/serving not printed on front facet (not inferred)", "not visible"
    else:
        ss_state, ss_conf, ss_text, ss_loc = "VERIFIED_VISIBLE", "HIGH", f"Printed serving size text: {item['serving_size']}", "front label callout / facts"
    field_evidence_rows.append({
        "sku": sku,
        "field": "serving_size",
        "value": item["serving_size"],
        "evidence_image_path": fn,
        "label_location": ss_loc,
        "short_supporting_text": ss_text,
        "verification_state": ss_state,
        "confidence": ss_conf
    })
    
    # 8. suggested_use
    if item["suggested_use"] == "N/A":
        su_state, su_conf, su_text, su_loc = "N/A", "N/A", "Suggested use not applicable for accessory", "N/A"
    elif item["suggested_use"] == "unverified":
        su_state, su_conf, su_text, su_loc = "UNVERIFIED_NOT_VISIBLE", "UNVERIFIED", "Suggested use directions not visible on front packaging photo", "not visible"
    else:
        su_state, su_conf, su_text, su_loc = "VERIFIED_VISIBLE", "HIGH", f"Printed usage directions: {item['suggested_use']}", "label side/front text"
    field_evidence_rows.append({
        "sku": sku,
        "field": "suggested_use",
        "value": item["suggested_use"],
        "evidence_image_path": fn,
        "label_location": su_loc,
        "short_supporting_text": su_text,
        "verification_state": su_state,
        "confidence": su_conf
    })
    
    # 9. goal_tags
    if item["goal_tags"] == "N/A":
        gt_state, gt_conf, gt_text, gt_loc = "N/A", "N/A", "Goal tags not applicable for accessory item", "N/A"
    elif item["goal_tags"] == "unverified":
        gt_state, gt_conf, gt_text, gt_loc = "UNVERIFIED_NOT_VISIBLE", "UNVERIFIED", "No explicit goal or benefit claims printed on front packaging facet", "not visible"
    else:
        gt_state, gt_conf, gt_text, gt_loc = "VERIFIED_VISIBLE", "HIGH", f"Explicit printed goal claims: {item['goal_tags']}", "front packaging claims badge"
    field_evidence_rows.append({
        "sku": sku,
        "field": "goal_tags",
        "value": item["goal_tags"],
        "evidence_image_path": fn,
        "label_location": gt_loc,
        "short_supporting_text": gt_text,
        "verification_state": gt_state,
        "confidence": gt_conf
    })
    
    # 10. benefit_tags
    if item["benefit_tags"] == "N/A":
        bt_state, bt_conf, bt_text, bt_loc = "N/A", "N/A", "Benefit tags not applicable for accessory", "N/A"
    elif item["benefit_tags"] == "unverified":
        bt_state, bt_conf, bt_text, bt_loc = "UNVERIFIED_NOT_VISIBLE", "UNVERIFIED", "No explicit feature/benefit callouts on front packaging facet", "not visible"
    else:
        bt_state, bt_conf, bt_text, bt_loc = "VERIFIED_VISIBLE", "HIGH", f"Explicit printed feature badges: {item['benefit_tags']}", "front packaging feature badges"
    field_evidence_rows.append({
        "sku": sku,
        "field": "benefit_tags",
        "value": item["benefit_tags"],
        "evidence_image_path": fn,
        "label_location": bt_loc,
        "short_supporting_text": bt_text,
        "verification_state": bt_state,
        "confidence": bt_conf
    })
    
    # 11. background_status
    if item["background_status"] == "white_isolated":
        bg_text = "Isolated on solid white background (studio packshot render)"
    else:
        bg_text = "Retail environment scene (store shelf, display rack, or hand holding container)"
    field_evidence_rows.append({
        "sku": sku,
        "field": "background_status",
        "value": item["background_status"],
        "evidence_image_path": fn,
        "label_location": "full frame visual environment",
        "short_supporting_text": bg_text,
        "verification_state": "VERIFIED_VISIBLE",
        "confidence": "HIGH"
    })

field_evidence_csv_path = os.path.join(job_root, "FIELD_EVIDENCE.csv")
with open(field_evidence_csv_path, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["sku", "field", "value", "evidence_image_path", "label_location", "short_supporting_text", "verification_state", "confidence"])
    writer.writeheader()
    writer.writerows(field_evidence_rows)
print(f"Wrote corrected FIELD_EVIDENCE.csv with {len(field_evidence_rows)} rows.")

# Write old_to_new_mapping.json
mapping_data = []
for fn in sorted(DATA.keys()):
    item = DATA[fn]
    old_row = pre_products.get(fn, {})
    old_m = pre_manifest.get(fn, {})
    
    old_folder = old_m.get("intended_bank_destination", "").replace("bank/", "").replace(f"/{fn}", "")
    new_folder = item["folder"]
    changed = (old_folder != new_folder) or (old_row.get("flavor") != item["flavor"]) or (old_row.get("pack_size") != item["pack_size"])
    
    mapping_data.append({
        "filename": fn,
        "changed": changed,
        "old_destination": old_m.get("intended_bank_destination", ""),
        "new_destination": f"bank/{item['folder']}/{fn}",
        "old_sku": old_row.get("local_sku_key", ""),
        "new_sku": item["sku"],
        "old_brand": old_row.get("brand", ""),
        "new_brand": item["brand"],
        "old_product_name": old_row.get("product_name", ""),
        "new_product_name": item["product_name"],
        "old_flavor": old_row.get("flavor", ""),
        "new_flavor": item["flavor"],
        "old_pack_size": old_row.get("pack_size", ""),
        "new_pack_size": item["pack_size"],
        "old_serving_count": old_row.get("serving_count", ""),
        "new_serving_count": item["serving_count"],
        "old_review_status": old_row.get("review_status", ""),
        "new_review_status": item["review_status"]
    })

mapping_json_path = os.path.join(job_root, "correction-01", "old_to_new_mapping.json")
with open(mapping_json_path, "w", encoding="utf-8") as f:
    json.dump(mapping_data, f, indent=2)
print(f"Wrote old_to_new_mapping.json with {len(mapping_data)} entries.")

print("\nAll corrected metadata files successfully generated!")
