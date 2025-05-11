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
    organizationId: number;
    stages: Stage[];
    criteria: Criteria[];
    technologies: Option[];
    mentors?: Option[];
    awards: Award[];
    documents: File[];
    mentorInvites?: MentorInvite[]
}

export interface HackathonUpdateFormData {
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
    stages: Stage[];
    criteria: Criteria[];
    technologies: Option[];
    mentors: Option[];
    awards: Award[];
    documents: File[];
    filesToDelete: number[]
}

export type FilterUpdate = {
    name: keyof HackathonFilterData;
    value: any;
};

export type HackathonShortInfo = {
    id: number;
    name: string;
    organizationName: string;
    regDateFrom: string;
    regDateTo: string;
    workDateFrom: string;
    workDateTo: string;
    evalDateFrom: string;
    evalDateTo: string;
    logoId?: number;
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

export type FileShort = {
    id: number;
    name: string;
    type: string;
    size: number;
};

export type HackathonStep = {
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
}


export type Award = {
    id: string;
    moneyAmount: number;
    additionally: string;
    placeFrom: number;
    placeTo: number;
};

export type TechnologyShort = {
    id: number;
    name: string;
};

export type Criteria = {
    id: string;
    name: string;
    maxScore: number;
    minScore: number;
};

export type HackathonFullData = {
    id: number;
    name: string;
    description: string;
    organizationName: string;

    // Даты хакатона
    regDateFrom: string;  // ISO 8601 формат даты
    regDateTo: string;
    workDateFrom: string;
    workDateTo: string;
    evalDateFrom: string;
    evalDateTo: string;

    // Дополнительная информация
    logoId: number | null;
    totalAward: number;
    minTeamSize: number;
    maxTeamSize: number;
    usersCount: number;

    // Связанные сущности
    files: FileShort[];
    steps: HackathonStep[];
    awards: Award[];
    technologies: TechnologyShort[];
    criteria: Criteria[];

    hackathonRole: number;
};

export type HackathonFullEditData = {
    id: number;
    name: string;
    description: string;
    organizationId: number;
    organizationName: string;

    // Даты хакатона
    regDateFrom: string;
    regDateTo: string;
    workDateFrom: string;
    workDateTo: string;
    evalDateFrom: string;
    evalDateTo: string;

    // Статус хакатона
    status: number;

    // Дополнительная информация
    logoId: number | null;
    totalAward: number;
    minTeamSize: number;
    maxTeamSize: number;
    usersCount: number;

    // Связанные сущности
    files: FileShort[];
    steps: HackathonStep[];
    awards: Award[];
    technologies: TechnologyShort[];
    criteria: Criteria[];
    mentorInvites: MentorInvite[]

    hackathonRole: number;
};

export type MentorInvite = {
    id: number;
    username: string;
    status: number;
}

export type ParticipantFilterUpdate = {
    name: keyof ParticipantFilterData;
    value: any;
};


export type ParticipantFilterData = {
    name: string,
    isFree: boolean | null,
    limit: number,
    offset: number,
    total: number
}

export type Participant = {
    id: number,
    username: string,
    team: string | null,
    canInvite: number
}

export type ParticipantSearchData = {
    list: Participant[],
    total: number
}

export type TeamCreate = {
    name: string
}

export type TeamData = {
    name: string,
    participants: TeamParticipant[]
    teamRole: number;
}

export type TeamParticipant = {
    id: number,
    username: string,
    teamRole: number
}

export type TeamInvite = {
    id: number;
    teamName: string;
    status: number;
    createdAt: string;
}



export type ProjectFilterData = {
    validate: number,
    limit: number,
    offset: number,
    total: number
}

export type ProjectSearchData = {
    list: ValidateProject[],
    criteria: ValidateCriteria[]
    maxScore: number;
    total: number
}

export type ValidateProject = {
    teamId: number,
    teamName: string,
    project: FileShort,
    summary: number | null,
}

export type ValidateCriteria = {
    name: string,
    maxScore: number,
    minScore: number,
    value: number,
    comment: string,
}

export type ProjectsFilterUpdate = {
    name: keyof ProjectFilterData;
    value: any;
};

export interface ChatItem {
    id: number;
    type: number;
    team_id?: number;
    name: string;
    writeAccess: boolean
}

export interface User {
    id: number;
    name: string;
}

export interface ChatMessage {
    id: number;
    content: string;
    username: string;
    createdAt: string;
    userId: number;
}

export interface ChatListResponse {
    chats: ChatItem[];
    hackathon_name: string;
}

export interface ChatMessagesResponse {
    messages: ChatMessage[];
}

export interface HackathonInfo {
    isRegistration: boolean,
    isWork: boolean,
    isEvaluation: boolean,
    role: number
}

export type ResultsSearchData = {
    list: Result[],
    maxScore: number
}

export type Result = {
    teamName: string,
    score: number,
    project: FileShort,
    award: Award
    criteria: ResCriteria[]
}

export  type ResCriteria = {
    comment: string,
    name: string,
    maxScore: number,
    score: number
}