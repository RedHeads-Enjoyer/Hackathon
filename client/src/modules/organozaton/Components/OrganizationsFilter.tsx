import React, {useState} from 'react';
import classes from '../style.module.css';
import {OrganizationFilterData} from '../types.ts';
import Input from "../../../components/input/Input.tsx";

type OrganizationFilterProps = {
    filterData: OrganizationFilterData;
    setFilterData: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

const OrganizationFilter = ({filterData, setFilterData}: OrganizationFilterProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    return (
        <div className={classes.expandedCard}>
            <div className={classes.expanded}
                onClick={() => setIsExpanded(prevState => !prevState)}>
                <h3 className={classes.title}>Фильтры поиска (123) 1-20</h3>
            </div>
            {isExpanded &&
                <div className={classes.expandedFilters}>
                    <Input
                        label="Полное название"
                        type="text"
                        value={filterData.legalName}
                        onChange={setFilterData}
                        name="legalName"
                        placeholder="Введите полное название"
                    />
                    <Input
                        label="Email"
                        type="text"
                        value={filterData.contactEmail}
                        onChange={setFilterData}
                        name="contactEmail"
                        placeholder="Введите email"
                    />
                    <Input
                        label="ИНН"
                        type="textNumber"
                        value={filterData.INN}
                        onChange={setFilterData}
                        name="INN"
                        placeholder="Введите ИНН"
                    />
                    <Input
                        label="ОГРН"
                        type="textNumber"
                        value={filterData.OGRN}
                        onChange={setFilterData}
                        name="OGRN"
                        placeholder="Введите ОГРН"
                    />
                    <Input
                        label="Вебсайт"
                        type="text"
                        value={filterData.website}
                        onChange={setFilterData}
                        name="website"
                        placeholder="Введите ссылку"
                    />
                </div>
            }

        </div>
    );
};

export default OrganizationFilter;