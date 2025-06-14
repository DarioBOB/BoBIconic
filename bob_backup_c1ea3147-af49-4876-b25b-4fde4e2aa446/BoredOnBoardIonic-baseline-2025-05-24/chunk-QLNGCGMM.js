import {
  getMode,
  setMode,
  setPlatformHelpers
} from "./chunk-72VSVBTI.js";
import {
  win
} from "./chunk-R3LVCYXH.js";
import {
  __async
} from "./chunk-UQIXM5CJ.js";

// node_modules/@ionic/core/components/ionic-global.js
var Config = class {
  constructor() {
    this.m = /* @__PURE__ */ new Map();
  }
  reset(configObj) {
    this.m = new Map(Object.entries(configObj));
  }
  get(key, fallback) {
    const value = this.m.get(key);
    return value !== void 0 ? value : fallback;
  }
  getBoolean(key, fallback = false) {
    const val = this.m.get(key);
    if (val === void 0) {
      return fallback;
    }
    if (typeof val === "string") {
      return val === "true";
    }
    return !!val;
  }
  getNumber(key, fallback) {
    const val = parseFloat(this.m.get(key));
    return isNaN(val) ? fallback !== void 0 ? fallback : NaN : val;
  }
  set(key, value) {
    this.m.set(key, value);
  }
};
var config = new Config();
var configFromSession = (win2) => {
  try {
    const configStr = win2.sessionStorage.getItem(IONIC_SESSION_KEY);
    return configStr !== null ? JSON.parse(configStr) : {};
  } catch (e) {
    return {};
  }
};
var saveConfig = (win2, c) => {
  try {
    win2.sessionStorage.setItem(IONIC_SESSION_KEY, JSON.stringify(c));
  } catch (e) {
    return;
  }
};
var configFromURL = (win2) => {
  const configObj = {};
  win2.location.search.slice(1).split("&").map((entry) => entry.split("=")).map(([key, value]) => [decodeURIComponent(key), decodeURIComponent(value)]).filter(([key]) => startsWith(key, IONIC_PREFIX)).map(([key, value]) => [key.slice(IONIC_PREFIX.length), value]).forEach(([key, value]) => {
    configObj[key] = value;
  });
  return configObj;
};
var startsWith = (input, search) => {
  return input.substr(0, search.length) === search;
};
var IONIC_PREFIX = "ionic:";
var IONIC_SESSION_KEY = "ionic-persist-config";
var getPlatforms = (win2) => setupPlatforms(win2);
var isPlatform = (winOrPlatform, platform) => {
  if (typeof winOrPlatform === "string") {
    platform = winOrPlatform;
    winOrPlatform = void 0;
  }
  return getPlatforms(winOrPlatform).includes(platform);
};
var setupPlatforms = (win2 = window) => {
  if (typeof win2 === "undefined") {
    return [];
  }
  win2.Ionic = win2.Ionic || {};
  let platforms = win2.Ionic.platforms;
  if (platforms == null) {
    platforms = win2.Ionic.platforms = detectPlatforms(win2);
    platforms.forEach((p) => win2.document.documentElement.classList.add(`plt-${p}`));
  }
  return platforms;
};
var detectPlatforms = (win2) => {
  const customPlatformMethods = config.get("platform");
  return Object.keys(PLATFORMS_MAP).filter((p) => {
    const customMethod = customPlatformMethods === null || customPlatformMethods === void 0 ? void 0 : customPlatformMethods[p];
    return typeof customMethod === "function" ? customMethod(win2) : PLATFORMS_MAP[p](win2);
  });
};
var isMobileWeb = (win2) => isMobile(win2) && !isHybrid(win2);
var isIpad = (win2) => {
  if (testUserAgent(win2, /iPad/i)) {
    return true;
  }
  if (testUserAgent(win2, /Macintosh/i) && isMobile(win2)) {
    return true;
  }
  return false;
};
var isIphone = (win2) => testUserAgent(win2, /iPhone/i);
var isIOS = (win2) => testUserAgent(win2, /iPhone|iPod/i) || isIpad(win2);
var isAndroid = (win2) => testUserAgent(win2, /android|sink/i);
var isAndroidTablet = (win2) => {
  return isAndroid(win2) && !testUserAgent(win2, /mobile/i);
};
var isPhablet = (win2) => {
  const width = win2.innerWidth;
  const height = win2.innerHeight;
  const smallest = Math.min(width, height);
  const largest = Math.max(width, height);
  return smallest > 390 && smallest < 520 && largest > 620 && largest < 800;
};
var isTablet = (win2) => {
  const width = win2.innerWidth;
  const height = win2.innerHeight;
  const smallest = Math.min(width, height);
  const largest = Math.max(width, height);
  return isIpad(win2) || isAndroidTablet(win2) || smallest > 460 && smallest < 820 && largest > 780 && largest < 1400;
};
var isMobile = (win2) => matchMedia(win2, "(any-pointer:coarse)");
var isDesktop = (win2) => !isMobile(win2);
var isHybrid = (win2) => isCordova(win2) || isCapacitorNative(win2);
var isCordova = (win2) => !!(win2["cordova"] || win2["phonegap"] || win2["PhoneGap"]);
var isCapacitorNative = (win2) => {
  const capacitor = win2["Capacitor"];
  return !!(capacitor === null || capacitor === void 0 ? void 0 : capacitor.isNative);
};
var isElectron = (win2) => testUserAgent(win2, /electron/i);
var isPWA = (win2) => {
  var _a;
  return !!(((_a = win2.matchMedia) === null || _a === void 0 ? void 0 : _a.call(win2, "(display-mode: standalone)").matches) || win2.navigator.standalone);
};
var testUserAgent = (win2, expr) => expr.test(win2.navigator.userAgent);
var matchMedia = (win2, query) => {
  var _a;
  return (_a = win2.matchMedia) === null || _a === void 0 ? void 0 : _a.call(win2, query).matches;
};
var PLATFORMS_MAP = {
  ipad: isIpad,
  iphone: isIphone,
  ios: isIOS,
  android: isAndroid,
  phablet: isPhablet,
  tablet: isTablet,
  cordova: isCordova,
  capacitor: isCapacitorNative,
  electron: isElectron,
  pwa: isPWA,
  mobile: isMobile,
  mobileweb: isMobileWeb,
  desktop: isDesktop,
  hybrid: isHybrid
};
var defaultMode;
var getIonMode = (ref) => {
  return ref && getMode(ref) || defaultMode;
};
var initialize = (userConfig = {}) => {
  if (typeof window === "undefined") {
    return;
  }
  const doc = window.document;
  const win2 = window;
  const Ionic = win2.Ionic = win2.Ionic || {};
  const platformHelpers = {};
  if (userConfig._ael) {
    platformHelpers.ael = userConfig._ael;
  }
  if (userConfig._rel) {
    platformHelpers.rel = userConfig._rel;
  }
  if (userConfig._ce) {
    platformHelpers.ce = userConfig._ce;
  }
  setPlatformHelpers(platformHelpers);
  const configObj = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, configFromSession(win2)), { persistConfig: false }), Ionic.config), configFromURL(win2)), userConfig);
  config.reset(configObj);
  if (config.getBoolean("persistConfig")) {
    saveConfig(win2, configObj);
  }
  setupPlatforms(win2);
  Ionic.config = config;
  Ionic.mode = defaultMode = config.get("mode", doc.documentElement.getAttribute("mode") || (isPlatform(win2, "ios") ? "ios" : "md"));
  config.set("mode", defaultMode);
  doc.documentElement.setAttribute("mode", defaultMode);
  doc.documentElement.classList.add(defaultMode);
  if (config.getBoolean("_testing")) {
    config.set("animated", false);
  }
  const isIonicElement = (elm) => {
    var _a;
    return (_a = elm.tagName) === null || _a === void 0 ? void 0 : _a.startsWith("ION-");
  };
  const isAllowedIonicModeValue = (elmMode) => ["ios", "md"].includes(elmMode);
  setMode((elm) => {
    while (elm) {
      const elmMode = elm.mode || elm.getAttribute("mode");
      if (elmMode) {
        if (isAllowedIonicModeValue(elmMode)) {
          return elmMode;
        } else if (isIonicElement(elm)) {
          console.warn('Invalid ionic mode: "' + elmMode + '", expected: "ios" or "md"');
        }
      }
      elm = elm.parentElement;
    }
    return defaultMode;
  });
};

