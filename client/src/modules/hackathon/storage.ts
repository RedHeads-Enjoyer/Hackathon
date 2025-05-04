import {Option} from "./types.ts";

export const statusOptions: Option[] = [
    {value: -1, label: "Отклонена"},
    {value: 0,  label: "Не рассмотрена"},
    {value: 1, label: "Подтверждена"},
]

export enum HackathonStatus {
    BANNED = -1,
    DRAFT = 0,
    PUBLISHED = 1,
    ARCHIVED = 2
}

export enum HackathonRole {
    NOT_PARTICIPANT = 0,
    PARTICIPANT = 1,
    MENTOR = 2,
    OWNER = 3
}