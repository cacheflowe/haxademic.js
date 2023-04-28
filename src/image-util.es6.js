class ImageUtil {
  static async imageUrlToBase64(url) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((onSuccess, onError) => {
      try {
        const reader = new FileReader();
        reader.onload = function () {
          onSuccess(this.result);
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        onError(e);
      }
    });
  }

  static getOffsetAndSizeToCrop(
    containerW,
    containerH,
    imageW,
    imageH,
    cropFill
  ) {
    let ratioW = containerW / imageW;
    let ratioH = containerH / imageH;
    let shorterRatio = ratioW > ratioH ? ratioH : ratioW;
    let longerRatio = ratioW > ratioH ? ratioW : ratioH;
    let resizedW = cropFill
      ? Math.ceil(imageW * longerRatio)
      : Math.ceil(imageW * shorterRatio);
    let resizedH = cropFill
      ? Math.ceil(imageH * longerRatio)
      : Math.ceil(imageH * shorterRatio);
    let offsetX = Math.ceil((containerW - resizedW) * 0.5);
    let offsetY = Math.ceil((containerH - resizedH) * 0.5);
    return [offsetX, offsetY, resizedW, resizedH];
  }
}

export default ImageUtil;
