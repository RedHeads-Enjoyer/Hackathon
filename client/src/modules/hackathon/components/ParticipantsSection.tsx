import {ParticipantFilterData, ParticipantSearchData} from "../types.ts";
import {useState} from "react";

const ParticipantsSection = () => {
    const initialFilterData: ParticipantFilterData = {
        name: "",
        isFree: null,
        limit: 0,
        offset: 0,
        total: 0
    }

    const initialParticipantsData: ParticipantSearchData = {
        total: 0,
        list: []
    }

    const [participants, setParticipants] = useState<ParticipantSearchData>(initialParticipantsData);
    const [searchLoading, setSearhLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()
    const [filterData, setFilterData] = useState<ParticipantFilterData>(initialFilterData)

    const searchParticipants = (filterData: ParticipantFilterData) => {
        setSearhLoading(true)
        setSearchError(null);
        setParticipants(initialParticipantsData)
        Hacat.getAll(filterData)
            .then((data) => {
                console.log(data)
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
}



const Organizations = () => {
    const initialFilterData: OrganizationFilterData = {
        INN: "",
        OGRN: "",
        contactEmail: "",
        legalName: "",
        status: 0,
        website: "",
        limit: 20,
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
        searchOrganizations(filterData)
    }, [filterData.offset])

    useEffect(() => {
        console.log(filterData)
    }, [filterData]);

    const searchOrganizations = (filterData: OrganizationFilterData) => {
        setSearhLoading(true)
        setSearchError(null);
        setOrganization(initialOrganizationData)
        OrganizationAPI.getAll(filterData)
            .then((data) => {
                console.log(data)
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
        searchOrganizations(initialFilterData)
    }

    const handleSearch = () => {
        searchOrganizations(filterData)
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
                            <OrganizationItem organization={org} statusChange/>
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

export default ParticipantsSection