import {request} from "../../config.ts";
import {TechnologiesSearchData, TechnologyCreate, TechnologyFilterData} from "./types.ts";


export const technologiesAPI = {
    create: async (data: TechnologyCreate) =>
        request<any>({ method: 'POST', url: '/technologies', data}),
    getAll: async (filterData: TechnologyFilterData) =>
        request<TechnologiesSearchData>({method: 'POST', url: '/technologies', data: filterData}),
};