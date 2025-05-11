import React, {useState} from 'react';
import classes from '../hackathon.module.css';
import {ProjectFilterData, ProjectsFilterUpdate} from '../types.ts';
import Button from "../../../components/button/Button.tsx";
import Pagination from "../../../components/pagination/Pagination.tsx";
import Select from "../../../components/select/Select.tsx";
import {Option} from "../../organozaton/types.ts";

type OrganizationFilterProps = {
    filterData: ProjectFilterData;
    setFilterData: (update: ProjectsFilterUpdate | React.ChangeEvent<HTMLInputElement>) => void;
    onResetFilters: () => void;
    onSearch: () => void;
};

const ProjectsSectionFilters = ({filterData, setFilterData, onResetFilters, onSearch}: OrganizationFilterProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    const validateOptions: Option[] = [
        {value: -1, label: "Не оценен"},
        {value: 0,  label: "Все"},
        {value: 1, label: "Оценен"},
    ]

    const handlePaginationChange = (page: number) => {
        setFilterData({
            name: 'offset',
            value: (page - 1) * filterData.limit
        });
    };

    return (
        <div className={classes.expandedCard}>
            <div className={classes.filterHeader}>
                <div className={classes.expanded}
                     onClick={() => setIsExpanded(prevState => !prevState)}
                >
                    <h3 className={classes.title}>Фильтры поиска ({filterData.total}) {filterData.total == 0 ? filterData.total : filterData.offset + 1}-{Math.min(filterData.offset + filterData.limit, filterData.total)}</h3>
                </div>
                <div>
                    <Pagination
                        currentPage={Math.floor(filterData.offset / filterData.limit) + 1}
                        itemsPerPage={filterData.limit}
                        totalItems={filterData.total}
                        onPageChange={handlePaginationChange}/>
                </div>
            </div>

            {isExpanded &&
                <div className={classes.expandedFilters}>
                    <div className={classes.filters}>
                        <Select
                            label="Состояние проверки"
                            options={validateOptions}
                            value={filterData.validate}
                            onChange={(value) => setFilterData({
                                name: 'validate',
                                value: value
                            })}
                            placeholder="Выберите состояние"
                        />
                    </div>
                    <div className={classes.filterControls}>
                        <Button onClick={onResetFilters}>Сбросить фильтры</Button>
                        <Button onClick={onSearch}>Найти</Button>
                    </div>
                </div>
            }

        </div>
    );
};

export default ProjectsSectionFilters;