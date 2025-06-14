import {
  createAnimation,
  getIonPageElement
} from "./chunk-GDCD3L7W.js";

// node_modules/@ionic/core/dist/esm-es5/ios.transition-a50a9a55.js
var DURATION = 540;
var getClonedElement = function(a) {
  return document.querySelector("".concat(a, ".ion-cloned-element"));
};
var shadow = function(a) {
  return a.shadowRoot || a;
};
var getLargeTitle = function(a) {
  var t = a.tagName === "ION-TABS" ? a : a.querySelector("ion-tabs");
  var r = "ion-content ion-header:not(.header-collapse-condense-inactive) ion-title.title-large";
  if (t != null) {
    var n = t.querySelector("ion-tab:not(.tab-hidden), .ion-page:not(.ion-page-hidden)");
    return n != null ? n.querySelector(r) : null;
  }
  return a.querySelector(r);
};
var getBackButton = function(a, t) {
  var r = a.tagName === "ION-TABS" ? a : a.querySelector("ion-tabs");
  var n = [];
  if (r != null) {
    var o = r.querySelector("ion-tab:not(.tab-hidden), .ion-page:not(.ion-page-hidden)");
    if (o != null) {
      n = o.querySelectorAll("ion-buttons");
    }
  } else {
    n = a.querySelectorAll("ion-buttons");
  }
  for (var e = 0, i = n; e < i.length; e++) {
    var s = i[e];
    var l = s.closest("ion-header");
    var v = l && !l.classList.contains("header-collapse-condense-inactive");
    var c = s.querySelector("ion-back-button");
    var f = s.classList.contains("buttons-collapse");
    var p = s.slot === "start" || s.slot === "";
    if (c !== null && p && (f && v && t || !f)) {
      return c;
    }
  }
  return null;
};
var createLargeTitleTransition = function(a, t, r, n, o) {
  var e = getBackButton(n, r);
  var i = getLargeTitle(o);
  var s = getLargeTitle(n);
  var l = getBackButton(o, r);
  var v = e !== null && i !== null && !r;
  var c = s !== null && l !== null && r;
  if (v) {
    var f = i.getBoundingClientRect();
    var p = e.getBoundingClientRect();
    var d = shadow(e).querySelector(".button-text");
    var m = d.getBoundingClientRect();
    var u = shadow(i).querySelector(".toolbar-title");
    var b = u.getBoundingClientRect();
    animateLargeTitle(a, t, r, i, f, b, d, m);
    animateBackButton(a, t, r, e, p, d, m, i, b);
  } else if (c) {
    var g = s.getBoundingClientRect();
    var h = l.getBoundingClientRect();
    var A = shadow(l).querySelector(".button-text");
    var y = A.getBoundingClientRect();
    var X = shadow(s).querySelector(".toolbar-title");
    var x = X.getBoundingClientRect();
    animateLargeTitle(a, t, r, s, g, x, A, y);
    animateBackButton(a, t, r, l, h, A, y, s, x);
  }
  return { forward: v, backward: c };
};
var animateBackButton = function(a, t, r, n, o, e, i, s, l) {
  var v;
  var c, f;
  var p = t ? "calc(100% - ".concat(o.right + 4, "px)") : "".concat(o.left - 4, "px");
  var d = t ? "right" : "left";
  var m = t ? "left" : "right";
  var u = t ? "right" : "left";
  var b = ((c = e.textContent) === null || c === void 0 ? void 0 : c.trim()) === ((f = s.textContent) === null || f === void 0 ? void 0 : f.trim());
  var g = l.width / i.width;
  var h = (l.height - LARGE_TITLE_SIZE_OFFSET) / i.height;
  var A = b ? "scale(".concat(g, ", ").concat(h, ")") : "scale(".concat(h, ")");
  var y = "scale(1)";
  var X = shadow(n).querySelector("ion-icon");
  var x = X.getBoundingClientRect();
  var T = t ? "".concat(x.width / 2 - (x.right - o.right), "px") : "".concat(o.left - x.width / 2, "px");
  var w = t ? "-".concat(window.innerWidth - o.right, "px") : "".concat(o.left, "px");
  var k = "".concat(l.top, "px");
  var E = "".concat(o.top, "px");
  var B = [{ offset: 0, transform: "translate3d(".concat(T, ", ").concat(k, ", 0)") }, { offset: 1, transform: "translate3d(".concat(w, ", ").concat(E, ", 0)") }];
  var L = [{ offset: 0, transform: "translate3d(".concat(w, ", ").concat(E, ", 0)") }, { offset: 1, transform: "translate3d(".concat(T, ", ").concat(k, ", 0)") }];
  var I = r ? L : B;
  var _ = [{ offset: 0, opacity: 0, transform: A }, { offset: 1, opacity: 1, transform: y }];
  var S = [{ offset: 0, opacity: 1, transform: y }, { offset: 1, opacity: 0, transform: A }];
  var O = r ? S : _;
  var F = [{ offset: 0, opacity: 0, transform: "scale(0.6)" }, { offset: 0.6, opacity: 0, transform: "scale(0.6)" }, { offset: 1, opacity: 1, transform: "scale(1)" }];
  var j = [{ offset: 0, opacity: 1, transform: "scale(1)" }, { offset: 0.2, opacity: 0, transform: "scale(0.6)" }, { offset: 1, opacity: 0, transform: "scale(0.6)" }];
  var R = r ? j : F;
  var N = createAnimation();
  var C = createAnimation();
  var G = createAnimation();
  var Z = getClonedElement("ion-back-button");
  var D = shadow(Z).querySelector(".button-text");
  var P = shadow(Z).querySelector("ion-icon");
  Z.text = n.text;
  Z.mode = n.mode;
  Z.icon = n.icon;
  Z.color = n.color;
  Z.disabled = n.disabled;
  Z.style.setProperty("display", "block");
  Z.style.setProperty("position", "fixed");
  C.addElement(P);
  N.addElement(D);
  G.addElement(Z);
  G.beforeStyles((v = { position: "absolute", top: "0px" }, v[u] = "0px", v)).keyframes(I);
  N.beforeStyles({ "transform-origin": "".concat(d, " top") }).beforeAddWrite(function() {
    n.style.setProperty("display", "none");
    Z.style.setProperty(d, p);
  }).afterAddWrite(function() {
    n.style.setProperty("display", "");
    Z.style.setProperty("display", "none");
    Z.style.removeProperty(d);
  }).keyframes(O);
  C.beforeStyles({ "transform-origin": "".concat(m, " center") }).keyframes(R);
  a.addAnimation([N, C, G]);
};
var animateLargeTitle = function(a, t, r, n, o, e, i, s) {
  var l;
  var v, c;
  var f = t ? "right" : "left";
  var p = t ? "calc(100% - ".concat(o.right, "px)") : "".concat(o.left, "px");
  var d = "0px";
  var m = "".concat(o.top, "px");
  var u = 8;
  var b = t ? "-".concat(window.innerWidth - s.right - u, "px") : "".concat(s.x - u, "px");
  var g = 2;
  var h = "".concat(s.y - g, "px");
  var A = ((v = i.textContent) === null || v === void 0 ? void 0 : v.trim()) === ((c = n.textContent) === null || c === void 0 ? void 0 : c.trim());
  var y = s.width / e.width;
  var X = s.height / (e.height - LARGE_TITLE_SIZE_OFFSET);
  var x = "scale(1)";
  var T = A ? "scale(".concat(y, ", ").concat(X, ")") : "scale(".concat(X, ")");
  var w = [{ offset: 0, opacity: 0, transform: "translate3d(".concat(b, ", ").concat(h, ", 0) ").concat(T) }, { offset: 0.1, opacity: 0 }, { offset: 1, opacity: 1, transform: "translate3d(".concat(d, ", ").concat(m, ", 0) ").concat(x) }];
  var k = [{ offset: 0, opacity: 0.99, transform: "translate3d(".concat(d, ", ").concat(m, ", 0) ").concat(x) }, { offset: 0.6, opacity: 0 }, { offset: 1, opacity: 0, transform: "translate3d(".concat(b, ", ").concat(h, ", 0) ").concat(T) }];
  var E = r ? w : k;
  var B = getClonedElement("ion-title");
  var L = createAnimation();
  B.innerText = n.innerText;
  B.size = n.size;
  B.color = n.color;
  L.addElement(B);
  L.beforeStyles((l = { "transform-origin": "".concat(f, " top"), height: "".concat(o.height, "px"), display: "", position: "relative" }, l[f] = p, l)).beforeAddWrite(function() {
    n.style.setProperty("opacity", "0");
  }).afterAddWrite(function() {
    n.style.setProperty("opacity", "");
    B.style.setProperty("display", "none");
  }).keyframes(E);
  a.addAnimation(L);
};
var iosTransitionAnimation = function(a, t) {
  var r;
  try {
    var n = "cubic-bezier(0.32,0.72,0,1)";
    var o = "opacity";
    var e = "transform";
    var i = "0%";
    var s = 0.8;
    var l = a.ownerDocument.dir === "rtl";
    var v = l ? "-99.5%" : "99.5%";
    var c = l ? "33%" : "-33%";
    var f = t.enteringEl;
    var p = t.leavingEl;
    var d = t.direction === "back";
    var m = f.querySelector(":scope > ion-content");
    var u = f.querySelectorAll(":scope > ion-header > *:not(ion-toolbar), :scope > ion-footer > *");
    var b = f.querySelectorAll(":scope > ion-header > ion-toolbar");
    var g = createAnimation();
    var h = createAnimation();
    g.addElement(f).duration(((r = t.duration) !== null && r !== void 0 ? r : 0) || DURATION).easing(t.easing || n).fill("both").beforeRemoveClass("ion-page-invisible");
    if (p && a !== null && a !== void 0) {
      var A = createAnimation();
      A.addElement(a);
      g.addAnimation(A);
    }
    if (!m && b.length === 0 && u.length === 0) {
      h.addElement(f.querySelector(":scope > .ion-page, :scope > ion-nav, :scope > ion-tabs"));
    } else {
      h.addElement(m);
      h.addElement(u);
    }
    g.addAnimation(h);
    if (d) {
      h.beforeClearStyles([o]).fromTo("transform", "translateX(".concat(c, ")"), "translateX(".concat(i, ")")).fromTo(o, s, 1);
    } else {
      h.beforeClearStyles([o]).fromTo("transform", "translateX(".concat(v, ")"), "translateX(".concat(i, ")"));
    }
    if (m) {
      var y = shadow(m).querySelector(".transition-effect");
      if (y) {
        var X = y.querySelector(".transition-cover");
        var x = y.querySelector(".transition-shadow");
        var T = createAnimation();
        var w = createAnimation();
        var k = createAnimation();
        T.addElement(y).beforeStyles({ opacity: "1", display: "block" }).afterStyles({ opacity: "", display: "" });
        w.addElement(X).beforeClearStyles([o]).fromTo(o, 0, 0.1);
        k.addElement(x).beforeClearStyles([o]).fromTo(o, 0.03, 0.7);
        T.addAnimation([w, k]);
        h.addAnimation([T]);
      }
    }
    var E = f.querySelector("ion-header.header-collapse-condense");
    var B = createLargeTitleTransition(g, l, d, f, p), L = B.forward, I = B.backward;
    b.forEach(function(a2) {
      var t2 = createAnimation();
      t2.addElement(a2);
      g.addAnimation(t2);
      var r2 = createAnimation();
      r2.addElement(a2.querySelector("ion-title"));
      var n2 = createAnimation();
      var e2 = Array.from(a2.querySelectorAll("ion-buttons,[menuToggle]"));
      var s2 = a2.closest("ion-header");
      var f2 = s2 === null || s2 === void 0 ? void 0 : s2.classList.contains("header-collapse-condense-inactive");
      var p2;
      if (d) {
        p2 = e2.filter(function(a3) {
          var t3 = a3.classList.contains("buttons-collapse");
          return t3 && !f2 || !t3;
        });
      } else {
        p2 = e2.filter(function(a3) {
          return !a3.classList.contains("buttons-collapse");
        });
      }
      n2.addElement(p2);
      var m2 = createAnimation();
      m2.addElement(a2.querySelectorAll(":scope > *:not(ion-title):not(ion-buttons):not([menuToggle])"));
      var u2 = createAnimation();
      u2.addElement(shadow(a2).querySelector(".toolbar-background"));
      var b2 = createAnimation();
      var h2 = a2.querySelector("ion-back-button");
      if (h2) {
        b2.addElement(h2);
      }
      t2.addAnimation([r2, n2, m2, u2, b2]);
      n2.fromTo(o, 0.01, 1);
      m2.fromTo(o, 0.01, 1);
      if (d) {
        if (!f2) {
          r2.fromTo("transform", "translateX(".concat(c, ")"), "translateX(".concat(i, ")")).fromTo(o, 0.01, 1);
        }
        m2.fromTo("transform", "translateX(".concat(c, ")"), "translateX(".concat(i, ")"));
        b2.fromTo(o, 0.01, 1);
      } else {
        if (!E) {
          r2.fromTo("transform", "translateX(".concat(v, ")"), "translateX(".concat(i, ")")).fromTo(o, 0.01, 1);
        }
        m2.fromTo("transform", "translateX(".concat(v, ")"), "translateX(".concat(i, ")"));
        u2.beforeClearStyles([o, "transform"]);
        var A2 = s2 === null || s2 === void 0 ? void 0 : s2.translucent;
        if (!A2) {
          u2.fromTo(o, 0.01, "var(--opacity)");
        } else {
          u2.fromTo("transform", l ? "translateX(-100%)" : "translateX(100%)", "translateX(0px)");
        }
        if (!L) {
          b2.fromTo(o, 0.01, 1);
        }
        if (h2 && !L) {
          var y2 = createAnimation();
          y2.addElement(shadow(h2).querySelector(".button-text")).fromTo("transform", l ? "translateX(-100px)" : "translateX(100px)", "translateX(0px)");
          t2.addAnimation(y2);
        }
      }
    });
    if (p) {
      var _ = createAnimation();
      var S = p.querySelector(":scope > ion-content");
      var O = p.querySelectorAll(":scope > ion-header > ion-toolbar");
      var F = p.querySelectorAll(":scope > ion-header > *:not(ion-toolbar), :scope > ion-footer > *");
      if (!S && O.length === 0 && F.length === 0) {
        _.addElement(p.querySelector(":scope > .ion-page, :scope > ion-nav, :scope > ion-tabs"));
      } else {
        _.addElement(S);
        _.addElement(F);
      }
      g.addAnimation(_);
      if (d) {
        _.beforeClearStyles([o]).fromTo("transform", "translateX(".concat(i, ")"), l ? "translateX(-100%)" : "translateX(100%)");
        var j = getIonPageElement(p);
        g.afterAddWrite(function() {
          if (g.getDirection() === "normal") {
            j.style.setProperty("display", "none");
          }
        });
      } else {
        _.fromTo("transform", "translateX(".concat(i, ")"), "translateX(".concat(c, ")")).fromTo(o, 1, s);
      }
      if (S) {
        var R = shadow(S).querySelector(".transition-effect");
        if (R) {
          var N = R.querySelector(".transition-cover");
          var C = R.querySelector(".transition-shadow");
          var G = createAnimation();
          var Z = createAnimation();
          var D = createAnimation();
          G.addElement(R).beforeStyles({ opacity: "1", display: "block" }).afterStyles({ opacity: "", display: "" });
          Z.addElement(N).beforeClearStyles([o]).fromTo(o, 0.1, 0);
          D.addElement(C).beforeClearStyles([o]).fromTo(o, 0.7, 0.03);
          G.addAnimation([Z, D]);
          _.addAnimation([G]);
        }
      }
      O.forEach(function(a2) {
        var t2 = createAnimation();
        t2.addElement(a2);
        var r2 = createAnimation();
        r2.addElement(a2.querySelector("ion-title"));
        var n2 = createAnimation();
        var s2 = a2.querySelectorAll("ion-buttons,[menuToggle]");
        var v2 = a2.closest("ion-header");
        var f2 = v2 === null || v2 === void 0 ? void 0 : v2.classList.contains("header-collapse-condense-inactive");
        var p2 = Array.from(s2).filter(function(a3) {
          var t3 = a3.classList.contains("buttons-collapse");
          return t3 && !f2 || !t3;
        });
        n2.addElement(p2);
        var m2 = createAnimation();
        var u2 = a2.querySelectorAll(":scope > *:not(ion-title):not(ion-buttons):not([menuToggle])");
        if (u2.length > 0) {
          m2.addElement(u2);
        }
        var b2 = createAnimation();
        b2.addElement(shadow(a2).querySelector(".toolbar-background"));
        var h2 = createAnimation();
        var A2 = a2.querySelector("ion-back-button");
        if (A2) {
          h2.addElement(A2);
        }
        t2.addAnimation([r2, n2, m2, h2, b2]);
        g.addAnimation(t2);
        h2.fromTo(o, 0.99, 0);
        n2.fromTo(o, 0.99, 0);
        m2.fromTo(o, 0.99, 0);
        if (d) {
          if (!f2) {
            r2.fromTo("transform", "translateX(".concat(i, ")"), l ? "translateX(-100%)" : "translateX(100%)").fromTo(o, 0.99, 0);
          }
          m2.fromTo("transform", "translateX(".concat(i, ")"), l ? "translateX(-100%)" : "translateX(100%)");
          b2.beforeClearStyles([o, "transform"]);
          var y2 = v2 === null || v2 === void 0 ? void 0 : v2.translucent;
          if (!y2) {
            b2.fromTo(o, "var(--opacity)", 0);
          } else {
            b2.fromTo("transform", "translateX(0px)", l ? "translateX(-100%)" : "translateX(100%)");
          }
          if (A2 && !I) {
            var X2 = createAnimation();
            X2.addElement(shadow(A2).querySelector(".button-text")).fromTo("transform", "translateX(".concat(i, ")"), "translateX(".concat((l ? -124 : 124) + "px", ")"));
            t2.addAnimation(X2);
          }
        } else {
          if (!f2) {
            r2.fromTo("transform", "translateX(".concat(i, ")"), "translateX(".concat(c, ")")).fromTo(o, 0.99, 0).afterClearStyles([e, o]);
          }
          m2.fromTo("transform", "translateX(".concat(i, ")"), "translateX(".concat(c, ")")).afterClearStyles([e, o]);
          h2.afterClearStyles([o]);
          r2.afterClearStyles([o]);
          n2.afterClearStyles([o]);
        }
      });
    }
    return g;
  } catch (a2) {
    throw a2;
  }
};
var LARGE_TITLE_SIZE_OFFSET = 10;

export {
  shadow,
  iosTransitionAnimation
};
/*! Bundled license information:

@ionic/core/dist/esm-es5/ios.transition-a50a9a55.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-ABEB4VNL.js.map
