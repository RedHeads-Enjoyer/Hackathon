import {request} from "../../config.ts";
import {MentorInvite} from "./types.ts";

export const InviteApi = {
    getMentorInvites: async () =>
        request<MentorInvite[]>({ method: 'GET', url: 'hackathon/mentor/invite'}),
    acceptMentorInvite: async (id: number) => {
        await request<any>({method: 'GET', url: `hackathon/mentor/invite/accept/${id}`})},
    rejectMentorInvite: async (id: number) => {
        await request<any>({method: 'GET', url: `hackathon/mentor/invite/reject/${id}`})},
};