class KeyboardUtil {
  constructor() {}

  static addKeyCodeListener(keycode, callback) {
    window.addEventListener("keydown", (e) => {
      var key = e.keyCode ? e.keyCode : e.which;
      // console.log(key);
      if (key == keycode) {
        callback(e);
      }
    });
  }

  static addKeyListener(callback) {
    window.addEventListener("keydown", (e) => {
      callback(e);
    });
  }

  static addSingleKeyListener(key, callback, debug = false) {
    window.addEventListener("keydown", (e) => {
      if (debug) console.log(e);
      if (e.key == key) {
        callback(e);
      }
    });
  }

  static keyPressSimulateOnTextfield(el, keyCode, character) {
    // let the page know that the input has changed
    if (keyCode != 8 && character.length > 0) {
      // add character
      el.value = el.value + character;
    } else {
      // delete character off end
      if (el.value.length > 0)
        el.value = el.value.substring(0, el.value.length - 1);
    }
  }

  static keyInputStreamListener(callback, timeWindow = 200) {
    let charStream = [];

    window.addEventListener("keydown", (e) => {
      let key = e.key;
      if (key.length > 1) return; // ignore non alpha-numeric characters
      charStream.push({ key: key, time: Date.now() });
      charStream = charStream.filter((char) => {
        return char.time > Date.now() - timeWindow;
      });
      let recentString = charStream.map((c) => c.key).join("");
      if (callback) callback(recentString);
    });
  }
}

// MDN docs with key coes & values: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
// Special non-character `e.key` values: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values

KeyboardUtil.KEYS = {
  Alt: "Alt",
  ArrowUp: "ArrowUp",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  ArrowDown: "ArrowDown",
  Backspace: "Backspace",
  CapsLock: "CapsLock",
  Clear: "Clear",
  Control: "Control",
  Delete: "Delete",
  End: "End",
  Enter: "Enter",
  Escape: "Escape",
  Home: "Home",
  Insert: "Insert",
  Meta: "Meta",
  NumLock: "NumLock",
  PageDown: "PageDown",
  PageUp: "PageUp",
  Shift: "Shift",
  Tab: "Tab",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
  F13: "F13",
  F14: "F14",
  F15: "F15",
  F16: "F16",
  F17: "F17",
  F18: "F18",
  F19: "F19",
};

// `e.keyCode` values (supposedly deprecated)

KeyboardUtil.KEYCODES = {
  CANCEL: 3,
  HELP: 6,
  BACK_SPACE: 8,
  TAB: 9,
  CLEAR: 12,
  ENTER: 13,
  ENTER_SPECIAL: 14,
  SHIFT: 16,
  CONTROL: 17,
  ALT: 18,
  PAUSE: 19,
  CAPS_LOCK: 20,
  KANA: 21,
  EISU: 22,
  JUNJA: 23,
  FINAL: 24,
  HANJA: 25,
  ESCAPE: 27,
  CONVERT: 28,
  NONCONVERT: 29,
  ACCEPT: 30,
  MODECHANGE: 31,
  SPACE: 32,
  PAGE_UP: 33,
  PAGE_DOWN: 34,
  END: 35,
  HOME: 36,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  SELECT: 41,
  PRINT: 42,
  EXECUTE: 43,
  PRINTSCREEN: 44,
  INSERT: 45,
  DELETE: 46,
  0: 48,
  1: 49,
  2: 50,
  3: 51,
  4: 52,
  5: 53,
  6: 54,
  7: 55,
  8: 56,
  9: 57,
  COLON: 58,
  SEMICOLON: 59,
  LESS_THAN: 60,
  EQUALS: 61,
  GREATER_THAN: 62,
  QUESTION_MARK: 63,
  AT: 64,
  A: 65,
  B: 66,
  C: 67,
  D: 68,
  E: 69,
  F: 70,
  G: 71,
  H: 72,
  I: 73,
  J: 74,
  K: 75,
  L: 76,
  M: 77,
  N: 78,
  O: 79,
  P: 80,
  Q: 81,
  R: 82,
  S: 83,
  T: 84,
  U: 85,
  V: 86,
  W: 87,
  X: 88,
  Y: 89,
  Z: 90,
  OS_KEY: 91, // Windows Key (Windows) or Command Key (Mac,
  CONTEXT_MENU: 93,
  SLEEP: 95,
  NUMPAD0: 96,
  NUMPAD1: 97,
  NUMPAD2: 98,
  NUMPAD3: 99,
  NUMPAD4: 100,
  NUMPAD5: 101,
  NUMPAD6: 102,
  NUMPAD7: 103,
  NUMPAD8: 104,
  NUMPAD9: 105,
  MULTIPLY: 106,
  ADD: 107,
  SEPARATOR: 108,
  SUBTRACT: 109,
  DECIMAL: 110,
  DIVIDE: 111,
  F1: 112,
  F2: 113,
  F3: 114,
  F4: 115,
  F5: 116,
  F6: 117,
  F7: 118,
  F8: 119,
  F9: 120,
  F10: 121,
  F11: 122,
  F12: 123,
  F13: 124,
  F14: 125,
  F15: 126,
  F16: 127,
  F17: 128,
  F18: 129,
  F19: 130,
  F20: 131,
  F21: 132,
  F22: 133,
  F23: 134,
  F24: 135,
  NUM_LOCK: 144,
  SCROLL_LOCK: 145,
  CIRCUMFLEX: 160,
  EXCLAMATION: 161,
  DOUBLE_QUOTE: 162,
  HASH: 163,
  DOLLAR: 164,
  PERCENT: 165,
  AMPERSAND: 166,
  UNDERSCORE: 167,
  OPEN_PAREN: 168,
  CLOSE_PAREN: 169,
  ASTERISK: 170,
  PLUS: 171,
  PIPE: 172,
  HYPHEN_MINUS: 173,
  OPEN_CURLY_BRACKET: 174,
  CLOSE_CURLY_BRACKET: 175,
  TILDE: 176,
  VOLUME_MUTE: 181,
  VOLUME_DOWN: 182,
  VOLUME_UP: 183,
  SEMICOLON: 186,
  EQUALS: 187,
  COMMA: 188,
  MINUS: 189,
  PERIOD: 190,
  SLASH: 191,
  BACK_QUOTE: 192,
  OPEN_BRACKET: 219,
  BACK_SLASH: 220,
  CLOSE_BRACKET: 221,
  QUOTE: 222,
  META: 224,
  ALTGR: 225,
  WIN_ICO_HELP: 227,
  WIN_ICO_00: 228,
  WIN_ICO_CLEAR: 230,
  WIN_OEM_RESET: 233,
  WIN_OEM_JUMP: 234,
  WIN_OEM_PA1: 235,
  WIN_OEM_PA2: 236,
  WIN_OEM_PA3: 237,
  WIN_OEM_WSCTRL: 238,
  WIN_OEM_CUSEL: 239,
  WIN_OEM_ATTN: 240,
  WIN_OEM_FINISH: 241,
  WIN_OEM_COPY: 242,
  WIN_OEM_AUTO: 243,
  WIN_OEM_ENLW: 244,
  WIN_OEM_BACKTAB: 245,
  ATTN: 246,
  CRSEL: 247,
  EXSEL: 248,
  EREOF: 249,
  PLAY: 250,
  ZOOM: 251,
  PA1: 253,
  WIN_OEM_CLEAR: 254,
};

export default KeyboardUtil;
