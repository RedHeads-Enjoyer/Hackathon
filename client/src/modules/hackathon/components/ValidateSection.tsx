import {
    ProjectFilterData,
    ProjectSearchData, ProjectsFilterUpdate
} from "../types.ts";
import {useEffect, useState} from "react";
import {HackathonAPI} from "../hackathonAPI.ts";
import {useParams} from "react-router-dom";
import PageLabel from "../../../components/pageLabel/PageLabel.tsx";
import Loader from "../../../components/loader/Loader.tsx";
import classes from  "../hackathon.module.css"
import Error from "../../../components/error/Error.tsx";
import ProjectsSectionFilters from "./ProjectsSectionFilters.tsx";
import ValidateProjectItem from "./ValidateProjectItem.tsx";

const ValidateSection = () => {
    const { id } = useParams<{ id: string }>();
    const hackathonId = id ? parseInt(id, 10) : 1;

    const initialFilterData: ProjectFilterData = {
        validate: 0,
        limit: 20,
        offset: 0,
        total: 0
    }

    const initialProjectData: ProjectSearchData = {
        total: 0,
        criteria: [],
        list: []
    }

    const [projects, setProjects] = useState<ProjectSearchData>(initialProjectData);
    const [searchLoading, setSearchLoading] = useState<boolean>(true)
    const [searchError, setSearchError] = useState<null | string>()
    const [filterData, setFilterData] = useState<ProjectFilterData>(initialFilterData)

    const searchParticipants = (filterData: ProjectFilterData) => {
        setSearchLoading(true)
        setSearchError(null);
        setProjects(initialProjectData)
        HackathonAPI.getProjectsForValidate(hackathonId, filterData)
            .then((data) => {
                setProjects(prevState => ({
                    ...prevState,
                    list: data.list,
                    criteria: data.criteria
                }));
                setFilterData(prevState => ({
                    ...prevState,
                    total: data.total
                }));
                setSearchLoading(false)
            })
            .catch ((err) => {
                const errorMessage = (err as Error).message || "Ошибка при поиске проектов";
                setSearchError(errorMessage);
            }).finally(() => {
            setSearchLoading(false);
        })
    }

    const handleFilterChange = (update: ProjectsFilterUpdate | React.ChangeEvent<HTMLInputElement>) => {
        let name: keyof ProjectFilterData;
        let value: any;

        if ('target' in update) {
            name = update.target.name as keyof ProjectFilterData;
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
            <PageLabel size={'h3'}>Оценка проектов</PageLabel>
            <ProjectsSectionFilters
                filterData={filterData}
                setFilterData={handleFilterChange}
                onResetFilters={handleResetFilters}
                onSearch={handleSearch}
            />
            {searchLoading ? <Loader/> :
                projects.list?.length > 0 ? (
                    projects.list.map((project) => (
                        <div key={`project_${project.project.id}`}>
                            <ValidateProjectItem project={project} criteria={projects.criteria} hackathonId={hackathonId}/>
                        </div>
                    ))
                ) : (
                    <div className={classes.noResults}><p>Проекты не найдены</p></div>
                )
            }
            {searchError && <Error>{searchError}</Error>}
        </div>
    );
}


export default ValidateSection