import {request} from "../../config.ts";
import {MentorInvite} from "./types.ts";

export const InviteApi = {
    getMentorInvites: async () =>
        request<MentorInvite[]>({ method: 'GET', url: '/invites/mentor'}),
    acceptMentorInvite: async (id: number) => {
        await request<any>({method: 'GET', url: `/invites/mentor/accept/${id}`})},
    rejectMentorInvite: async (id: number) => {
        await request<any>({method: 'GET', url: `/invites/mentor/reject/${id}`})},
};