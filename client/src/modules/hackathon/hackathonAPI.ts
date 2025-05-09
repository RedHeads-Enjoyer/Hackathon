import {request, requestFile} from "../../config.ts";
import {
    HackathonFilterData,
    HackathonFormData,
    HackathonFullData,
    HackathonFullEditData,
    HackathonSearchData
} from "./types.ts";

export const hackathonAPI = {
    create: async (data: HackathonFormData) => {
        const formData = new FormData();

        // Подготавливаем JSON-объект для всех остальных данных
        const hackathonDTO = {
            name: data.name,
            description: data.description,

            // Даты
            reg_date_from: new Date(data.regDateFrom).toISOString(),
            reg_date_to: new Date(data.regDateTo).toISOString(),
            work_date_from: new Date(data.workDateFrom).toISOString(),
            work_date_to: new Date(data.workDateTo).toISOString(),
            eval_date_from: new Date(data.evalDateFrom).toISOString(),
            eval_date_to: new Date(data.evalDateTo).toISOString(),

            // Размеры команд
            min_team_size: data.minTeamSize,
            max_team_size: data.maxTeamSize,

            // ID организации
            organization_id: data.organizationId,

            // Технологии - отправляем массив ID
            technologies: data.technologies.map(tech => tech.value),

            // Этапы
            steps: data.stages.map(stage => ({
                name: stage.name,
                description: stage.description,
                start_date: new Date(stage.startDate).toISOString(),
                end_date: new Date(stage.endDate).toISOString()
            })),

            // Критерии оценки
            criteria: data.criteria.map(criterion => ({
                name: criterion.name,
                min_score: criterion.minScore,
                max_score: criterion.maxScore
            })),

            // Награды
            awards: data.awards.map(award => ({
                place_from: award.placeFrom,
                place_to: award.placeTo,
                money_amount: award.moneyAmount,
                additionally: award.additionally
            })),

            mentors: data.mentors.map(mentor => mentor.value),
        };

        // Добавляем JSON данные в FormData
        formData.append('data', JSON.stringify(hackathonDTO));

        // Добавляем файл обложки
        if (data.coverImage) {
            formData.append('logo', data.coverImage);
        }

        // Добавляем документы
        data.documents.forEach(doc => {
            formData.append('files', doc);
        });


        return request<number>({ method: 'POST', url: '/hackathon', data: formData})
    },
    update: async (id: number, data: FormData) => {
        return request<number>({ method: 'PUT', url: `/hackathon/${id}`, data})
    },
    getAll: async (filterData: HackathonFilterData) =>
        request<HackathonSearchData>({method: 'POST', url: 'hackathons', data: filterData}),
    getBlobFile: async (fileId: number): Promise<Blob> => {
        return requestFile(fileId);
    },
    getFullById: async (hackathonId: number) =>
        request<HackathonFullData>({method: 'GET', url: `hackathon/${hackathonId}`}),
    getFullForEditById: async (hackathonId: number) =>
        request<HackathonFullEditData>({method: 'GET', url: `hackathon/${hackathonId}/edit`})
};