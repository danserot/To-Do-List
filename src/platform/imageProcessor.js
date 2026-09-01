const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Не удалось прочитать изображение"));
    };
    image.src = objectUrl;
  });

export const processProfileImage = async (
  file,
  { maxWidth, maxHeight, quality = 0.82 },
) => {
  if (!file?.type.startsWith("image/")) {
    throw new Error("Выберите файл изображения");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Изображение должно быть меньше 10 МБ");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/webp", quality);
};
