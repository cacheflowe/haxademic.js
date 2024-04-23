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

  static async loadImageSync(imagePath) {
    const img = new Image();
    img.src = imagePath;
    await img.decode(); // wait for image to load: https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/decode
    return img;
  }

  static async blobToImage(blob) {
    return await ImageUtil.loadImageSync(URL.createObjectURL(blob));
  }

  static pasteImageCallback(callback) {
    document.addEventListener("paste", async (e) => {
      e.preventDefault();
      const clipboardItems =
        typeof navigator?.clipboard?.read === "function"
          ? await navigator.clipboard.read()
          : e.clipboardData.files;

      for (const clipboardItem of clipboardItems) {
        let blob;
        if (clipboardItem.type?.startsWith("image/")) {
          // For files from `e.clipboardData.files`.
          blob = clipboardItem;
          // Do something with the blob.
          callback(await ImageUtil.blobToImage(blob));
        } else {
          // For files from `navigator.clipboard.read()`.
          const imageTypes = clipboardItem.types?.filter((type) =>
            type.startsWith("image/")
          );
          for (const imageType of imageTypes) {
            blob = await clipboardItem.getType(imageType);
            // Do something with the blob.
            callback(await ImageUtil.blobToImage(blob));
          }
        }
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
