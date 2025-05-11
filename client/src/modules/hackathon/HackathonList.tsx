import classes from "./hackathon.module.css";
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import HackathonFilter from "./components/HackathonsFilter.tsx";
import {FilterUpdate, HackathonFilterData, HackathonSearchData} from "./types.ts";
import React, {useEffect, useState} from "react";
import {HackathonAPI} from "./hackathonAPI.ts";
import Loader from "../../components/loader/Loader.tsx";
import Error from "../../components/error/Error.tsx";
import HackathonItem from "./components/HackathonItem.tsx";
import {useNavigate} from "react-router-dom";


const HackathonList = () => {
    const initialFilterData: HackathonFilterData = {
        name: "",
        organizationId: 0,
        startDate: "",
        endDate: "",
        maxTeamSize: 5,
        minTeamSize: 1,
        technologyId: 0,
        totalAward: 0,
        role: 0,
        limit: 20,
        total: 0,
        offset: 0,
    }

    const initialHackathonData: HackathonSearchData = {
        total: 0,
        list: [],
        limit: 0,
        offset: 0
    }

    const [hackathons, setHackathons] = useState<HackathonSearchData>(initialHackathonData);
    const [searchLoading, setSearhLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()
    const [filterData, setFilterData] = useState<HackathonFilterData>(initialFilterData)

    const navigate = useNavigate()

    useEffect(() => {
        searchHackathons()
    }, [filterData.offset])

    const searchHackathons = () => {
        setSearhLoading(true)
        setSearchError(null);
        setHackathons(initialHackathonData)
        HackathonAPI.getAll(filterData)
            .then((data) => {
                setHackathons({
                    list: data.list,
                    total: data.total,
                    limit: filterData.limit,
                    offset: filterData.offset
                });
                setFilterData(prevState => ({
                    ...prevState,
                    total: data.total,
                    limit: filterData.limit,
                    offset: filterData.offset
                }));
                setSearhLoading(false)
            })
            .catch ((err) => {
                const errorMessage = (err as Error).message || "Ошибка при поиске хакатонов";
                setSearchError(errorMessage);
            }).finally(() => {
            setSearhLoading(false);
        })
    }

    const handleFilterChange = (update: FilterUpdate | React.ChangeEvent<HTMLInputElement>) => {
        let name: keyof HackathonFilterData;
        let value: any;

        if ('target' in update) {
            name = update.target.name as keyof HackathonFilterData;
            value = update.target.value;
        } else {
            name = update.name;
            value = update.value;
        }

        setFilterData(prev => {
            // Список полей, которые должны быть числами
            const numericFields = ['limit', 'offset', 'minTeamSize', 'maxTeamSize', 'totalAward', 'technologyId', 'organizationId'];

            const newState = {
                ...prev,
                // Преобразуем в число все поля из списка numericFields
                [name]: numericFields.includes(name) ? Number(value) : value
            };

            if (name !== 'offset') {
                newState.offset = 0;
            }

            return newState;
        });
    };

    const handleHackathonClick = (id : number) => {
        navigate(`/hackathon/${id}`)
    }

    const handleResetFilters = () => {
        setFilterData(initialFilterData)
        searchHackathons()
    }

    const handleSearch = () => {
        searchHackathons()
    }
    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Хакатоны</PageLabel>
            <HackathonFilter
                filterData={filterData}
                setFilterData={handleFilterChange}
                onResetFilters={handleResetFilters}
                onSearch={handleSearch}
            />
            {searchLoading ? <Loader/> :
                hackathons.list?.length > 0 ? (
                    <div className={classes.hackathonsGrid}>
                        {hackathons.list.map((hack) => (
                            <div key={`hack_${hack.id}`} className={classes.hackathonCard}>
                                <HackathonItem
                                    hackathon={hack}
                                    onClick={handleHackathonClick}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={classes.noResults}><p>Хакатоны не найдены</p></div>
                )
            }

            {searchError && <Error>{searchError}</Error>}

        </div>
    )
};

export default HackathonList;