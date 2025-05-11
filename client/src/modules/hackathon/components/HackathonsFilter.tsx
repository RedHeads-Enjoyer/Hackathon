import React, {useState} from 'react';
import classes from '../hackathon.module.css';
import {FilterUpdate, HackathonFilterData} from '../types.ts';
import Input from "../../../components/input/Input.tsx";
import Button from "../../../components/button/Button.tsx";
import Pagination from "../../../components/pagination/Pagination.tsx";
import SelectSearch from "../../../components/searchSelect/SearchSelect.tsx";
import DatePicker from "../../../components/datePicker/DatePicker.tsx";

type HackathonFilterProps = {
    filterData: HackathonFilterData;
    setFilterData: (update: FilterUpdate | React.ChangeEvent<HTMLInputElement>) => void;
    onResetFilters: () => void;
    onSearch: () => void;
};

const HackathonFilter = ({filterData, setFilterData, onResetFilters, onSearch}: HackathonFilterProps) => {
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
                            label="Название"
                            type="text"
                            value={filterData.name}
                            onChange={(e) => setFilterData(e)}
                            name="name"
                            placeholder="Введите название"
                        />

                        <div>
                            <SelectSearch
                                label={"Выберите организацию"}
                                url={"organizations/options"}
                                onChange={(value) => setFilterData({
                                    name: 'organizationId',
                                    value: value.value
                                })}
                                notFound={<p>Подтвержденная организация с таким названием не найдена.</p>}
                                placeholder={"Любая"}
                            />
                        </div>

                        <div>
                            <SelectSearch
                                label={"Выберите технологию"}
                                url={"technologies/options"}
                                onChange={(value) => setFilterData({
                                    name: 'technologyId',
                                    value: value.value
                                })}
                                notFound={<p>Технология с таким названием не найдена.</p>}
                                placeholder={"Любая"}
                            />
                        </div>

                        <DatePicker
                            label="Начало регистрации от"
                            value={filterData.startDate}
                            onChange={(value) => setFilterData({
                                name: 'startDate',
                                value: value
                            })}
                            maxDate={filterData.endDate}
                        />

                        <DatePicker
                            label="Завершение оценки до"
                            value={filterData.endDate}
                            onChange={(value) => setFilterData({
                                name: 'endDate',
                                value: value
                            })}
                            minDate={filterData.startDate}
                        />

                        <Input
                            label="Призовой фонд от (₽)"
                            type="number"
                            value={filterData.totalAward}
                            onChange={(value) => setFilterData({
                                name: 'totalAward',
                                value: value.target.value
                            })}
                            name="totalAward"
                            min={filterData.minTeamSize}
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

export default HackathonFilter;