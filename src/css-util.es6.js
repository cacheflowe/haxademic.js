class CSSUtil {
  static printFontInfoOnLoad(cssVarName) {
    return getComputedStyle(document.documentElement).getPropertyValue(
      cssVarName
    );
  }
}

export default CSSUtil;
