import React, {useState} from 'react';
import classes from '../style.module.css';
import {FilterUpdate, OrganizationFilterData} from '../types.ts';
import Input from "../../../components/input/Input.tsx";
import Button from "../../../components/button/Button.tsx";
import Pagination from "../../../components/pagination/Pagination.tsx";
import Select from "../../../components/select/Select.tsx";
import {statusOptions} from "../storage.ts";

type OrganizationFilterProps = {
    filterData: OrganizationFilterData;
    setFilterData: (update: FilterUpdate | React.ChangeEvent<HTMLInputElement>) => void;
    onResetFilters: () => void;
    onSearch: () => void;
};

const OrganizationFilter = ({filterData, setFilterData, onResetFilters, onSearch}: OrganizationFilterProps) => {
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
                    <h3 className={classes.title}>Фильтры поиска ({filterData.total}) {filterData.offset + 1}-{Math.min(filterData.offset + filterData.limit, filterData.total)}</h3>
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
                            label="Полное название"
                            type="text"
                            value={filterData.legalName}
                            onChange={(e) => setFilterData(e)}
                            name="legalName"
                            placeholder="Введите полное название"
                        />

                        <Input
                            label="Email"
                            type="text"
                            value={filterData.contactEmail}
                            onChange={(e) => setFilterData(e)}
                            name="contactEmail"
                            placeholder="Введите email"
                        />
                        <Input
                            label="ИНН"
                            type="textNumber"
                            value={filterData.INN}
                            onChange={(e) => setFilterData(e)}
                            name="INN"
                            placeholder="Введите ИНН"
                        />
                        <Input
                            label="ОГРН"
                            type="textNumber"
                            value={filterData.OGRN}
                            onChange={(e) => setFilterData(e)}
                            name="OGRN"
                            placeholder="Введите ОГРН"
                        />
                        <Input
                            label="Вебсайт"
                            type="text"
                            value={filterData.website}
                            onChange={(e) => setFilterData(e)}
                            name="website"
                            placeholder="Введите ссылку"
                        />
                        <Select
                            label="Статус организации"
                            options={statusOptions}
                            value={filterData.status}
                            onChange={(value) => setFilterData({
                                name: 'status',
                                value: value
                            })}
                            placeholder="Выберите статус"
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