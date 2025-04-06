import React, { useState, useId } from 'react';
import classes from './style.module.css';
import Button from '../button/Button';
import Input from '../input/Input';

interface TechnologyStackInputProps {
    initialTechnologies?: string[];
    onChange: (technologies: string[]) => void;
}

const TechnologyStackInput: React.FC<TechnologyStackInputProps> = ({
                                                                       initialTechnologies = [],
                                                                       onChange
                                                                   }) => {
    const [technologies, setTechnologies] = useState<string[]>(initialTechnologies);
    const [currentTech, setCurrentTech] = useState('');
    const idGenerator = useId();

    const addTechnology = () => {
        if (currentTech.trim() && !technologies.includes(currentTech.trim())) {
            const updatedTechs = [...technologies, currentTech.trim()];
            setTechnologies(updatedTechs);
            setCurrentTech('');
            onChange(updatedTechs);
        }
    };

    const removeTechnology = (techToRemove: string) => {
        const updatedTechs = technologies.filter(tech => tech !== techToRemove);
        setTechnologies(updatedTechs);
        onChange(updatedTechs);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTechnology();
        }
    };

    return (
        <div className={classes.container}>
            <div className={classes.header}>
                <h3 className={classes.title}>Стек технологий</h3>
            </div>

            <div className={classes.inputContainer}>
                <Input
                    type="text"
                    value={currentTech}
                    onChange={(e) => setCurrentTech(e.target.value)}
                    placeholder="Введите технологию и нажмите Enter"
                    onKeyDown={handleKeyDown}
                />
                <Button
                    onClick={addTechnology}
                    disabled={!currentTech.trim()}
                >
                    Добавить
                </Button>
            </div>

            {technologies.length > 0 && (
                <div className={classes.techList}>
                    {technologies.map((tech) => (
                        <div key={`${idGenerator}-${tech}`} className={classes.techItem}>
                            <span>{tech}</span>
                            <Button
                                onClick={() => removeTechnology(tech)}
                            >Удалить </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TechnologyStackInput;