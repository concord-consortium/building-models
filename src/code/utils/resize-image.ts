export const resizeImage = (src, callback) => {

  const fail = () => callback(src);

  if (typeof document !== "undefined" && document !== null) {
    const maxWidth = 50;
    const maxHeight = 50;

    const img = document.createElement("img");
    img.setAttribute("crossOrigin", "anonymous");
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let {width, height} = img;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(img, 0, 0, width, height);
      }

      return callback(canvas.toDataURL("image/png"));
    };

    return img.onerror = e => fail();
  } else {
    return fail();
  }
};
