class FontUtil {

  static printFontInfoOnLoad() {
    document.fonts.onloadingdone = (fontFaceSetEvent) => {
      // log font info
      console.log('`document` loaded ' + fontFaceSetEvent.fontfaces.length + ' font faces:');
      fontFaceSetEvent.fontfaces.forEach((el, i) => {
        console.log('- ', el.family);
      });
    };
  }

  static fontLoadListener(fontName, callback) {
    document.fonts.load(`1rem "${fontName}"`).then(() => {
      callback();
    });
  }

}

export default FontUtil;
