import {request} from "../../config.ts";
import {OrganizationCreate, OrganizationFilterData, OrganizationSearchData} from "./types.ts";

export const OrganizationAPI = {
    create: async (data: OrganizationCreate) =>
        request<any>({ method: 'POST', url: '/organization', data}),
    getMy: async (filterData: OrganizationFilterData) =>
        request<OrganizationSearchData>({method: 'POST', url: 'organization/my', data: filterData}),
    getAll: async (filterData: OrganizationFilterData) =>
        request<OrganizationSearchData>({method: 'POST', url: 'organization/list', data: filterData}),
    setStatus: async (organizationId:number, status: number) =>
        request<OrganizationSearchData>({method: 'PUT', url: `organization/${organizationId}`, data: {status}})
};