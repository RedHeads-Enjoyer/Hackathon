import React, {useState} from 'react';
import classes from '../style.module.css';
import {OrganizationFilterData} from '../types.ts';
import Input from "../../../components/input/Input.tsx";
import Button from "../../../components/button/Button.tsx";
import Pagination from "../../../components/pagination/Pagination.tsx";

type OrganizationFilterProps = {
    filterData: OrganizationFilterData;
    setFilterData: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onResetFilters: () => void;
    onSearch: () => void;
    onPaginationChange: (n: number) => void
};

const OrganizationFilter = ({filterData, setFilterData, onResetFilters, onSearch, onPaginationChange}: OrganizationFilterProps) => {
    const [isExpanded, setIsExpanded] = useState<boolean>(false)

    return (
        <div className={classes.expandedCard}>
            <div className={classes.expanded}
                // onClick={() => setIsExpanded(prevState => !prevState)}
            >
                <h3 className={classes.title}>Фильтры поиска ({filterData.total}) {filterData.offset + 1}-{Math.min(filterData.offset + filterData.limit, filterData.total)}</h3>
                <Pagination
                    currentPage={Math.floor(filterData.offset / filterData.limit) + 1}
                    itemsPerPage={filterData.limit}
                    totalItems={filterData.total}
                    onPageChange={onPaginationChange}/>
            </div>
            {isExpanded &&
                <div className={classes.expandedFilters}>
                    <div className={classes.filters}>
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
                    <div className={classes.filterControls}>
                        <Button onClick={onResetFilters}>Сбросить фильтры</Button>
                        <Button onClick={onSearch}>Найти</Button>
                    </div>
                </div>
            }

        </div>
    );
};

export default OrganizationFilter;