export type Technology = {
    name: string,
    description: string
}

export type TechnologyCreate = {
    name: string,
    description: string
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

export type TechnologiesSearchData = {
    list: Technology[],
    limit: number,
    offset: number,
    total: number
}