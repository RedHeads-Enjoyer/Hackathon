export const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any,
    returnBlob: boolean = false
): Promise<string | Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Установка размеров
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Отрисовка
    ctx?.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Если нужен Blob
    if (returnBlob) {
        return new Promise<Blob>((resolve) => {
            canvas.toBlob(blob => {
                resolve(blob!);
            }, 'image/jpeg', 0.85);
        });
    }

    // Если нужна строка base64
    return canvas.toDataURL('image/jpeg', 0.85);
};

function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });
}