import React, { useState } from 'react';
import classes from './hackathon.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import Input from "../../components/input/Input.tsx";
import TextArea from "../../components/textArea/TextArea.tsx";
import ImageUploader from "../../components/imageUploader/ImageUploader.tsx";
import StepsListWithDates from "../../components/stepsListWithDates/StepsListWithDates.tsx";
import {Stage} from "../../components/stepsListWithDates/types.ts";
import TechnologyStackInput from "../../components/technologyStackInput/TechnologyStackInput.tsx";
import CriteriaEditor from "../../components/criteriaEditor/CriteriaEditor.tsx";
import AwardsEditor from "../../components/awardsEditor/AwardsEditor.tsx";
import SponsorsEditor from "../../components/sponsorsEditor/SponsorsEditor.tsx";
import DatePicker from "../../components/datePicker/DatePicker.tsx";

interface Criteria {
    id: string;
    name: string;
    minScore: number;
    maxScore: number;
}

interface Prize {
    id: string;
    placeFrom: number;
    placeTo: number;
    description: string;
}

interface Sponsor {
    id: string;
    name: string;
    url: string;
}

const CreateHackathonPage: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        coverImage: null as string | null,
        registrationStart: '',
        registrationEnd: '',
        hackathonStart: '',
        goals: [''],
        stages: [] as Stage[],
        criteria: [] as Criteria[],
        technologies: [] as string[],
        prizes: [] as Prize[],
        sponsors: [] as Sponsor[],
        minTeamSize: 1,
        maxTeamSize: 5,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) :
                type === 'checkbox' ? checked :
                    value
        }));
    };

    const handleDateChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCriteriaChange = (criteria: Criteria[]) => {
        setFormData(prev => ({
            ...prev,
            criteria
        }));
    };

    const handleImageCrop = (croppedImage: string) => {
        setFormData(prev => ({
            ...prev,
            croppedImage,
            coverImage: croppedImage
        }));
    };

    const handlePrizesChange = (prizes: Prize[]) => {
        setFormData(prev => ({
            ...prev,
            prizes
        }));
    };

    const handleSponsorsChange = (sponsors: Sponsor[]) => {
        setFormData(prev => ({
            ...prev,
            sponsors
        }));
    };

    const handleStagesChange = (stages: Stage[]) => {
        setFormData(prev => ({
            ...prev,
            stages
        }));
    };

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Создание хакатона</PageLabel>

            {/* Блок 1: Основные данные */}
            <div className={classes.info_block}>
                <h4 className={classes.block_title}>Основные данные</h4>
                <div className={classes.basic_info_grid}>
                    <div className={classes.text_info}>
                        <Input
                            label="Название хакатона"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            name="name"
                            placeholder="Введите название"
                        />
                        <TextArea
                            label="Описание хакатона"
                            value={formData.description}
                            onChange={handleChange}
                            name="description"
                            placeholder="Опишите ваш хакатон"
                            minRows={4}
                        />
                    </div>
                    <div className={classes.image_info}>
                        <ImageUploader
                            onImageChange={handleImageCrop}
                            initialImage={formData.coverImage}
                        />
                    </div>
                </div>
            </div>

            {/* Блок 2: Даты */}
            <div className={classes.info_block}>
                <h4 className={classes.block_title}>Даты проведения</h4>
                <div className={classes.dates_grid}>
                    <DatePicker
                        label="Начало регистрации"
                        value={formData.registrationStart}
                        onChange={(value) => handleDateChange('registrationStart', value)}
                    />
                    <DatePicker
                        label="Окончание регистрации"
                        value={formData.registrationEnd}
                        onChange={(value) => handleDateChange('registrationEnd', value)}
                        minDate={formData.registrationStart}
                    />
                    <DatePicker
                        label="Начало хакатона"
                        value={formData.hackathonStart}
                        onChange={(value) => handleDateChange('hackathonStart', value)}
                        minDate={formData.registrationEnd}
                    />
                </div>
            </div>

            {/* Блок 3: Размер команд */}
            <div className={classes.info_block}>
                <h4 className={classes.block_title}>Размер команд</h4>
                <div className={classes.team_size_grid}>
                    <Input
                        label="Минимальный размер команды"
                        type="number"
                        value={formData.minTeamSize}
                        onChange={handleChange}
                        name="minTeamSize"
                        min={1}
                        max={formData.maxTeamSize - 1}
                    />
                    <Input
                        label="Максимальный размер команды"
                        type="number"
                        value={formData.maxTeamSize}
                        onChange={handleChange}
                        name="maxTeamSize"
                        min={formData.minTeamSize + 1}
                        max={20}
                    />
                </div>
            </div>

            {/* Остальные секции */}
            <StepsListWithDates
                initialStages={formData.stages}
                onChange={handleStagesChange}
            />

            <CriteriaEditor
                initialCriteria={formData.criteria}
                onChange={handleCriteriaChange}
            />

            <TechnologyStackInput
                initialTechnologies={formData.technologies}
                onChange={(techs) => setFormData({...formData, technologies: techs})}
            />

            <AwardsEditor
                initialAwards={formData.prizes}
                onChange={handlePrizesChange}
            />

            <SponsorsEditor
                initialSponsors={formData.sponsors}
                onChange={handleSponsorsChange}
            />
        </div>
    );
};

export default CreateHackathonPage;