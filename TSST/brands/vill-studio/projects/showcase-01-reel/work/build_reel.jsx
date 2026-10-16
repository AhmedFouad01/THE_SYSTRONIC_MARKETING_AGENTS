// VILL-Studio | showcase-01 Reel | build_reel.jsx  (After Effects ExtendScript, ES3: no let/const/arrow)
// Builds a 1080x1920 / 30 fps / 19.6 s comp per STORYBOARD.md and queues it for H.264/MP4.
// Status: PREVIS until a render has been inspected. NOT run in AE by the author (AE unavailable).
// Run: File > Scripts > Run Script File... > build_reel.jsx
// Easing method: TSST-CREATIVE-SK-015 ref/after-effects.md "AE from cubic-bezier" (DERIVED, verify in Graph Editor).

(function () {
    var WARN = [];
    var FPS = 30, W = 1080, H = 1920, DUR = 19.6;
    var DPETROL = [1 / 255, 28 / 255, 44 / 255];   // #011C2C
    var WHITE = [244 / 255, 244 / 255, 244 / 255]; // #F4F4F4
    var REF_IMG_H = 1448;                          // source stills are 1086x1448
    var DISSOLVE = 0.33;                           // 10 frames

    // ---- cubic-bezier presets (x1,y1,x2,y2) from ref/easing.md ----
    var OUT_CUBIC = [0.33, 1, 0.68, 1];
    var IN_CUBIC = [0.32, 0, 0.67, 0];
    var INOUT_SINE = [0.37, 0, 0.63, 1];

    // ---- locate files relative to this script: <brand>/projects/showcase-01-reel/work/build_reel.jsx (moved 2026-10-16) ----
    var scriptFile = new File($.fileName);
    var reelDir = scriptFile.parent;                       // showcase-01-reel/work (inputs, shots, v2)
    var brandDir = reelDir.parent.parent.parent;           // ../../../  -> vill-studio
    var rawDir = new Folder(brandDir.fsName + "/photos/products");
    var logoFile = new File(brandDir.fsName + "/approved/brand/logo/Wordmark Dark Transparent.png");
    var VIDEO_NAME = "WhatsApp Video 2026-10-07 at 2.27.00 AM.mp4"; // clean walkthrough only; other 3 videos are excluded

    function fail(msg) { alert("build_reel.jsx stopped:\n" + msg); }
    if (!rawDir.exists) { fail("Folder not found:\n" + rawDir.fsName + "\nKeep this script inside showcase-01-reel/work/ in the VILL brand folder."); return; }
    if (!logoFile.exists) { fail("Approved logo not found:\n" + logoFile.fsName); return; }

    function findStill(n) {
        var list = rawDir.getFiles(function (f) {
            return (f instanceof File) && /^ChatGPT/.test(f.name) && (new RegExp("-" + n + "\\.png$")).test(f.name);
        });
        return (list && list.length) ? list[0] : null;
    }
    var videoFile = new File(rawDir.fsName + "/" + VIDEO_NAME);
    if (!videoFile.exists) { fail("Video not found:\n" + videoFile.fsName); return; }

    // ---- easing helpers ----
    function nDims(prop) {
        if (prop.isSpatial) { return 1; }
        var v = prop.value;
        return (v instanceof Array) ? v.length : 1;
    }
    function dist(a, b) {
        var i, s = 0;
        for (i = 0; i < a.length; i++) { s += (b[i] - a[i]) * (b[i] - a[i]); }
        return Math.sqrt(s);
    }
    function absDelta(a, b) {
        var i, r = [];
        for (i = 0; i < a.length; i++) { r.push(Math.abs(b[i] - a[i])); }
        return r;
    }
    function toArr(v) { return (v instanceof Array) ? v : [v]; }

    // keys: [{t:sec, v:value}], curves: bezier preset per segment (length keys-1)
    function animate(prop, keys, curves) {
        var i, d, nd, k;
        for (i = 0; i < keys.length; i++) { prop.setValueAtTime(keys[i].t, keys[i].v); }
        nd = nDims(prop);
        var inE = [], outE = [];
        for (i = 0; i < keys.length; i++) { inE.push(null); outE.push(null); }
        for (i = 0; i < keys.length - 1; i++) {
            var bz = curves[i];
            var dt = keys[i + 1].t - keys[i].t;
            var a = toArr(keys[i].v), b = toArr(keys[i + 1].v);
            var avg = [];  // average speed per dimension (units/sec); spatial = path length / dt
            if (prop.isSpatial) { avg = [dist(a, b) / dt]; }
            else { var ad = absDelta(a, b); for (d = 0; d < ad.length; d++) { avg.push(ad[d] / dt); } }
            var oInf = bz[0] * 100, iInf = (1 - bz[2]) * 100;
            var oSp = [], iSp = [];
            for (d = 0; d < nd; d++) {
                var av = avg[d < avg.length ? d : avg.length - 1];
                oSp.push((bz[1] / bz[0]) * av);
                iSp.push(((1 - bz[3]) / (1 - bz[2])) * av);
            }
            var oArr = [], iArr = [];
            for (d = 0; d < nd; d++) { oArr.push(new KeyframeEase(oSp[d], oInf)); iArr.push(new KeyframeEase(iSp[d], iInf)); }
            outE[i] = oArr;
            inE[i + 1] = iArr;
        }
        var def = [];
        for (d = 0; d < nd; d++) { def.push(new KeyframeEase(0, 33)); }
        for (i = 0; i < keys.length; i++) {
            k = i + 1;
            try { prop.setTemporalEaseAtKey(k, inE[i] ? inE[i] : def, outE[i] ? outE[i] : def); }
            catch (e) { WARN.push("ease failed on " + prop.name + " key " + k + ": " + e.toString()); }
        }
    }

    // ---- project / comp ----
    app.beginUndoGroup("VILL showcase-01 Reel build");
    try {
        var proj = app.project;
        if (!proj) { proj = app.newProject(); }
        var folder = proj.items.addFolder("VILL_reel_src");
        var comp = proj.items.addComp("VILL_showcase-01_reel_v1", W, H, 1, DUR, FPS);
        comp.bgColor = DPETROL;
        comp.displayStartTime = 0;

        function imp(f) {
            var io = new ImportOptions(f);
            var it = proj.importFile(io);
            it.parentFolder = folder;
            return it;
        }

        // ---- shot table (matches STORYBOARD.md). s = scale % (relative to 1448 px tall still), p = [x,y] position ----
        var SHOTS = [
            { n: 1, kind: "img", no: 1, tin: 0.0, tout: 2.9, dis: false, s: [134, 142], p: [[560, 960], [470, 1010]] },
            { n: 2, kind: "img", no: 3, tin: 2.5, tout: 5.1, dis: true, s: [134, 144], p: [[540, 960], [500, 1010]] },
            { n: 3, kind: "img", no: 6, tin: 4.7, tout: 7.1, dis: true, s: [134, 140], p: [[540, 960], [600, 960]] },
            { n: 4, kind: "vid", srcIn: 10.0, tin: 7.0, tout: 10.6, dis: false, s: [188, 196], p: [[540, 960], [540, 960]] },
            { n: 5, kind: "img", no: 7, tin: 10.2, tout: 12.6, dis: true, s: [134, 140], p: [[560, 960], [500, 960]] },
            { n: 6, kind: "img", no: 8, tin: 12.2, tout: 14.4, dis: true, s: [138, 146], p: [[480, 990], [420, 1040]] },
            { n: 7, kind: "img", no: 9, tin: 14.0, tout: 15.7, dis: true, s: [136, 146], p: [[540, 960], [520, 990]] },
            { n: 8, kind: "img", no: 10, tin: 15.3, tout: 17.8, dis: true, s: [146, 134], p: [[540, 1020], [540, 960]] }
        ];

        var si, sh, item, lyr, ratio;
        for (si = 0; si < SHOTS.length; si++) {
            sh = SHOTS[si];
            if (sh.kind === "img") {
                var f = findStill(sh.no);
                if (!f) { WARN.push("still -" + sh.no + ".png not found; shot " + sh.n + " skipped"); continue; }
                item = imp(f);
                ratio = REF_IMG_H / item.height;            // keeps fill-height if a different size is supplied
            } else {
                item = imp(videoFile);
                if (item.width > item.height) {
                    WARN.push("Video imported landscape (" + item.width + "x" + item.height + "): rotation metadata not applied. Set Interpret Footage > Other > Rotation 90 and re-run, or the shot will be sideways.");
                }
                ratio = 1024 / item.height;                  // 576x1024 portrait reference
            }
            lyr = comp.layers.add(item);
            lyr.name = "S" + sh.n + (sh.kind === "vid" ? "_video_00AM_src10.0-13.6" : "_img" + sh.no);
            if (sh.kind === "vid") {
                lyr.audioEnabled = false;                    // music/SFX handled separately
                lyr.startTime = sh.tin - sh.srcIn;           // source 10.0 s lands on comp 7.0 s
            } else {
                lyr.startTime = sh.tin;
            }
            lyr.inPoint = sh.tin;
            lyr.outPoint = sh.tout;
            var tr = lyr.transform;
            // slow push/pull, ease-in-out sine (derived: influence 37 %, speed 0 both ends)
            animate(tr.scale,
                [{ t: sh.tin, v: [sh.s[0] * ratio, sh.s[0] * ratio, 100] }, { t: sh.tout, v: [sh.s[1] * ratio, sh.s[1] * ratio, 100] }],
                [INOUT_SINE]);
            if (sh.p[0][0] !== sh.p[1][0] || sh.p[0][1] !== sh.p[1][1]) {
                animate(tr.position,
                    [{ t: sh.tin, v: sh.p[0] }, { t: sh.tout, v: sh.p[1] }],
                    [INOUT_SINE]);
            } else {
                tr.position.setValue(sh.p[0]);
            }
            if (sh.dis) {
                animate(tr.opacity,
                    [{ t: sh.tin, v: 0 }, { t: sh.tin + DISSOLVE, v: 100 }],
                    [OUT_CUBIC]);
            }
        }

        // ---- LIGHT FLASH (the light-driven transition): warm-white solid, opacity 0 -> 100 -> 0, peak on the cut at 7.0 s ----
        var flash = comp.layers.addSolid(WHITE, "LIGHT_FLASH_F4F4F4", W, H, 1, DUR);
        flash.startTime = 0;
        flash.inPoint = 6.4;
        flash.outPoint = 7.6;
        animate(flash.transform.opacity,
            [{ t: 6.5, v: 0 }, { t: 7.0, v: 100 }, { t: 7.5, v: 0 }],
            [IN_CUBIC, OUT_CUBIC]);

        // ---- END CARD ----
        var endBg = comp.layers.addSolid(DPETROL, "END_CARD_BG_011C2C", W, H, 1, DUR);
        endBg.startTime = 0;
        endBg.inPoint = 17.1;
        endBg.outPoint = DUR;
        animate(endBg.transform.opacity, [{ t: 17.1, v: 0 }, { t: 17.7, v: 100 }], [INOUT_SINE]);

        var logoItem = imp(logoFile);
        var logoL = comp.layers.add(logoItem);
        logoL.name = "LOGO_Wordmark_Dark_Transparent";
        if (logoItem.width !== 1080 || logoItem.height !== 1080) {
            WARN.push("Logo file is " + logoItem.width + "x" + logoItem.height + " (expected 1080x1080); wordmark centring may be off.");
        }
        logoL.startTime = 17.8;
        logoL.inPoint = 17.8;
        logoL.outPoint = DUR;
        // wordmark occupies x106-974, y356-691 of the 1080 canvas -> centre (540, 523.5); anchor there, place on comp centre-ish
        logoL.transform.anchorPoint.setValue([540, 523.5]);
        logoL.transform.position.setValue([540, 900]);
        animate(logoL.transform.scale, [{ t: 17.8, v: [59, 59, 100] }, { t: 18.4, v: [62, 62, 100] }], [OUT_CUBIC]);
        animate(logoL.transform.opacity, [{ t: 17.8, v: 0 }, { t: 18.3, v: 100 }], [OUT_CUBIC]);

        // ---- TEXT (Cairo ExtraBold 800, dark petrol; y stays inside safe zone 250..1250) ----
        var fontName = null, tryNames = ["Cairo-ExtraBold", "Cairo ExtraBold", "Cairo-Black", "Cairo-Bold", "Cairo"];
        var ti;
        try {
            if (app.fonts && app.fonts.getFontsByPostScriptName) {
                for (ti = 0; ti < tryNames.length && !fontName; ti++) {
                    var found = app.fonts.getFontsByPostScriptName(tryNames[ti]);
                    if (found && found.length) { fontName = tryNames[ti]; }
                }
            } else { fontName = tryNames[0]; WARN.push("app.fonts not available; assuming PostScript name Cairo-ExtraBold (cannot verify)."); }
        } catch (e1) { fontName = tryNames[0]; }
        if (!fontName) {
            fontName = "ArialMT";
            WARN.push("Cairo is NOT installed. Install vill-studio/archive/pilot-002/assets/fonts/cairo.ttf, restart AE and re-run. Text uses ArialMT fallback.");
        } else if (fontName !== "Cairo-ExtraBold") {
            WARN.push("Cairo ExtraBold not found; using " + fontName + " (weight may be wrong).");
        }

        function addText(str, tin, tout, x, y) {
            var tl = comp.layers.addText(str);
            tl.name = "TXT_" + str.replace(/[^A-Za-z]/g, "_");
            var tp = tl.property("ADBE Text Properties").property("ADBE Text Document");
            var doc = tp.value;
            doc.resetCharStyle();
            doc.fontSize = 104;
            doc.font = fontName;
            doc.applyFill = true;
            doc.fillColor = DPETROL;
            doc.applyStroke = false;
            doc.justification = ParagraphJustification.LEFT_JUSTIFY;
            doc.tracking = 0;
            tp.setValue(doc);
            tl.startTime = 0;
            tl.inPoint = tin;
            tl.outPoint = tout;
            // entrance: rise 28 px + fade, ease-out cubic; exit: fade, ease-in cubic
            animate(tl.transform.position, [{ t: tin, v: [x, y + 28] }, { t: tin + 0.4, v: [x, y] }], [OUT_CUBIC]);
            animate(tl.transform.opacity,
                [{ t: tin, v: 0 }, { t: tin + 0.4, v: 100 }, { t: tout - 0.3, v: 100 }, { t: tout - 0.03, v: 0 }],
                [OUT_CUBIC, IN_CUBIC, IN_CUBIC]);
            // note: segment 2 (hold 100 -> 100) has zero delta; the curve choice is irrelevant there
            return tl;
        }
        addText("Empty shell.", 0.5, 2.6, 80, 470);
        addText("Sea view.", 3.0, 5.0, 80, 470);
        addText("Finished.", 7.6, 10.5, 80, 1190);

        // ---- markers (music/SFX placeholders; none supplied) ----
        try {
            comp.markerProperty.setValueAtTime(0.0, new MarkerValue("MUSIC: add licensed track here (none supplied)"));
            comp.markerProperty.setValueAtTime(7.0, new MarkerValue("LIGHT FLASH peak / cut to finished - optional SFX hit"));
            comp.markerProperty.setValueAtTime(17.8, new MarkerValue("END CARD logo in - music resolve"));
        } catch (e2) { WARN.push("markers: " + e2.toString()); }

        // ---- render queue ----
        var renderDir = new Folder(reelDir.parent.fsName + "/final");
        try { if (!renderDir.exists) { renderDir.create(); } }
        catch (e3) { WARN.push("could not create render/ folder (enable Preferences > Scripting & Expressions > Allow Scripts to Write Files and Access Network)."); }
        var rqi = proj.renderQueue.items.add(comp);
        var om = rqi.outputModule(1);
        var applied = false, tn, names = om.templates;
        for (tn = 0; tn < names.length && !applied; tn++) {
            if (/H\.?264/i.test(names[tn]) && !/^_/.test(names[tn])) {
                try { om.applyTemplate(names[tn]); applied = true; WARN.push("Output template applied: " + names[tn] + " (check bitrate in Output Module Settings)."); } catch (e4) { }
            }
        }
        if (!applied) { WARN.push("No H.264 output template found. In Render Queue set Output Module > Format: H.264 (or add to Media Encoder). Comp is queued."); }
        try { om.file = new File(renderDir.fsName + "/reel_v1.mp4"); }
        catch (e5) { WARN.push("could not set output path; set it to showcase-01-reel/render/reel_v1.mp4 manually."); }

        comp.openInViewer();
        alert("VILL reel comp built (19.6 s, 1080x1920, 30 fps) and queued.\n\nNotes:\n- " + WARN.join("\n- ") +
              "\n\nNext: inspect playback, check Graph Editor curves, then press Render.");
    } catch (err) {
        alert("build_reel.jsx error: " + err.toString() + (err.line ? " (line " + err.line + ")" : "") +
              (WARN.length ? "\n\nNotes:\n- " + WARN.join("\n- ") : ""));
    } finally {
        app.endUndoGroup();
    }
})();
