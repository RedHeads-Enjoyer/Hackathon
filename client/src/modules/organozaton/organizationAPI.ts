import {request} from "../../config.ts";
import {Organization, OrganizationCreate} from "./types.ts";

export const OrganizationAPI = {
    create: async (data: OrganizationCreate) =>
        request<any>({ method: 'POST', url: '/organization', data}),
    getMy: async () =>
        request<Organization[]>({method: 'get', url: 'organizations/my'})
};