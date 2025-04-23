import {request} from "../../config.ts";
import {OrganizationCreate} from "./types.ts";

export const OrganizationAPI = {
    create: async (data: OrganizationCreate) =>
        request<any>({ method: 'POST', url: '/organization', data}),
};