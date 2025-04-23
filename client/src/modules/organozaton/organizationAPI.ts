import {request} from "../../config.ts";
import {Organization, OrganizationCreate, OrganizationFilterData} from "./types.ts";

export const OrganizationAPI = {
    create: async (data: OrganizationCreate) =>
        request<any>({ method: 'POST', url: '/organization', data}),
    getMy: async (filterData: OrganizationFilterData) =>
        request<Organization[]>({method: 'POST', url: 'organizations/my', data: filterData})
};