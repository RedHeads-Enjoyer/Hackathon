import React, {useEffect, useState} from 'react';
import classes from './style.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import {FilterUpdate, OrganizationFilterData, OrganizationSearchData} from "./types.ts";
import Loader from "../../components/loader/Loader.tsx";
import {OrganizationAPI} from "./organizationAPI.ts";
import Error from "../../components/error/Error.tsx";
import OrganizationItem from "./Components/OrganizationItem.tsx";
import OrganizationFilter from "./Components/OrganizationsFilter.tsx";


const Organizations = () => {
    const initialFilterData: OrganizationFilterData = {
        INN: "",
        OGRN: "",
        contactEmail: "",
        legalName: "",
        status: 0,
        website: "",
        limit: 2,
        offset: 0,
        total: 0
    }

    const initialOrganizationData: OrganizationSearchData = {
        total: 0,
        list: []
    }

    const [organizations, setOrganization] = useState<OrganizationSearchData>(initialOrganizationData);
    const [searchLoading, setSearhLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()
    const [filterData, setFilterData] = useState<OrganizationFilterData>(initialFilterData)

    useEffect(() => {
        searchOrganizations()
    }, [filterData.offset])

    useEffect(() => {
        console.log(filterData)
    }, [filterData]);

    const searchOrganizations = () => {
        setSearhLoading(true)
        setSearchError(null);
        setOrganization(initialOrganizationData)
        OrganizationAPI.getAll(filterData)
            .then((data) => {
                setOrganization(prevState => ({
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
                const errorMessage = (err as Error).message || "Ошибка при создании организации";
                setSearchError(errorMessage);
            }).finally(() => {
            setSearhLoading(false);
        })
    }

    const handleFilterChange = (update: FilterUpdate | React.ChangeEvent<HTMLInputElement>) => {
        let name: keyof OrganizationFilterData;
        let value: any;

        if ('target' in update) {
            name = update.target.name as keyof OrganizationFilterData;
            value = update.target.value;
        } else {
            name = update.name;
            value = update.value;
        }

        setFilterData(prev => {
            const newState = {
                ...prev,
                [name]: name === 'status' || name === 'limit' || name === 'offset' ? Number(value) : value
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
        searchOrganizations()
    }


    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Организации</PageLabel>
            <OrganizationFilter
                filterData={filterData}
                setFilterData={handleFilterChange}
                onResetFilters={handleResetFilters}
                onSearch={handleSearch}
            />
            {searchLoading ? <Loader/> :
                organizations.list?.length > 0 ? (
                    organizations.list.map((org) => (
                        <div key={`organization_${org.INN}`}>
                            <OrganizationItem organization={org} />
                        </div>
                    ))
                ) : (
                    <div className={classes.noResults}><p>Организации не найдены</p></div>
                )
            }
            {searchError && <Error>{searchError}</Error>}
        </div>
    );
};

export default Organizations;