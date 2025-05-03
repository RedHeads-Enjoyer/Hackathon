export interface Stage {
    id: string;
    order: number;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
}

export interface HackathonStagesProps {
    initialStages?: Stage[];
    onChange: (stages: Stage[]) => void;
    required?: boolean
}
