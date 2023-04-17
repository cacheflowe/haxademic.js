class FontUtil {
  static printFontInfoOnLoad() {
    document.fonts.onloadingdone = (fontFaceSetEvent) => {
      // log font info
      console.log(
        "`document` loaded " +
          fontFaceSetEvent.fontfaces.length +
          " font faces:"
      );
      fontFaceSetEvent.fontfaces.forEach((el, i) => {
        console.log("- ", el.family);
      });
    };
  }

  static fontLoadListener(fontName, callback) {
    document.fonts.load(`1rem "${fontName}"`).then(() => {
      callback(fontName);
    });
  }

  static documentFontsLoaded(fontLoadDelay, callback) {
    // if (!document.fonts || document.fonts.status == "loaded") {
    //   // wait another second to make sure fonts are reallllly loaded...
    //   setTimeout(() => callback(), fontLoadDelay);
    // } else {
    // modern browsers can use font-loading browser callback
    document.fonts.onloadingdone = (fontFaceSetEvent) => {
      // log font info
      console.log(
        "`document` loaded " +
          fontFaceSetEvent.fontfaces.length +
          " font faces:"
      );
      fontFaceSetEvent.fontfaces.forEach((el, i) => {
        console.log("- ", el.family);
      });

      // wait another second to make sure fonts are reallllly loaded...
      setTimeout(() => callback(), fontLoadDelay);
    };
    // }
  }
}

export default FontUtil;
