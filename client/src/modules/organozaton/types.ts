export type OrganizationCreate = {
    legalName: string,
    INN: string,
    OGRN: string,
    contactEmail: string,
    website: string
}

export type OrganizationCreateErrors = {
    legalName?: string,
    INN?: string,
    OGRN?: string,
    contactEmail?: string,
    website?: string
}

export type Organization = {
    ID: number,
    legalName: string,
    INN: string,
    OGRN: string,
    contactEmail: string,
    website: string,
    status: number,
    CreatedAt: string,
    UpdatedAt: string,
}

export type OrganizationFilterData = {
    status: number,
    legalName: string,
    INN: string,
    OGRN: string,
    contactEmail: string,
    website: string,
    limit: number,
    offset: number,
    total: number
}

export type OrganizationSearchData = {
    list: Organization[],
    total: number
}

export type SelectOption = {
    value: number
    label: string
}

export type FilterUpdate = {
    name: keyof OrganizationFilterData;
    value: any;
};