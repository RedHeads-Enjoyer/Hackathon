import {request, requestFile} from "../../config.ts";
import {
    ChatListResponse, ChatMessagesResponse,
    FileShort,
    HackathonFilterData,
    HackathonFormData,
    HackathonFullData,
    HackathonFullEditData, HackathonInfo,
    HackathonSearchData,
    ParticipantFilterData,
    ParticipantSearchData, ProjectFilterData,
    ProjectSearchData, ResultsSearchData,
    TeamCreate,
    TeamData,
    TeamInvite, ValidateCriteria
} from "./types.ts";

export const HackathonAPI = {
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

            mentors: data.mentors?.map(mentor => mentor.value),
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
        request<HackathonSearchData>({method: 'POST', url: 'hackathon/list', data: filterData}),
    getBlobFile: async (fileId: number): Promise<Blob> => {
        return requestFile(fileId);
    },
    getFullById: async (hackathonId: number) =>
        request<HackathonFullData>({method: 'GET', url: `hackathon/${hackathonId}`}),
    getFullForEditById: async (hackathonId: number) =>
        request<HackathonFullEditData>({method: 'GET', url: `hackathon/${hackathonId}/edit`}),
    join: async (hackathonId: number) =>
        request<any>({method: 'GET', url: `hackathon/join/${hackathonId}`}),
    getParticipants: async (hackathonId: number, filterData: ParticipantFilterData) =>
        request<ParticipantSearchData>({method: 'POST', url: `hackathon/participants/${hackathonId}`, data: filterData}),
    getTeam: async (hackathonId: number) =>
        request<TeamData>({method: 'GET', url: `hackathon/team/${hackathonId}`}),
    createTeam: async (hackathonId: number, data: TeamCreate)=>
        request<any>({method: 'POST', url: `hackathon/team/${hackathonId}`, data}),
    inviteToTeam: async (hackathonId: number, userId: number) =>
        request<any>({method: 'GET', url: `hackathon/team/invite/${hackathonId}/${userId}`}),
    deleteTeam: async (hackathonId: number) =>
        request<any>({method: 'DELETE', url: `hackathon/team/${hackathonId}`}),
    getTeamInvites: async (hackathonId: number) =>
        request<TeamInvite[]>({method: "GET", url: `hackathon/${hackathonId}/team/invite`}),
    acceptTeamInvite: async (inviteId: number) =>
        request<any>({method: "GET", url: `hackathon/team/accept/${inviteId}`}),
    rejectTeamInvite: async (inviteId: number) =>
        request<any>({method: "GET", url: `hackathon/team/reject/${inviteId}`}),
    leaveTeam: async(hackathonId: number) =>
        request<any>({method: "GET", url: `hackathon/team/leave/${hackathonId}`}),
    kickTeam: async(hackathonId: number, userId: number) =>
        request<any>({method: "GET", url: `hackathon/team/kick/${hackathonId}/${userId}`}),
    uploadProject: async(hackathonId: number, data: FormData) =>
        request<any>({method: "POST", url: `hackathon/${hackathonId}/project`, data}),
    getTeamProject: async(hackathonId: number) =>
        request<FileShort[]>({method: "GET", url: `hackathon/${hackathonId}/project`}),
    getMyRole: async(hackathonId: number) =>
        request<HackathonInfo>({method: "GET", url: `hackathon/${hackathonId}/role`}),
    getProjectsForValidate: async(hackathonId: number, filterData: ProjectFilterData) =>
        request<ProjectSearchData>({method: "POST", url: `hackathon/${hackathonId}/validate/projects`, data: filterData}),
    submitProjectRatings: async(hackathonId: number, teamId: number, criteria: ValidateCriteria[]) =>
        request<any>({method: "POST", url: `hackathon/${hackathonId}/team/${teamId}/rating`, data: criteria}),
    getAvailableChats: async(hackathonId: number) =>
        request<ChatListResponse>({method: "GET", url: `hackathon/${hackathonId}/chats`}),
    getChatMessages: async(chatId: number, limit: number = 50, offset: number = 0) =>
        request<ChatMessagesResponse>({
            method: "GET",
            url: `chat/${chatId}/messages`,
            params: { limit, offset }
        }),
    getResults: async(hackathonId: number) =>
        request<ResultsSearchData>({method: "GET", url: `hackathon/${hackathonId}/results`})

};