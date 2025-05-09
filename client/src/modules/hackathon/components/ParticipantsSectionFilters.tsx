import React, {useState} from 'react';
import classes from '../hackathon.module.css';
import {ParticipantFilterData, ParticipantFilterUpdate} from '../types.ts';
import Input from "../../../components/input/Input.tsx";
import Button from "../../../components/button/Button.tsx";
import Pagination from "../../../components/pagination/Pagination.tsx";

type OrganizationFilterProps = {
    filterData: ParticipantFilterData;
    setFilterData: (update: ParticipantFilterUpdate | React.ChangeEvent<HTMLInputElement>) => void;
    onResetFilters: () => void;
    onSearch: () => void;
};

const ParticipantsSectionFilters = ({filterData, setFilterData, onResetFilters, onSearch}: OrganizationFilterProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

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
                        <Input
                            label="Имя или email"
                            type="text"
                            value={filterData.name}
                            onChange={(e) => setFilterData(e)}
                            name="name"
                            placeholder="Введите имя или email"
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

export default ParticipantsSectionFilters;