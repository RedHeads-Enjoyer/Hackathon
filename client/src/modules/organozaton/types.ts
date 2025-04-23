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
