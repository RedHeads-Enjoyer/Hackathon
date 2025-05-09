import {ParticipantFilterData, ParticipantFilterUpdate, ParticipantSearchData} from "../types.ts";
import {useEffect, useState} from "react";
import {HackathonAPI} from "../hackathonAPI.ts";
import {useParams} from "react-router-dom";
import PageLabel from "../../../components/pageLabel/PageLabel.tsx";
import Loader from "../../../components/loader/Loader.tsx";
import classes from  "../hackathon.module.css"
import ParticipantsSectionFilters from "./ParticipantsSectionFilters.tsx";
import Error from "../../../components/error/Error.tsx";
import ParticipantItem from "./ParticipantItem.tsx";

const ParticipantsSection = () => {
    const { id } = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;

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
    const [searchLoading, setSearchLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()
    const [filterData, setFilterData] = useState<ParticipantFilterData>(initialFilterData)

    const searchParticipants = (filterData: ParticipantFilterData) => {
        setSearchLoading(true)
        setSearchError(null);
        setParticipants(initialParticipantsData)
        HackathonAPI.getParticipants(hackathonId, filterData)
            .then((data) => {
                console.log(data)
                setParticipants(prevState => ({
                    ...prevState,
                    list: data.list
                }));
                setFilterData(prevState => ({
                    ...prevState,
                    total: data.total
                }));
                setSearchLoading(false)
            })
            .catch ((err) => {
                const errorMessage = (err as Error).message || "Ошибка при поиске участников";
                setSearchError(errorMessage);
            }).finally(() => {
            setSearchLoading(false);
        })
    }

    const handleFilterChange = (update: ParticipantFilterUpdate | React.ChangeEvent<HTMLInputElement>) => {
        let name: keyof ParticipantFilterData;
        let value: any;

        if ('target' in update) {
            name = update.target.name as keyof ParticipantFilterData;
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

    useEffect(() => {
        searchParticipants(filterData)
    }, [filterData.offset])

    const handleResetFilters = () => {
        setFilterData(initialFilterData)
        searchParticipants(initialFilterData)
    }

    const handleSearch = () => {
        searchParticipants(filterData)
    }


    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Участники</PageLabel>
            <ParticipantsSectionFilters
                filterData={filterData}
                setFilterData={handleFilterChange}
                onResetFilters={handleResetFilters}
                onSearch={handleSearch}
            />
            {searchLoading ? <Loader/> :
                participants.list?.length > 0 ? (
                    participants.list.map((part) => (
                        <div key={`participants_${part.id}`}>
                            <ParticipantItem participant={part}/>
                        </div>
                    ))
                ) : (
                    <div className={classes.noResults}><p>Участники не найдены</p></div>
                )
            }
            {searchError && <Error>{searchError}</Error>}
        </div>
    );
}


export default ParticipantsSection