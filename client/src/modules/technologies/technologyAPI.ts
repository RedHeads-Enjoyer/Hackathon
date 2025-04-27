import {request} from "../../config.ts";
import {TechnologiesSearchData, TechnologyCreate, TechnologyFilterData} from "./types.ts";


export const technologyAPI = {
    create: async (data: TechnologyCreate) =>
        request<any>({ method: 'POST', url: '/technology', data}),
    getAll: async (filterData: TechnologyFilterData): Promise<TechnologiesSearchData> =>
        request<TechnologiesSearchData>({method: 'POST', url: '/technologies', data: filterData}),
    update: async (data: Tec): Promise<TechnologiesSearchData> =>
        request<TechnologiesSearchData>({method: 'POST', url: '/technology', data: filterData}),
};