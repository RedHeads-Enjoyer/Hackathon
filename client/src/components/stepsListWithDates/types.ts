// types.ts
export interface Stage {
    id: string;
    order: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
}

export interface StageError {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
}

export interface HackathonStagesProps {
    initialStages: Stage[];
    onChange: (stages: Stage[]) => void;
    errors?: Record<string, StageError>; // Объект с ошибками по ID этапа
    required?: boolean;
}