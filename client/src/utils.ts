import {formatDate} from "date-fns";

export const safeFormatDate = (dateString: string | Date | null | undefined, formatStr: string = 'dd.MM.yyyy'): string => {
    if (!dateString) return 'не указано';

    try {
        // Если дата передана как строка, преобразуем ее в объект Date
        const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

        // Проверка на валидность даты
        if (isNaN(date.getTime())) {
            return 'некорректная дата';
        }

        return formatDate(date, formatStr);
    } catch (error) {
        console.error('Ошибка форматирования даты:', error);
        return 'некорректная дата';
    }
};