import classes from "./hackathon.module.css";
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import HackathonFilter from "./components/HackathonsFilter.tsx";
import {FilterUpdate, HackathonFilterData, HackathonSearchData} from "./types.ts";
import React, {useEffect, useState} from "react";
import {hackathonAPI} from "./hackathonAPI.ts";


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

        limit: 20,
        total: 0,
        offset: 0,
    }

    const initialHackathonData: HackathonSearchData = {
        total: 0,
        list: []
    }

    const [hackathons, setHackathons] = useState<HackathonSearchData>(initialHackathonData);
    const [searchLoading, setSearhLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()
    const [filterData, setFilterData] = useState<HackathonFilterData>(initialFilterData)

    useEffect(() => {
        searchHackathons()
    }, [filterData.offset])

    const searchHackathons = () => {
        setSearhLoading(true)
        setSearchError(null);
        setHackathons(initialHackathonData)
        hackathonAPI.getAll(filterData)
            .then((data) => {
                setHackathons(prevState => ({
                    ...prevState,
                    list: data.list
                }));
                setFilterData(prevState => ({
                    ...prevState,
                    total: data.total
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
            const newState = {
                ...prev,
                [name]: name === 'limit' || name === 'offset' ? Number(value) : value
            };

            if (name !== 'offset') {
                newState.offset = 0;
            }

            return newState;
        });
    };

    const handleResetFilters = () => {
        setFilterData(initialFilterData)
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


        </div>
    )
};

export default HackathonList;