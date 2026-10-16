// ANVIL reveal: kinetic text scenes (1080x1920, 24 fps). Built by script; logo paths from the official LogoColored.svg.
(function () {
    var OUT = "G:/My Drive/THE_SYSTRONIC_MARKETING_AGENTS/TSST/brands/anvil/projects/campaign-01/work/post-2-reveal/text_scenes/";
    var logFile = new File(OUT + "build_log.txt");
    function log(s) { logFile.open("a"); logFile.encoding = "UTF-8"; logFile.writeln(s); logFile.close(); }
    logFile.open("w"); logFile.close();

    try {
        if (app.project && app.project.dirty) {
            // Only discard an unsaved, untitled project that is a leftover of this same script.
            var ours = false;
            for (var ii = 1; ii <= app.project.numItems; ii++) if (app.project.item(ii).name === "T1_marhala") ours = true;
            if (app.project.file === null && ours) { app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES); log("closed leftover partial build"); }
            else { log("ABORT: an open project has unsaved changes"); alert("ANVIL script: save or close your open project first."); return; }
        }
        app.beginSuppressDialogs();
        app.newProject();

        var W = 1080, H = 1920, FPS = 24;
        var ORANGE = [1, 106 / 255, 0], LOGO_OR = [1, 138 / 255, 0];
        var BLACK = [10 / 255, 10 / 255, 10 / 255], WHITE = [244 / 255, 244 / 255, 244 / 255];
        var AR_FONT = "Cairo-Black", EN_FONT = "MonumentExtended-Ultrabold", UI_FONT = "Inter18pt-SemiBold";

        function sec(f) { return f / FPS; }
        function ease(prop) {
            for (var k = 1; k <= prop.numKeys; k++) {
                var e = new KeyframeEase(0, 85);
                var dims = prop.value instanceof Array ? prop.value.length : 1;
                if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL || prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) dims = 1;
                var arr = []; for (var d = 0; d < dims; d++) arr.push(e);
                try { prop.setTemporalEaseAtKey(k, arr, arr); } catch (x) {}
            }
        }
        function hold(prop) { for (var k = 1; k <= prop.numKeys; k++) prop.setInterpolationTypeAtKey(k, KeyframeInterpolationType.HOLD); }

        function solid(comp, color, name, inF, outF) {
            var l = comp.layers.addSolid(color, name, W, H, 1);
            l.inPoint = sec(inF); l.outPoint = sec(outF);
            return l;
        }
        function text(comp, str, font, size, color, rtl, inF, outF, tracking) {
            var l = comp.layers.addText(str);
            var p = l.property("Source Text"), td = p.value;
            td.resetCharStyle(); td.resetParagraphStyle();
            td.font = font; td.fontSize = size; td.fillColor = color; td.applyFill = true; td.applyStroke = false;
            td.justification = ParagraphJustification.CENTER_JUSTIFY;
            if (tracking) td.tracking = tracking;
            if (rtl) { try { td.direction = ParagraphDirection.DIRECTION_RIGHT_TO_LEFT; } catch (x) { log("WARN rtl direction: " + x); } }
            p.setValue(td);
            var r = l.sourceRectAtTime(0, false);
            l.property("Anchor Point").setValue([r.left + r.width / 2, r.top + r.height / 2]);
            l.property("Position").setValue([W / 2, H / 2]);
            l.inPoint = sec(inF); l.outPoint = sec(outF);
            l.motionBlur = true;
            log("text '" + str + "' font=" + p.value.font + " w=" + Math.round(r.width) + " h=" + Math.round(r.height));
            return l;
        }
        function punch(l, f0, from) {
            var s = l.property("Scale");
            s.setValueAtTime(sec(f0), [from, from]); s.setValueAtTime(sec(f0 + 5), [100, 100]); ease(s);
            var o = l.property("Opacity");
            o.setValueAtTime(sec(f0), 0); o.setValueAtTime(sec(f0 + 2), 100);
        }
        // A-tip wedge (42 deg family) used as a wipe between palettes.
        function wedge(comp, color, f0, name) {
            var l = comp.layers.addShape(); l.name = name || "A-tip wipe";
            var g = l.property("Contents").addProperty("ADBE Vector Group");
            var sh = new Shape();
            sh.vertices = [[-1400, 1300], [1400, -1300], [2600, -1300], [2600, 2600], [-1400, 2600]];
            sh.closed = true;
            g.property("Contents").addProperty("ADBE Vector Shape - Group").property("Path").setValue(sh);
            g.property("Contents").addProperty("ADBE Vector Graphic - Fill").property("Color").setValue(color);
            var p = l.property("Position");
            p.setValueAtTime(sec(f0), [1700, 1500]); p.setValueAtTime(sec(f0 + 3), [-350, 300]);
            ease(p); l.inPoint = sec(f0); l.motionBlur = true;
            return l;
        }
        function scene(name, frames) {
            var c = app.project.items.addComp(name, W, H, 1, sec(frames), FPS);
            c.motionBlur = true; c.shutterAngle = 180;
            return c;
        }
        // Two-beat word scene: word A on palette A, A-tip wipe, word B on palette B.
        function twoBeat(name, aStr, aBg, aFg, bStr, bBg, bFg, size, total, swap) {
            var c = scene(name, total);
            solid(c, aBg, "bg A", 0, total);
            var w = wedge(c, bBg, swap - 2);
            var ta = text(c, aStr, AR_FONT, size, aFg, true, 0, swap);
            punch(ta, 0, 125);
            var tb = text(c, bStr, AR_FONT, size, bFg, true, swap, total);
            punch(tb, swap, 130);
            ta.moveToBeginning(); tb.moveToBeginning();
            w.moveAfter(tb);
            return c;
        }

        var s1 = twoBeat("T1_marhala", "مرحلة", ORANGE, BLACK, "جديدة", BLACK, ORANGE, 230, 18, 9);
        var s2 = twoBeat("T2_8sneen", "8 سنين", WHITE, BLACK, "ثقة", BLACK, ORANGE, 230, 18, 9);
        var s3 = twoBeat("T3_shakl_esm", "شكل جديد", BLACK, WHITE, "اسم جديد", ORANGE, BLACK, 190, 18, 9);

        // T4: "Shark" -> official ANVIL wordmark (paths from LogoColored.svg).
        var c4 = scene("T4_name_swap", 36);
        solid(c4, BLACK, "bg", 0, 36);
        var shark = text(c4, "SHARK", EN_FONT, 150, WHITE, false, 0, 12, 40);
        punch(shark, 0, 120);
        var wp = wedge(c4, LOGO_OR, 10, "A-tip wipe orange");
        wp.outPoint = sec(15);
        var logo = c4.layers.addShape(); logo.name = "ANVIL wordmark (SVG paths)";
        var polys = [
            { c: LOGO_OR, v: [[298.01, 273.05], [298.01, 407.01], [198.67, 407.01], [198.67, 339.27], [99.33, 239.93], [99.33, 407.01], [0, 407.01], [0, 0]] },
            { c: WHITE, v: [[201.49, 151.83], [201.49, 39.77], [300.83, 39.77], [300.83, 96.65], [400.17, 184.94], [400.17, 39.77], [499.51, 39.77], [499.37, 421.57]] },
            { c: WHITE, v: [[529.11, 408.79], [529.11, 40.66], [628.45, 40.66], [628.45, 408.79]] },
            { c: WHITE, v: [[658.06, 171.34], [658.06, 38.89], [757.4, 38.89], [757.4, 303.79], [826.25, 303.79], [956.08, 407.02], [658.07, 407.02]] }
        ];
        var groups = [];
        for (var i = 0; i < polys.length; i++) {
            var g = logo.property("Contents").addProperty("ADBE Vector Group"); g.name = i === 0 ? "A tip" : "part " + i;
            var sh = new Shape(); sh.vertices = polys[i].v; sh.closed = true;
            g.property("Contents").addProperty("ADBE Vector Shape - Group").property("Path").setValue(sh);
            g.property("Contents").addProperty("ADBE Vector Graphic - Fill").property("Color").setValue(polys[i].c);
            groups.push(g);
        }
        // Adding a group invalidates earlier group references, so fetch them again by index.
        groups = [];
        for (var gi = 1; gi <= logo.property("Contents").numProperties; gi++) groups.push(logo.property("Contents").property(gi));
        // A tip slides in along its diagonal; the letters snap up after it.
        var aT = groups[0].property("Transform").property("Position");
        aT.setValueAtTime(sec(14), [-220, 200]); aT.setValueAtTime(sec(19), [0, 0]); ease(aT);
        for (var j = 1; j < groups.length; j++) {
            var op = groups[j].property("Transform").property("Opacity");
            var ps = groups[j].property("Transform").property("Position");
            var f0 = 16 + j;
            op.setValueAtTime(sec(f0), 0); op.setValueAtTime(sec(f0 + 2), 100);
            ps.setValueAtTime(sec(f0), [0, 60]); ps.setValueAtTime(sec(f0 + 4), [0, 0]); ease(ps);
        }
        logo.property("Anchor Point").setValue([478, 210]);
        logo.property("Position").setValue([W / 2, H / 2 - 40]);
        logo.property("Scale").setValue([92, 92]);
        logo.inPoint = sec(13); logo.motionBlur = true;
        var supps = text(c4, "SUPPS", UI_FONT, 54, WHITE, false, 22, 36, 900);
        supps.property("Position").setValue([W / 2, H / 2 + 230]);
        var so = supps.property("Opacity"); so.setValueAtTime(sec(22), 0); so.setValueAtTime(sec(26), 100);
        var line = c4.layers.addShape(); line.name = "SUPPS rules";
        var lg = line.property("Contents").addProperty("ADBE Vector Group");
        var ls = new Shape(); ls.vertices = [[-440, 0], [-150, 0]]; ls.closed = false;
        var ls2 = new Shape(); ls2.vertices = [[150, 0], [440, 0]]; ls2.closed = false;
        lg.property("Contents").addProperty("ADBE Vector Shape - Group").property("Path").setValue(ls);
        lg.property("Contents").addProperty("ADBE Vector Shape - Group").property("Path").setValue(ls2);
        var st = lg.property("Contents").addProperty("ADBE Vector Graphic - Stroke");
        st.property("Color").setValue(LOGO_OR); st.property("Stroke Width").setValue(3);
        var tp = lg.property("Contents").addProperty("ADBE Vector Filter - Trim");
        tp.property("End").setValueAtTime(sec(22), 0); tp.property("End").setValueAtTime(sec(28), 100); ease(tp.property("End"));
        line.property("Position").setValue([W / 2, H / 2 + 230]);
        line.inPoint = sec(22);

        // Preview comp: all scenes back to back.
        var scenes = [s1, s2, s3, c4], total = 0;
        for (var n = 0; n < scenes.length; n++) total += scenes[n].duration * FPS;
        var prev = scene("ANVIL_TEXT_SCENES_PREVIEW", total);
        var t = 0;
        for (var m = 0; m < scenes.length; m++) {
            var L = prev.layers.add(scenes[m]); L.startTime = sec(t); t += scenes[m].duration * FPS;
            log("scene " + scenes[m].name + " starts at frame " + (t - scenes[m].duration * FPS) + ", " + Math.round(scenes[m].duration * FPS) + " frames");
        }

        app.project.save(new File(OUT + "ANVIL_text_scenes.aep"));

        var rq = app.project.renderQueue;
        var all = [prev, s1, s2, s3, c4];
        for (var q = 0; q < all.length; q++) {
            var it = rq.items.add(all[q]);
            var om = it.outputModule(1), ok = false;
            var tpls = ["H.264 - Match Render Settings - 15 Mbps", "H.264 - Match Render Settings - 40 Mbps", "High Quality", "Lossless"];
            var used = "";
            for (var z = 0; z < tpls.length && !ok; z++) { try { om.applyTemplate(tpls[z]); ok = true; used = tpls[z]; log(all[q].name + " template: " + tpls[z]); } catch (x) {} }
            om.file = new File(OUT + all[q].name + (used.indexOf("H.264") === 0 ? ".mp4" : ".mov"));
        }
        app.project.save();
        rq.render();
        app.project.save();
        app.endSuppressDialogs(false);
        log("DONE");
        alert("ANVIL text scenes: done. Renders are in the text_scenes folder.");
    } catch (e) {
        log("ERROR line " + e.line + ": " + e.toString());
        alert("ANVIL script error (line " + e.line + "): " + e.toString());
        try { app.endSuppressDialogs(false); } catch (x) {}
    }
})();
