export type MentorInvitesSearchData = {
    list: MentorInvite[],
    total: number
}

export type MentorInvite = {
    id: number,
    createdAt: string,
    hackathonName: string,
    hackathonId: number
    status: number
}
