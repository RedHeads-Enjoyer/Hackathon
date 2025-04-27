import React, {useEffect, useState} from 'react';
import classes from './style.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import {FilterUpdate, Technology, TechnologyFilterData} from "./types.ts";
import Loader from "../../components/loader/Loader.tsx";
import Error from "../../components/error/Error.tsx";
import TechnologiesFilter from "./components/TechnologiesFilter.tsx";
import {technologyAPI} from "./technologyAPI.ts";
import TechnologyItem from "./components/TechnologyItem.tsx";


const Organizations = () => {
    const initialFilterData: TechnologyFilterData = {
        name: "",
        limit: 20,
        offset: 0,
        total: 0
    }

    const initialTechnologyList: Technology[] = []

    const [technologies, setTechnologies] = useState<Technology[]>(initialTechnologyList);
    const [searchLoading, setSearhLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()
    const [filterData, setFilterData] = useState<TechnologyFilterData>(initialFilterData)

    useEffect(() => {
        searchTechnologies(filterData)
    }, [filterData.offset])

    useEffect(() => {
        console.log(filterData)
    }, [filterData]);

    const searchTechnologies = (filterData: TechnologyFilterData) => {
        setSearhLoading(true)
        setSearchError(null);
        setTechnologies(initialTechnologyList)
        technologyAPI.getAll(filterData)
            .then((data) => {
                console.log(data)
                setTechnologies(data.list);
                setFilterData(prevState => ({
                    ...prevState,
                    total: data.total
                }));
                setSearhLoading(false)
            })
            .catch ((err) => {
                const errorMessage = (err as Error).message || "Ошибка при создании организации";
                setSearchError(errorMessage);
            }).finally(() => {
            setSearhLoading(false);
        })
    }

    const handleFilterChange = (update: FilterUpdate | React.ChangeEvent<HTMLInputElement>) => {
        let name: keyof TechnologyFilterData;
        let value: any;

        if ('target' in update) {
            name = update.target.name as keyof TechnologyFilterData;
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
        searchTechnologies(initialFilterData)
    }

    const handleSearch = () => {
        searchTechnologies(filterData)
    }


    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Технологии</PageLabel>
            <TechnologiesFilter
                filterData={filterData}
                setFilterData={handleFilterChange}
                onResetFilters={handleResetFilters}
                onSearch={handleSearch}
            />
            {searchLoading ? <Loader/> :
                technologies?.length > 0 ? (
                    technologies.map((tech) => (
                        <div key={`organization_${tech.name}`}>
                            <TechnologyItem technology={tech}/>
                        </div>
                    ))
                ) : (
                    <div className={classes.noResults}><p>Технологии не найдены</p></div>
                )
            }
            {searchError && <Error>{searchError}</Error>}
        </div>
    );
};

export default Organizations;