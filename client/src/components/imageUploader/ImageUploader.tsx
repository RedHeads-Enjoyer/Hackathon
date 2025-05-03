import React, { useState, useRef } from 'react';
import classes from './style.module.css';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './imageUtils';
import Modal from '../../components/modal/Modal.tsx';

interface ImageUploaderProps {
    onImageChange: (croppedImage: File) => void;
    initialImage?: string | File | null; // Изменено здесь
    required?: boolean;
    error?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
                                                         onImageChange,
                                                         initialImage = null,
                                                         required = false,
                                                         error = ''
                                                     }) => {

    const getInitialImageUrl = () => {
        if (!initialImage) return null;
        if (typeof initialImage === 'string') return initialImage;
        return URL.createObjectURL(initialImage);
    };

    const [originalImage, setOriginalImage] = useState<string | null>(null);
    const [croppedImage, setCroppedImage] = useState<string | null>(getInitialImageUrl());
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);



    // Остальной код компонента не изменяется
    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    };

    const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const imageDataUrl = await readFile(file);
            openEditor(imageDataUrl);
        }
    };

    const openEditor = (imageSrc: string) => {
        setOriginalImage(imageSrc);
        setIsModalOpen(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleSave = async () => {
        try {
            if (!originalImage || !croppedAreaPixels) return;

            // Получаем результат и проверяем тип
            const result = await getCroppedImg(originalImage, croppedAreaPixels, true);

            // Проверяем, что это Blob
            if (result instanceof Blob) {
                const croppedFile = new File([result], 'cover-image.jpg', { type: 'image/jpeg' });
                const previewUrl = URL.createObjectURL(result);
                setCroppedImage(previewUrl);
                onImageChange(croppedFile);
            } else {
                console.error('Expected Blob but got string');
            }

            setIsModalOpen(false);
        } catch (e) {
            console.error('Ошибка обрезки изображения', e);
        }
    };

    const handleEdit = () => {
        handleUploadClick();
    };

    // Определяем класс для контейнера с учетом ошибки
    const containerClass = error ? `${classes.container} ${classes.error}` : classes.container;
    const uploadAreaClass = error ? `${classes.uploadArea} ${classes.errorArea}` : classes.uploadArea;

    return (
        <div className={containerClass}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                className={classes.fileInput}
            />

            {croppedImage ? (
                <div className={classes.previewContainer} onClick={handleEdit}>
                    <img
                        src={croppedImage}
                        alt="Cropped preview"
                        className={classes.previewImage}
                    />
                    <div className={classes.editOverlay}>
                        <span>Изменить</span>
                    </div>
                </div>
            ) : (
                <div className={uploadAreaClass} onClick={handleUploadClick}>
                    <div className={classes.placeholder}>
                        <span>+</span>
                        <p>
                            Загрузить изображение
                            {required && <span className={classes.required}>*</span>}
                        </p>

                    </div>
                </div>
            )}

            {error && <div className={classes.errorMessage}>{error}</div>}

            <Modal
                isOpen={isModalOpen}
                title={"Обрежьте изображение"}
                rejectText={"Отмена"}
                confirmText={"Сохранить"}
                onReject={() => setIsModalOpen(false)}
                onConfirm={handleSave}
            >
                <div className={classes.cropContainer}>
                    {originalImage && (
                        <Cropper
                            image={originalImage}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
};

function readFile(file: File): Promise<string> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result as string), false);
        reader.readAsDataURL(file);
    });
}

export default ImageUploader;