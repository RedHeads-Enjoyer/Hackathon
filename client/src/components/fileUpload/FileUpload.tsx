import React, { useState, useRef, useEffect, useId } from 'react';
import classes from './style.module.css';
import Modal from '../modal/Modal'; // Импортируем компонент Modal

type FileUploadProps = {
    onChange: (files: File[]) => void;
    value: File[];
    label?: string;
    acceptedFileTypes?: string;
    maxFileSize?: number;
    maxFiles?: number;
    required?: boolean;
    error?: string;
    placeholder?: string;
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
    const inputRef = useRef<HTMLInputElement>(null);
    const labelId = useId();

    // Добавляем состояние для модального окна подтверждения удаления
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        fileIndex: number | null;
        fileName: string | null;
    }>({ show: false, fileIndex: null, fileName: null });

    useEffect(() => {
        // Clear local errors when external error changes
        if (error) {
            setLocalErrors([]);
        }
    }, [error]);

    const handleFiles = (files: FileList | null) => {
        if (!files) return;

        const newErrors: string[] = [];
        const newFiles: File[] = [];

        // Convert FileList to array and validate
        Array.from(files).forEach(file => {
            // Check file type if acceptedFileTypes is provided
            if (acceptedFileTypes !== "*" && !file.type.match(acceptedFileTypes.replace(/,/g, '|'))) {
                newErrors.push(`Файл "${file.name}" имеет недопустимый формат`);
                return;
            }

            // Check file size if maxFileSize is provided
            if (maxFileSize && file.size > maxFileSize) {
                const sizeMB = Math.round(maxFileSize / 1024 / 1024 * 10) / 10;
                newErrors.push(`Файл "${file.name}" превышает максимальный размер (${sizeMB} МБ)`);
                return;
            }

            newFiles.push(file);
        });

        // Check max files limit
        const totalFiles = [...value, ...newFiles];
        if (maxFiles && totalFiles.length > maxFiles) {
            newErrors.push(`Можно загрузить не более ${maxFiles} файлов`);
            return;
        }

        if (newErrors.length > 0) {
            setLocalErrors(newErrors);
            return;
        }

        onChange(totalFiles);
        setLocalErrors([]);
    };

    // Заменим прямое удаление на запрос подтверждения
    const requestRemoveFile = (index: number) => {
        setDeleteConfirm({
            show: true,
            fileIndex: index,
            fileName: value[index]?.name || null
        });
    };

    // Функция для выполнения удаления после подтверждения
    const confirmRemoveFile = () => {
        if (deleteConfirm.fileIndex === null) return;

        const newFiles = [...value];
        newFiles.splice(deleteConfirm.fileIndex, 1);
        onChange(newFiles);

        setDeleteConfirm({ show: false, fileIndex: null, fileName: null });
    };

    // Функция для отмены удаления
    const cancelRemoveFile = () => {
        setDeleteConfirm({ show: false, fileIndex: null, fileName: null });
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
        // Reset input to allow selecting the same file again
        if (inputRef.current) inputRef.current.value = '';
    };

    const handleClick = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    };

    // Format file size for display
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Байт';

        const k = 1024;
        const sizes = ['Байт', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Get file icon based on type
    const getFileIcon = (file: File): string => {
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

    // Generate preview for image files
    const getPreviewUrl = (file: File): string | null => {
        return file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
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
                        Для удаления файла кликните на него
                    </div>
                </div>
            )}

            {value.length > 0 && (
                <div className={classes.fileList}>
                    {value.map((file, index) => {
                        const preview = getPreviewUrl(file);

                        return (
                            <div
                                key={`${file.name}-${index}`}
                                className={classes.fileItem}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    requestRemoveFile(index);
                                }}
                            >
                                <div className={classes.filePreview}>
                                    {preview ? (
                                        <img src={preview} alt={file.name} className={classes.previewImage} />
                                    ) : (
                                        <span className={classes.fileIcon}>{getFileIcon(file)}</span>
                                    )}
                                </div>

                                <div className={classes.fileInfo}>
                                    <div className={classes.fileName}>{file.name}</div>
                                    <div className={classes.fileSize}>{formatFileSize(file.size)}</div>
                                </div>
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