// node_modules/@ionic/core/components/hardware-back-button.js
var shouldUseCloseWatcher = () => config.get("experimentalCloseWatcher", false) && win !== void 0 && "CloseWatcher" in win;
var blockHardwareBackButton = () => {
  document.addEventListener("backbutton", () => {
  });
};
var startHardwareBackButton = () => {
  const doc = document;
  let busy = false;
  const backButtonCallback = () => {
    if (busy) {
      return;
    }
    let index = 0;
    let handlers = [];
    const ev = new CustomEvent("ionBackButton", {
      bubbles: false,
      detail: {
        register(priority, handler) {
          handlers.push({ priority, handler, id: index++ });
        }
      }
    });
    doc.dispatchEvent(ev);
    const executeAction = (handlerRegister) => __async(void 0, null, function* () {
      try {
        if (handlerRegister === null || handlerRegister === void 0 ? void 0 : handlerRegister.handler) {
          const result = handlerRegister.handler(processHandlers);
          if (result != null) {
            yield result;
          }
        }
      } catch (e) {
        console.error(e);
      }
    });
    const processHandlers = () => {
      if (handlers.length > 0) {
        let selectedHandler = {
          priority: Number.MIN_SAFE_INTEGER,
          handler: () => void 0,
          id: -1
        };
        handlers.forEach((handler) => {
          if (handler.priority >= selectedHandler.priority) {
            selectedHandler = handler;
          }
        });
        busy = true;
        handlers = handlers.filter((handler) => handler.id !== selectedHandler.id);
        executeAction(selectedHandler).then(() => busy = false);
      }
    };
    processHandlers();
  };
  if (shouldUseCloseWatcher()) {
    let watcher;
    const configureWatcher = () => {
      watcher === null || watcher === void 0 ? void 0 : watcher.destroy();
      watcher = new win.CloseWatcher();
      watcher.onclose = () => {
        backButtonCallback();
        configureWatcher();
      };
    };
    configureWatcher();
  } else {
    doc.addEventListener("backbutton", backButtonCallback);
  }
};
var OVERLAY_BACK_BUTTON_PRIORITY = 100;
var MENU_BACK_BUTTON_PRIORITY = 99;

export {
  config,
  getPlatforms,
  isPlatform,
  getIonMode,
  initialize,
  shouldUseCloseWatcher,
  blockHardwareBackButton,
  startHardwareBackButton,
  OVERLAY_BACK_BUTTON_PRIORITY,
  MENU_BACK_BUTTON_PRIORITY
};
/*! Bundled license information:

@ionic/core/components/ionic-global.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)

@ionic/core/components/hardware-back-button.js:
  (*!
   * (C) Ionic http://ionicframework.com - MIT License
   *)
*/
//# sourceMappingURL=chunk-QLNGCGMM.js.map
