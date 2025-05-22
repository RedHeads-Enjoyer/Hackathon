import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PageLabel from "../../../components/pageLabel/PageLabel.tsx";
import classes from "../hackathon.module.css";
import Error from "../../../components/error/Error.tsx";
import FileUpload, {ExistingFile} from "../../../components/fileUpload/FileUpload.tsx";
import Button from "../../../components/button/Button.tsx";
import Modal from "../../../components/modal/Modal.tsx";
import { HackathonAPI } from "../hackathonAPI.ts";
import Loader from "../../../components/loader/Loader.tsx";
import {FileShort} from "../types.ts";

const ProjectSection = () => {
    const { id } = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;

    // State for managing files
    const [existingFiles, setExistingFiles] = useState<any[]>([]);
    const [filesToDelete, setFilesToDelete] = useState<number[]>([]);
    const [formData, setFormData] = useState<{ documents: File[] }>({ documents: [] });
    const [formDataError, setFormDataError] = useState<{ documents?: string }>({});

    // UI state
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false);
    const [uploadLoading, setUploadLoading] = useState<boolean>(false);
    const [hasChanges, setHasChanges] = useState<boolean>(false);

    // Fetch existing project files
    const convertToExistingFiles = (serverFiles: FileShort[]): ExistingFile[] => {
        return serverFiles.map(file => {
            // Создаем базовый объект
            const baseFile: Partial<ExistingFile> = {
                id: file.id,
                name: file.name || 'Файл',
                size: file.size || 0,
                type: file.type || 'application/octet-stream',
                isExisting: true
            };

            // Добавляем все методы File для совместимости
            return {
                ...baseFile,
                lastModified: new Date().getTime(),
                webkitRelativePath: '',
                arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
                slice: () => new Blob(),
                stream: () => new ReadableStream(),
                text: () => Promise.resolve(''),
            } as ExistingFile;
        });
    };

    // Fetch existing project files
    useEffect(() => {
        const fetchProjectFiles = async () => {
            try {
                setIsLoading(true);
                const teamProject = await HackathonAPI.getTeamProject(hackathonId);

                // If there's a project with files
                if (teamProject && teamProject.length > 0) {
                    const projectFiles = convertToExistingFiles(teamProject);

                    setExistingFiles(projectFiles);
                    setFormData({ documents: [...projectFiles] });
                }
            } catch (err) {
                const errorMessage = (err as Error).message || "Ошибка при загрузке данных проекта";
                setUploadError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProjectFiles();
    }, [hackathonId]);

    // Handle file changes (both adding new and removing existing)
    const handleFilesChange = (files: (File | ExistingFile)[]) => {
        // Check which existing files were removed
        const currentExistingFileIds = new Set(
            files
                .filter((file): file is ExistingFile => 'isExisting' in file && file.isExisting === true)
                .map(file => file.id)
        );

        // Find IDs of existing files that are no longer in the current list
        const newlyDeletedFileIds = existingFiles
            .filter(file => !currentExistingFileIds.has(file.id))
            .map(file => file.id);

        // Add newly deleted files to the list for deletion
        if (newlyDeletedFileIds.length > 0) {
            setFilesToDelete(prev => [...prev, ...newlyDeletedFileIds]);
            setHasChanges(true);
        }

        // Update the documents state
        setFormData({ documents: files });

        // Check if there are new files (not existing ones)
        const hasNewFiles = files.some(file => !('isExisting' in file));
        if (hasNewFiles) {
            setHasChanges(true);
        }

        setFormDataError({ documents: undefined });
    };

    // Handle project upload
    const handleUpload = async () => {
        setUploadModalOpen(false);
        setUploadLoading(true);
        setUploadError(null);

        // Validate if we have files
        if (formData.documents.length === 0) {
            setFormDataError({ documents: "Пожалуйста, загрузите файл проекта" });
            setUploadLoading(false);
            return;
        }

        try {
            const formDataToSend = new FormData();

            // Add project data
            const projectData = {
                files_to_delete: filesToDelete.length > 0 ? filesToDelete : undefined,
            };

            formDataToSend.append('data', JSON.stringify(projectData));

            // Add only new files (not existing ones)
            const newFiles = formData.documents.filter(file => !('isExisting' in file)) as File[];
            newFiles.forEach(file => {
                formDataToSend.append('files', file);
            });

            // Call the API
            await HackathonAPI.uploadProject(hackathonId, formDataToSend);

            // После успешной загрузки получаем свежие данные с сервера
            const freshProjectFiles = await HackathonAPI.getTeamProject(hackathonId);

            // Преобразуем файлы для работы с компонентом
            const updatedFiles = convertToExistingFiles(freshProjectFiles);

            setExistingFiles(updatedFiles);
            setFormData({ documents: updatedFiles });
            setHasChanges(false);
            setFilesToDelete([]);

        } catch (err) {
            const errorMessage = (err as Error).message || "Ошибка при загрузке проекта";
            setUploadError(errorMessage);
        } finally {
            setUploadLoading(false);
        }
    };

    // Show loading indicator while fetching existing files
    if (isLoading) {
        return (
            <div className={classes.page_wrapper}>
                <PageLabel size={'h3'}>Загрузка проекта</PageLabel>
                <Loader />
            </div>
        );
    }

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Загрузка проекта</PageLabel>

            <div className={classes.info_block}>
                <h4 className={classes.block_title}>Файлы проекта</h4>
                <p className={classes.description}>
                    Загрузите файлы вашего проекта. Вы можете загрузить .zip архив с кодом проекта,
                    презентацию, документацию и другие материалы.
                </p>

                <FileUpload
                    label="Проект"
                    required
                    value={formData.documents}
                    onChange={handleFilesChange}
                    acceptedFileTypes=".zip"
                    maxFileSize={100 * 1024 * 1024} // 1GB
                    maxFiles={1}
                    placeholder="Перетащите файлы сюда или нажмите для выбора"
                    error={formDataError.documents}
                />

                <div className={classes.file_help}>
                    <p>Рекомендуем упаковать код проекта в .zip архив. Максимальный размер файла: 1GB.</p>
                </div>
            </div>

            {uploadError && (
                <div className={classes.error_container}>
                    <Error>{uploadError}</Error>
                </div>
            )}

            <div className={classes.button_container}>
                <Button
                    onClick={() => setUploadModalOpen(true)}
                    loading={uploadLoading}
                    disabled={!hasChanges && existingFiles.length > 0}
                >
                    {existingFiles.length > 0 ? "Обновить проект" : "Загрузить проект"}
                </Button>
            </div>

            <Modal
                isOpen={uploadModalOpen}
                rejectText={"Отмена"}
                confirmText={"Подтверждаю"}
                title={"Подтверждение действия"}
                onReject={() => setUploadModalOpen(false)}
                onConfirm={handleUpload}
            >
                <p>
                    {existingFiles.length > 0
                        ? "Вы уверены, что хотите обновить файлы проекта? Файлы, которые вы удалили, будут безвозвратно удалены с сервера."
                        : "Подтвердите загрузку проекта"}
                </p>
            </Modal>
        </div>
    );
};

export default ProjectSection;