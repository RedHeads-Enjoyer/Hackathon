import React, { useState } from 'react';
import classes from  './hackathon.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import TextArea from "../../components/textArea/TextArea.tsx";
import ImageUploader from "../../components/imageUploader/ImageUploader.tsx";

interface Stage {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
}

interface Criteria {
    id: string;
    name: string;
    minScore: number;
    maxScore: number;
}

interface Prize {
    id: string;
    place: number;
    reward: string;
}

interface Sponsor {
    id: string;
    name: string;
    website: string;
}



const CreateHackathonPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        coverImage: null as string | null,
        croppedImage: null as string | null,
        goals: [''],
        stages: [] as Stage[],
        criteria: [] as Criteria[],
        technologies: [] as string[],
        prizes: [] as Prize[],
        prizePool: '',
        sponsors: [] as Sponsor[],
        minTeamSize: 1,
        maxTeamSize: 5,
        currentTechnology: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => {
            // Обработка простых текстовых полей и чисел
            if (name in prev && !Array.isArray(prev[name as keyof typeof prev])) {
                return {
                    ...prev,
                    [name]: type === 'number' ? Number(value) :
                        type === 'checkbox' ? checked :
                            value
                };
            }

            // Обработка массивов technologies (если у вас есть чекбоксы для технологий)
            if (name === 'technologies') {
                return {
                    ...prev,
                    technologies: checked
                        ? [...prev.technologies, value]
                        : prev.technologies.filter(tech => tech !== value)
                };
            }

            // Обработка вложенных объектов (если есть)
            if (name.includes('.')) {
                const [parentKey, childKey] = name.split('.');
                return {
                    ...prev,
                    [parentKey]: {
                        ...(prev[parentKey as keyof typeof prev] as object),
                        [childKey]: value
                    }
                };
            }

            return prev;
        });
    };

    const handleImageCrop = (croppedImage: string) => {
        console.log('Cropped image:', croppedImage); // Добавьте эту строку
        setFormData(prev => ({
            ...prev,
            croppedImage,
            coverImage: croppedImage
        }));
    };

    return (
    <div className={classes.page_wrapper}>
        <PageLabel size={'h3'}>Создание хакатона</PageLabel>
        <Input
            label={"Название хакатона"}
            type={"text"}
            value={formData.name}
            onChange={handleChange}
            name={'name'}
            placeholder={'Лучший хакатон'}
        />
        <TextArea
            label="Описание хакатона"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Самый лучший хакатон"
            minRows={5}
            maxRows={10}
        />
        <ImageUploader
            onImageChange={handleImageCrop}
            initialImage={formData.coverImage}
        />

    </div>
    );
};

export default CreateHackathonPage;