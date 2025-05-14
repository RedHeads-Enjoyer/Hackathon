import {ResultsSearchData} from "../types.ts";
import {useEffect, useState} from "react";
import {HackathonAPI} from "../hackathonAPI.ts";
import {useParams} from "react-router-dom";
import PageLabel from "../../../components/pageLabel/PageLabel.tsx";
import Loader from "../../../components/loader/Loader.tsx";
import classes from  "../hackathon.module.css"
import Error from "../../../components/error/Error.tsx";
import ResultItem from "./ResultItem.tsx";

const ResultSection = () => {
    const { id } = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;

    const [results, setResults] = useState<ResultsSearchData>({
        list: [],
        maxScore: 0
    });
    const [searchLoading, setSearchLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()

    const searchParticipants = () => {
        setSearchLoading(true)
        setSearchError(null);
        HackathonAPI.getResults(hackathonId)
            .then((data) => {
                setResults(data);
                setSearchLoading(false)
            })
            .catch ((err) => {
                const errorMessage = (err as Error).message || "Ошибка при поиске итогов";
                setSearchError(errorMessage);
            }).finally(() => {
            setSearchLoading(false);
        })
    }


    useEffect(() => {
        searchParticipants()
    }, [hackathonId])

    return (
        <div className={classes.page_wrapper}>
            <PageLabel size={'h3'}>Итоги</PageLabel>
            {searchLoading ? <Loader/> :
                results.list?.length > 0 ? (
                    results.list.map((res, index) => (
                        <div key={`result_${res?.teamName}`}>
                            <ResultItem result={res} maxScore={results.maxScore} position={index + 1}/>
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


export default ResultSection