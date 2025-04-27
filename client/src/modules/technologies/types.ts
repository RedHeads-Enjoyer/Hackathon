export type Technology = {
    ID: number
    name: string,
    description: string
}

export type TechnologyCreate = {
    name: string,
    description: string
}

export type TechnologyUpdate = {
    name: string,
    description: string
}

export type TechnologiesSearchData = {
    list: Technology[],
    limit: number,
    offset: number,
    total: number
}

export type TechnologyFormError = {
    name?: string,
    description?: string,
}

export type TechnologyFilterData = {
    name: string,
    limit: number,
    offset: number,
    total: number
}

export type FilterUpdate = {
    name: keyof TechnologyFilterData;
    value: any;
};