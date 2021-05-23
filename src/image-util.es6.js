class ImageUtil {

  static getOffsetAndSizeToCrop(containerW, containerH, imageW, imageH, cropFill) {
    let ratioW = containerW / imageW;
    let ratioH = containerH / imageH;
    let shorterRatio = ratioW > ratioH ? ratioH : ratioW;
    let longerRatio = ratioW > ratioH ? ratioW : ratioH;
    let resizedW = cropFill ? Math.ceil(imageW * longerRatio) : Math.ceil(imageW * shorterRatio);
    let resizedH = cropFill ? Math.ceil(imageH * longerRatio) : Math.ceil(imageH * shorterRatio);
    let offsetX = Math.ceil((containerW - resizedW) * 0.5);
    let offsetY = Math.ceil((containerH - resizedH) * 0.5);
    return [offsetX, offsetY, resizedW, resizedH];
  }

}

export default ImageUtil;
