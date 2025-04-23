import React, {useEffect, useState} from 'react';
import classes from './style.module.css';
import PageLabel from "../../components/pageLabel/PageLabel.tsx";
import {Organization, OrganizationFilterData} from "./types.ts";
import Loader from "../../components/loader/Loader.tsx";
import {OrganizationAPI} from "./organizationAPI.ts";
import Error from "../../components/error/Error.tsx";
import OrganizationItem from "./Components/OrganizationItem.tsx";
import OrganizationFilter from "./Components/OrganizationsFilter.tsx";

const MyOrganizationsPage = () => {
    const initialFilterData: OrganizationFilterData = {
        INN: "",
        OGRN: "",
        contactEmail: "",
        legalName: "",
        status: 0,
        website: "",
        limit: 20,
        offset: 0
    }

    const [organizations, setOrganization] = useState<Organization[]>([]);
    const [searchLoading, setSearhLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()
    const [filterData, setFilterData] = useState<OrganizationFilterData>(initialFilterData)

    useEffect(() => {
        searchOrganizations()
    }, [])

    const searchOrganizations = () => {
        setSearchError(null);
        OrganizationAPI.getMy(filterData)
            .then((data) => {
                setOrganization(data)
                setSearhLoading(false)
            })
            .catch ((err) => {
                const errorMessage = (err as Error).message || "Ошибка при создании организации";
                setSearchError(errorMessage);
            }).finally(() => {
            setSearhLoading(false);
        })
    }

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilterData(prevData => ({
            ...prevData,
            [name]: value, // Обновляем соответствующее поле в состоянии
        }));
    };

    const handlePaginationChange = (n: number) => {
        setFilterData(prevState => ({
            ...prevState,
            offset: (n - 1) * prevState.limit
        }));
        handleSearch();
    }

    const handleResetFilters = () => {
        setFilterData(initialFilterData)
    }

    const handleSearch = () => {
        searchOrganizations()
    }


    if (searchLoading) {
        return (
            <div className={classes.page_wrapper}>
                <Loader/>
            </div>
            )
    }

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Мои организации</PageLabel>
            <OrganizationFilter
                filterData={filterData}
                setFilterData={handleFilterChange}
                onResetFilters={handleResetFilters}
                onSearch={handleSearch}
                onPaginationChange={handlePaginationChange}
            />
            {organizations.map((org) => (
                <div key={`organization_${org.INN}`}>
                    <OrganizationItem organization={org} />
                </div>
            ))}
            {searchError && <Error>{searchError}</Error>}
        </div>
    );
};

export default MyOrganizationsPage;