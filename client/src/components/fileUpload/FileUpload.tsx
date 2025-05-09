import React, { useState, useRef, useEffect, useId } from 'react';
import classes from './style.module.css';
import Modal from '../modal/Modal';
import { hackathonAPI } from '../../modules/hackathon/hackathonAPI';
import Button from "../button/Button.tsx";

// Расширяем интерфейс для существующих файлов
export interface ExistingFile extends File {
    id: number;
    isExisting: true;
}

// Тип для файлов - обычные или существующие
type FileItem = File | ExistingFile;

type FileUploadProps = {
    onChange: (files: FileItem[]) => void;
    value: FileItem[];
    label?: string;
    acceptedFileTypes?: string;
    maxFileSize?: number;
    maxFiles?: number;
    required?: boolean;
    error?: string;
    placeholder?: string;
};

// Проверка, является ли файл существующим
const isExistingFile = (file: any): file is ExistingFile => {
    return file && 'isExisting' in file && file.isExisting === true;
};

const FileUpload: React.FC<FileUploadProps> = ({
                                                   onChange,
                                                   value = [],
                                                   label,
                                                   acceptedFileTypes = "*",
                                                   maxFileSize,
                                                   maxFiles,
                                                   required = false,
                                                   error,
                                                   placeholder = "Перетащите файлы сюда или нажмите для выбора"
                                               }) => {
    const [dragActive, setDragActive] = useState(false);
    const [localErrors, setLocalErrors] = useState<string[]>([]);
    const [filePreviewUrls, setFilePreviewUrls] = useState<Map<string, string>>(new Map());
    const inputRef = useRef<HTMLInputElement>(null);
    const labelId = useId();

    // Модальное окно подтверждения удаления
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        fileIndex: number | null;
        fileName: string | null;
    }>({ show: false, fileIndex: null, fileName: null });

    // Генерация и кэширование превью для файлов при изменении списка
    useEffect(() => {
        // Новые объекты File можно предварительно просмотреть
        value.forEach((file, index) => {
            if (!isExistingFile(file) && file.type.startsWith('image/')) {
                try {
                    const key = `file-${index}-${file.name}`;
                    if (!filePreviewUrls.has(key)) {
                        const url = URL.createObjectURL(file);
                        setFilePreviewUrls(prev => new Map(prev).set(key, url));
                    }
                } catch (err) {
                    console.error('Ошибка при создании превью:', err);
                }
            }
        });

        // Очистка URL при размонтировании
        return () => {
            filePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [value]);

    useEffect(() => {
        // Очистка локальных ошибок при изменении внешней ошибки
        if (error) {
            setLocalErrors([]);
        }
    }, [error]);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const newErrors: string[] = [];
        const newFiles: File[] = [];

        // Проверка каждого файла
        Array.from(files).forEach(file => {
            // Проверка типа файла
            if (acceptedFileTypes !== "*" && !file.type.match(acceptedFileTypes.replace(/,/g, '|'))) {
                newErrors.push(`Файл "${file.name}" имеет недопустимый формат`);
                return;
            }

            // Проверка размера файла
            if (maxFileSize && file.size > maxFileSize) {
                const sizeMB = Math.round(maxFileSize / 1024 / 1024 * 10) / 10;
                newErrors.push(`Файл "${file.name}" превышает максимальный размер (${sizeMB} МБ)`);
                return;
            }

            newFiles.push(file);
        });

        // Проверка максимального количества файлов
        const totalFiles = [...value, ...newFiles];
        if (maxFiles && totalFiles.length > maxFiles) {
            newErrors.push(`Можно загрузить не более ${maxFiles} файлов`);
            return;
        }

        if (newErrors.length > 0) {
            setLocalErrors(newErrors);
            return;
        }

        onChange([...value, ...newFiles]);
        setLocalErrors([]);
    };

    // Запрос на подтверждение удаления
    const requestRemoveFile = (index: number, e: React.MouseEvent) => {
        e.stopPropagation(); // Предотвращаем распространение события
        setDeleteConfirm({
            show: true,
            fileIndex: index,
            fileName: value[index]?.name || null
        });
    };

    // Удаление файла после подтверждения
    const confirmRemoveFile = () => {
        if (deleteConfirm.fileIndex === null) return;

        const newFiles = [...value];
        newFiles.splice(deleteConfirm.fileIndex, 1);
        onChange(newFiles);

        setDeleteConfirm({ show: false, fileIndex: null, fileName: null });
    };

    // Отмена удаления
    const cancelRemoveFile = () => {
        setDeleteConfirm({ show: false, fileIndex: null, fileName: null });
    };

    // Скачивание файла
    const downloadFile = async (file: FileItem, e: React.MouseEvent) => {
        e.preventDefault();

        try {
            let url: string;
            let blob: Blob;

            if (isExistingFile(file)) {
                // Для файлов с сервера скачиваем через API
                blob = await hackathonAPI.getBlobFile(file.id);
                url = URL.createObjectURL(blob);
            } else {
                // Для локальных файлов создаем URL
                url = URL.createObjectURL(file);
            }

            // Создаем временную ссылку для скачивания
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();

            // Очищаем память
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (error) {
            console.error("Ошибка при скачивании файла:", error);
            alert("Не удалось скачать файл");
        }
    };

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
        // Сброс input для повторного выбора одного и того же файла
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleClick = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    // Форматирование размера файла для отображения
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Байт';

        const k = 1024;
        const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Получение иконки для типа файла
    const getFileIcon = (file: FileItem): string => {
        if (file.type.startsWith('image/')) {
            return '🖼️';
        } else if (file.type.includes('pdf')) {
            return '📄';
        } else if (file.type.includes('word') || file.type.includes('document')) {
            return '📝';
        } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
            return '📊';
        } else if (file.type.includes('video')) {
            return '🎬';
        } else if (file.type.includes('audio')) {
            return '🎵';
        } else if (file.type.includes('zip') || file.type.includes('compressed')) {
            return '🗄️';
        }
        return '📎';
    };

    // Получение URL превью для файла
    const getPreviewUrl = (file: FileItem, index: number): string | null => {
        const key = `file-${index}-${file.name}`;
        if (file.type.startsWith('image/')) {
            if (!isExistingFile(file)) {
                return filePreviewUrls.get(key) || null;
            }
            // Для существующих файлов превью будет загружаться отдельно
            return null;
        }
        return null;
    };

    const isError = error || localErrors.length > 0;

    return (
        <div className={`${classes.fileUpload_container} ${isError ? classes.error : ''}`}>
            {label && (
                <label htmlFor={labelId} className={classes.label}>
                    {label}
                    {required && <span className={classes.required}> *</span>}
                </label>
            )}

            <div
                className={`${classes.dropzone} ${dragActive ? classes.active : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={handleClick}
            >
                <input
                    id={labelId}
                    ref={inputRef}
                    type="file"
                    multiple
                    onChange={handleChange}
                    accept={acceptedFileTypes}
                    className={classes.fileInput}
                />

                <div className={classes.dropzone_content}>
                    <div className={classes.icon}>📂</div>
                    <p className={classes.text}>{placeholder}</p>
                    {maxFileSize && (
                        <p className={classes.hint}>
                            Макс. размер файла: {formatFileSize(maxFileSize)}
                        </p>
                    )}
                    {acceptedFileTypes !== "*" && (
                        <p className={classes.hint}>
                            Допустимые форматы: {acceptedFileTypes.replace(/\./g, '').toUpperCase()}
                        </p>
                    )}
                </div>
            </div>

            {(error || localErrors.length > 0) && (
                <div className={classes.error_message}>
                    {error || localErrors.map((err, i) => <div key={i}>{err}</div>)}
                </div>
            )}

            {value.length > 0 && (
                <div className={classes.filesHeader}>
                    <h4 className={classes.filesListTitle}>Список файлов</h4>
                    <div className={classes.filesHelp}>
                        Нажмите на файл, чтобы скачать его
                    </div>
                </div>
            )}

            {value.length > 0 && (
                <div className={classes.fileList}>
                    {value.map((file, index) => {
                        const preview = getPreviewUrl(file, index);
                        const isExisting = isExistingFile(file);

                        return (
                            <div
                                key={isExisting ? `existing-${(file as ExistingFile).id}-${index}` : `new-${file.name}-${index}`}
                                className={classes.fileItem}
                                onClick={(e) => downloadFile(file, e)}
                            >
                                <div className={classes.filePreview}>
                                    {preview ? (
                                        <img src={preview} alt={file.name} className={classes.previewImage} />
                                    ) : (
                                        <span className={classes.fileIcon}>{getFileIcon(file)}</span>
                                    )}
                                </div>

                                <div className={classes.fileInfo}>
                                    <div className={classes.fileName}>
                                        {file.name}
                                        {isExisting && <span className={classes.existingBadge}> (Загружен)</span>}
                                    </div>
                                    <div className={classes.fileSize}>{formatFileSize(file.size)}</div>
                                </div>

                                {/* Кнопка удаления файла */}
                                <Button
                                    variant={"clear"}
                                    onClick={(e) => requestRemoveFile(index, e)}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Модальное окно подтверждения удаления */}
            <Modal
                isOpen={deleteConfirm.show}
                title={'Удалить файл?'}
                onConfirm={confirmRemoveFile}
                confirmText={'Удалить'}
                onReject={cancelRemoveFile}
                rejectText={'Отмена'}
            >
                <p>
                    Вы уверены, что хотите удалить файл "{deleteConfirm.fileName}"? Это действие нельзя отменить.
                </p>
            </Modal>
        </div>
    );
};

export default FileUpload;