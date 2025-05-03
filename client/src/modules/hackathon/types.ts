import {Stage} from "../../components/stepsListWithDates/types.ts";

export interface HackathonFormErrors {
    name?: string | undefined,
    description?: string | undefined,
    organizationId?: string | undefined,
    coverImage?: string | undefined,
    regDateFrom?: string | undefined,
    regDateTo?: string | undefined,
    workDateFrom?: string | undefined;
    workDateTo?: string | undefined;
    evalDateFrom?: string | undefined;
    evalDateTo?: string | undefined;
    minTeamSize?: string | undefined;
    maxTeamSize?: string | undefined;
    stages?: string | undefined,
    stagesInvalid?: boolean,
    criteriaInvalid?: boolean,
    technologiesInvalid?: boolean,
    awardsInvalid?: boolean,
    documents?: string | undefined,
}

export interface HackathonFormData {
    name: string;
    description: string;
    coverImage: File | null;
    regDateFrom: string;
    regDateTo: string;
    workDateFrom: string;
    workDateTo: string;
    evalDateFrom: string;
    evalDateTo: string;
    minTeamSize: number;
    maxTeamSize: number;
    organizationId: number;
    goals: string[];
    stages: Stage[];
    criteria: Criteria[];
    technologies: Option[];
    awards: Award[];
    documents: File[];
}

export interface Criteria {
    id: string;
    name: string;
    minScore: number;
    maxScore: number;
}

export interface Award {
    id: string;
    placeFrom: number;
    placeTo: number;
    moneyAmount: number,
    additionally: string;
}

export type FilterUpdate = {
    name: keyof HackathonFilterData;
    value: any;
};

interface HackathonShortInfo {
    id: number;
    name: string;
    organizationName: string;
    regDateFrom: string;
    regDateTo: string;
    workDateFrom: string;
    workDateTo: string;
    evalDateFrom: string;
    evalDateTo: string;
    logoUrl?: string;
    technologies: string[];
    totalAward: number;
    minTeamSize: number;
    maxTeamSize: number;
    usersCount: number;
}

export type HackathonSearchData = {
    list: HackathonShortInfo[],
    total: number
    limit: number
    offset: number
}

export type HackathonFilterData = {
    name: string,
    startDate: string,
    endDate: string,
    technologyId: number,
    totalAward: number,
    organizationId: number,
    minTeamSize: number,
    maxTeamSize: number,
    limit: number,
    offset: number,
    total: number
}

export type Option = {
    value: number
    label: string
}