import {useId, useState} from 'react';
import classes from './styles.module.css';
import Modal from '../modal/Modal';
import SearchSelect from "../searchSelect/SearchSelect.tsx";
import {Option} from "../../modules/organozaton/types.ts";

interface MentorStackInputProps {
    initialMentors?: Array<Option>;
    onChange: (mentors: Array<Option>) => void;
    required?: boolean;
}

const MentorStackInput = (({
                               initialMentors = [],
                               onChange,
                               required = false
                           }: MentorStackInputProps) => {
    const [mentors, setMentors] = useState<Array<Option>>(initialMentors);
    const [showError, setShowError] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        mentorToDelete: Option | null;
    }>({show: false, mentorToDelete: null});

    const idGenerator = useId();


    const addMentor = (option: Option) => {
        if (!mentors.some(mentor => mentor.value === option.value)) {
            const updatedMentors = [...mentors, option];
            setMentors(updatedMentors);
            onChange(updatedMentors);
            if (showError) {
                setShowError(false);
            }
        }
    };

    const requestDeleteMentor = (mentor: Option) => {
        setDeleteConfirm({show: true, mentorToDelete: mentor});
    };

    const deleteMentor = () => {
        if (!deleteConfirm.mentorToDelete) return;

        const mentorToDelete = deleteConfirm.mentorToDelete;

        const updatedMentors = mentors.filter(
            mentor => mentor.value !== mentorToDelete.value
        );
        setMentors(updatedMentors);
        onChange(updatedMentors);

        setDeleteConfirm({show: false, mentorToDelete: null});
    };

    return (
        <div className={classes.container}>
            <h3 className={classes.title}>
                Менторы
                {required && <span className={classes.required}>*</span>}
            </h3>

            <div className={mentors.length !== 0 ? classes.form : ""}>
                <div className={classes.inputContainer}>
                    <SearchSelect
                        label={"Выберите ментора"}
                        url={"/users/options"}
                        onChange={addMentor}
                        notFound={<p>Ментор не найден.</p>}
                        placeholder={"Введите логин или email ментора"}
                        clearable={true}
                    />
                </div>
            </div>

            {mentors.length > 0 && (
                <div className={classes.mentorHeader}>
                    <h4 className={classes.mentorListTitle}>Список менторов</h4>
                    <div className={classes.mentorHelp}>
                        Для удаления ментора нажмите на него
                    </div>
                </div>
            )}

            {mentors.length > 0 && (
                <div className={classes.mentorList}>
                    {mentors.map((mentor) => (
                        <div
                            key={`${idGenerator}-${mentor.value}`}
                            className={classes.mentorItem}
                            onClick={() => requestDeleteMentor(mentor)}
                        >
                            {mentor.label}
                        </div>
                    ))}
                </div>
            )}

            <Modal
                isOpen={deleteConfirm.show}
                onConfirm={deleteMentor}
                onReject={() => setDeleteConfirm({show: false, mentorToDelete: null})}
                confirmText="Удалить"
                rejectText="Отмена"
                title="Удалить метора?"
            >
                <p>
                    Вы уверены, что хотите удалить "{deleteConfirm.mentorToDelete?.label}" из списка?
                </p>
            </Modal>
        </div>
    );
});

export default MentorStackInput;