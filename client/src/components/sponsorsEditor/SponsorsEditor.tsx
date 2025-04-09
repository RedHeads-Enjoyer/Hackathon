import React, { useState } from 'react';
import classes from './style.module.css';
import Button from '../button/Button';
import Input from '../input/Input';
import Modal from '../modal/Modal';

interface Sponsor {
    id: string;
    name: string;
    url: string;
}

const SponsorsEditor: React.FC<{
    initialSponsors?: Sponsor[];
    onChange: (sponsors: Sponsor[]) => void;
}> = ({ initialSponsors = [], onChange }) => {
    const [sponsors, setSponsors] = useState<Sponsor[]>(initialSponsors);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<Sponsor, 'id'>>({
        name: '',
        url: ''
    });
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        sponsorId: string | null;
    }>({ show: false, sponsorId: null });

    const handleChange = (field: keyof Sponsor, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateUrl = (url: string): boolean => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    const saveSponsor = () => {
        if (!formData.name.trim()) {
            alert('Введите название спонсора');
            return;
        }

        if (!formData.url.trim()) {
            alert('Введите URL спонсора');
            return;
        }

        if (!validateUrl(formData.url)) {
            alert('Введите корректный URL (начинающийся с http:// или https://)');
            return;
        }

        const updatedSponsors = editingId
            ? sponsors.map(s =>
                s.id === editingId ? { ...formData, id: editingId } : s
            )
            : [...sponsors, { ...formData, id: Date.now().toString() }];

        setSponsors(updatedSponsors);
        onChange(updatedSponsors);
        resetForm();
    };

    const editSponsor = (sponsor: Sponsor) => {
        setEditingId(sponsor.id);
        setFormData({
            name: sponsor.name,
            url: sponsor.url
        });
    };

    const confirmDelete = () => {
        if (!editingId) return;
        setDeleteConfirm({ show: true, sponsorId: editingId });
    };

    const deleteSponsor = () => {
        if (!deleteConfirm.sponsorId) return;

        const updatedSponsors = sponsors.filter(
            s => s.id !== deleteConfirm.sponsorId
        );
        setSponsors(updatedSponsors);
        onChange(updatedSponsors);
        setDeleteConfirm({ show: false, sponsorId: null });
        resetForm();
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            name: '',
            url: ''
        });
    };

    return (
        <div className={classes.container}>
            <h3 className={classes.title}>Спонсоры</h3>

            <div className={sponsors.length !== 0 ? classes.form : ""}>
                <div className={classes.inputRow}>
                    <div className={classes.inputContainer}>
                        <Input
                            label="Название спонсора"
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Например, Яндекс"
                        />
                    </div>
                    <div className={classes.inputContainer}>
                        <Input
                            label="URL спонсора"
                            type="text"
                            value={formData.url}
                            onChange={(e) => handleChange('url', e.target.value)}
                            placeholder="https://example.com"
                        />
                    </div>
                </div>

                <div className={classes.actions}>
                    <Button
                        onClick={saveSponsor}
                        disabled={!formData.name.trim() || !formData.url.trim()}
                        className={classes.mainButton}
                    >
                        {editingId ? 'Сохранить' : 'Добавить спонсора'}
                    </Button>

                    {editingId && (
                        <>
                            <Button
                                onClick={resetForm}
                                className={classes.secondaryButton}
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                className={classes.secondaryButton}
                            >
                                Удалить
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className={classes.sponsorsList}>
                {sponsors.map((sponsor) => (
                    <div
                        key={sponsor.id}
                        className={`${classes.sponsorCard} ${
                            editingId === sponsor.id ? classes.active : ''
                        }`}
                        onClick={() => editSponsor(sponsor)}
                    >
                        <div className={classes.sponsorName}>{sponsor.name}</div>
                        <div className={classes.sponsorUrl}>{sponsor.url}</div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={deleteConfirm.show}
            >
                <div className={classes.modalContent}>
                    <h4 className={classes.modalTitle}>Удалить спонсора?</h4>
                    <p className={classes.modalText}>
                        Вы уверены, что хотите удалить этого спонсора? Это действие нельзя отменить.
                    </p>
                    <div className={classes.modalActions}>
                        <Button onClick={deleteSponsor}>
                            Удалить
                        </Button>
                        <Button
                            onClick={() => setDeleteConfirm({ show: false, sponsorId: null })}
                        >
                            Отмена
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SponsorsEditor;