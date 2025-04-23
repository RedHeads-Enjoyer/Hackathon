export type OrganizationCreate = {
    legalName: string,
    shortLegalName: string,
    INN: string,
    OGRN: string,
    contactEmail: string,
    website: string
}

export type OrganizationCreateErrors = {
    legalName?: string,
    shortLegalName?: string,
    INN?: string,
    OGRN?: string,
    contactEmail?: string,
    website?: string
}
