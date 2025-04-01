import React, { useState, useRef } from 'react';
import { Container, Button, Form, Card, Image, Modal, Row, Col, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';

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
    const navigate = useNavigate();
    const cropperRef = useRef<Cropper>(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [cropSquare, setCropSquare] = useState(true);

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

    // Обработка загрузки и обрезки изображения
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            reader.onload = () => {
                setFormData(prev => ({ ...prev, coverImage: reader.result as string }));
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCrop = () => {
        if (cropperRef.current) {
            const croppedCanvas = cropperRef.current.getCroppedCanvas({
                aspectRatio: cropSquare ? 1 : NaN
            });
            setFormData(prev => ({ ...prev, croppedImage: croppedCanvas.toDataURL() }));
            setShowCropModal(false);
        }
    };

    // Управление целями
    const handleGoalChange = (index: number, value: string) => {
        const newGoals = [...formData.goals];
        newGoals[index] = value;
        setFormData(prev => ({ ...prev, goals: newGoals }));
    };

    const addGoal = () => {
        setFormData(prev => ({ ...prev, goals: [...prev.goals, ''] }));
    };

    const removeGoal = (index: number) => {
        const newGoals = formData.goals.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, goals: newGoals }));
    };

    // Управление этапами
    const addStage = () => {
        const newStage: Stage = {
            id: Date.now().toString(),
            name: '',
            description: '',
            startDate: '',
            endDate: ''
        };
        setFormData(prev => ({ ...prev, stages: [...prev.stages, newStage] }));
    };

    const updateStage = (id: string, field: keyof Stage, value: string) => {
        setFormData(prev => ({
            ...prev,
            stages: prev.stages.map(stage =>
                stage.id === id ? { ...stage, [field]: value } : stage
            )
        }));
    };

    const removeStage = (id: string) => {
        setFormData(prev => ({
            ...prev,
            stages: prev.stages.filter(stage => stage.id !== id)
        }));
    };

    // Управление критериями оценки
    const addCriteria = () => {
        const newCriteria: Criteria = {
            id: Date.now().toString(),
            name: '',
            minScore: 0,
            maxScore: 10
        };
        setFormData(prev => ({ ...prev, criteria: [...prev.criteria, newCriteria] }));
    };

    const updateCriteria = (id: string, field: keyof Criteria, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            criteria: prev.criteria.map(criteria =>
                criteria.id === id ? { ...criteria, [field]: value } : criteria
            )
        }));
    };

    const removeCriteria = (id: string) => {
        setFormData(prev => ({
            ...prev,
            criteria: prev.criteria.filter(criteria => criteria.id !== id)
        }));
    };

    // Управление технологиями
    const addTechnology = () => {
        if (formData.currentTechnology.trim()) {
            setFormData(prev => ({
                ...prev,
                technologies: [...prev.technologies, prev.currentTechnology.trim()],
                currentTechnology: ''
            }));
        }
    };

    const removeTechnology = (index: number) => {
        setFormData(prev => ({
            ...prev,
            technologies: prev.technologies.filter((_, i) => i !== index)
        }));
    };

    // Управление наградами
    const addPrize = () => {
        const newPrize: Prize = {
            id: Date.now().toString(),
            place: formData.prizes.length + 1,
            reward: ''
        };
        setFormData(prev => ({ ...prev, prizes: [...prev.prizes, newPrize] }));
    };

    const updatePrize = (id: string, field: keyof Prize, value: string | number) => {
        setFormData(prev => ({
            ...prev,
            prizes: prev.prizes.map(prize =>
                prize.id === id ? { ...prize, [field]: value } : prize
            )
        }));
    };

    const removePrize = (id: string) => {
        setFormData(prev => ({
            ...prev,
            prizes: prev.prizes.filter(prize => prize.id !== id)
        }));
    };

    // Управление спонсорами
    const addSponsor = () => {
        const newSponsor: Sponsor = {
            id: Date.now().toString(),
            name: '',
            website: ''
        };
        setFormData(prev => ({ ...prev, sponsors: [...prev.sponsors, newSponsor] }));
    };

    const updateSponsor = (id: string, field: keyof Sponsor, value: string) => {
        setFormData(prev => ({
            ...prev,
            sponsors: prev.sponsors.map(sponsor =>
                sponsor.id === id ? { ...sponsor, [field]: value } : sponsor
            )
        }));
    };

    const removeSponsor = (id: string) => {
        setFormData(prev => ({
            ...prev,
            sponsors: prev.sponsors.filter(sponsor => sponsor.id !== id)
        }));
    };


    return (
        <Container className="py-4">
            <h1 className="mb-4">Создать новый хакатон</h1>
        </Container>
    );
};

export default CreateHackathonPage;