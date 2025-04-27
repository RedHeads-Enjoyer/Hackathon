import {request} from "../../config.ts";
import {TechnologiesSearchData, TechnologyCreate, TechnologyFilterData, TechnologyUpdate} from "./types.ts";


export const technologyAPI = {
    create: async (data: TechnologyCreate) =>
        request<any>({ method: 'POST', url: '/technology', data}),
    getAll: async (filterData: TechnologyFilterData): Promise<TechnologiesSearchData> =>
        request<TechnologiesSearchData>({method: 'POST', url: '/technologies', data: filterData}),
    update: async (technologyId: number, data: TechnologyUpdate): Promise<TechnologiesSearchData> =>
        request<TechnologiesSearchData>({method: 'PUT', url: `/technology/${technologyId}`, data: data}),
    delete: async (technologyId: number) =>
        request<any>({method: 'DELETE', url: `/technology/${technologyId}`}),
};