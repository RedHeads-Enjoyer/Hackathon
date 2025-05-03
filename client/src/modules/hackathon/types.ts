import {Stage} from "../../components/stepsListWithDates/types.ts";
import {Option} from "../organozaton/types.ts";

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