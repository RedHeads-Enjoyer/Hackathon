import React, {useEffect, useRef, useState} from "react";
import classes from './styles.module.css';
import Input from "../input/Input.tsx";
import {Option} from "../../modules/organozaton/types.ts";
import {request} from "../../config.ts";
import Loader from "../loader/Loader.tsx";

type SearchSelectPropsType = {
    url: string;
    onChange: (option: Option) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    required?: boolean;
    notFound: React.ReactNode;
    clearable?: boolean;
    initialOption?: Option; // Начальное значение в виде объекта {value: number, label: string}
}

const SearchSelect = (props: SearchSelectPropsType) => {
    const [search, setSearch] = useState<string>("")
    const [confirmedText, setConfirmedText] = useState<string>("")
    const [options, setOptions] = useState<Option[]>([])
    const [searchError, setSearchError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [isOpen, setIsOpen] = useState<boolean>(false)
    const skipSearchRef = useRef<boolean>(false);
    const initializedRef = useRef<boolean>(false);
    const userModifiedRef = useRef<boolean>(false); // Новый реф для отслеживания изменений пользователем

    const debounceTime = 300;
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Установка начального значения
    useEffect(() => {
        if (props.initialOption && !initializedRef.current) {
            setSearch(props.initialOption.label);
            setConfirmedText(props.initialOption.label);
            props.onChange(props.initialOption); // Вызываем onChange с начальным значением
            initializedRef.current = true;
        }
    }, [props.initialOption]);

    useEffect(() => {
        // Skip search if the flag is set
        if (skipSearchRef.current) {
            skipSearchRef.current = false;
            return;
        }

        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }

        // Выполняем поиск только если текст был модифицирован пользователем
        if (search.trim() && userModifiedRef.current) {
            timeoutIdRef.current = setTimeout(() => {
                setLoading(true);
                setSearchError(null);
                setIsOpen(true);
                request<Option[]>({method: 'POST', url: props.url, data: {name: search}})
                    .then((data) => {
                        setOptions(data);
                    })
                    .catch(() => {
                        setSearchError("Ошибка поиска");
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            }, debounceTime);
        } else {
            setOptions([]);
        }

        return () => {
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current);
            }
        };
    }, [search, props.url]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                handleDropdownClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [confirmedText]);

    const handleDropdownClose = () => {
        setIsOpen(false);
        // Reset to confirmed text if no option was selected
        if (search !== confirmedText) {
            skipSearchRef.current = true; // Set flag to skip search
            setSearch(confirmedText);
        }
    };

    const handleOptionClick = (option: Option) => {
        props.onChange(option);

        if (props.clearable) {
            // If clearable, reset both search and confirmed text
            skipSearchRef.current = true;
            setSearch("");
            setConfirmedText("");
        } else {
            // Normal behavior - set text to selected option
            skipSearchRef.current = true;
            setSearch(option.label);
            setConfirmedText(option.label);
        }

        setIsOpen(false);
        userModifiedRef.current = false; // Сбрасываем флаг модификации после выбора
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        skipSearchRef.current = false;
        userModifiedRef.current = true; // Пользователь изменил текст
        setSearch(newValue);

        // Автоматически открывать выпадающий список при вводе
        if (newValue.trim()) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    };

    const handleInputFocus = () => {
        // Открываем выпадающий список при фокусе только если пользователь
        // уже изменил текст или поле пустое (без initialOption)
        if (userModifiedRef.current && search.trim()) {
            setIsOpen(true);
        }
    };

    // Combine external error with search error
    const displayError = props.error || searchError;

    return (
        <div className={classes.select_container} ref={containerRef}>
            <Input
                label={props.label}
                type="text"
                value={search}
                onChange={handleInputChange}
                placeholder={props.placeholder}
                required={props.required}
                error={displayError || undefined}
                onFocus={handleInputFocus}
                onBlur={() => {
                    setTimeout(() => {
                        if (!isOpen) {
                            skipSearchRef.current = true;
                            setSearch(confirmedText);
                        }
                    }, 150);
                }}
            />

            {isOpen && (
                <div className={classes.options_container}>
                    {loading ? (
                        <div className={classes.loader_item}>
                            <Loader />
                        </div>
                    ) : options.length === 0 ? (
                        <div className={classes.not_found}>{props.notFound}</div>
                    ) : (
                        options.map((option) => (
                            <div
                                key={option.value}
                                className={classes.option_item}
                                onClick={() => handleOptionClick(option)}
                            >
                                {option.label}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchSelect;