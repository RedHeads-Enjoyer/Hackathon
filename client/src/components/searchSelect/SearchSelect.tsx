import React, {useEffect, useRef, useState} from "react";
import classes from './styles.module.css';
import Input from "../input/Input.tsx";
import {Option} from "../../modules/organozaton/types.ts";
import {request} from "../../config.ts";
import Error from "../error/Error.tsx";
import Loader from "../loader/Loader.tsx";

type SearchSelectPropsType = {
    url: string;
    onChange: (option: Option) => void;
    placeholder?: string;
    label?: string;
    error?: string;
    required?: boolean;
    notFound: React.ReactNode;
    clearable?: boolean; // New optional prop
}

const SearchSelect = (props: SearchSelectPropsType) => {
    const [search, setSearch] = useState<string>("")
    const [confirmedText, setConfirmedText] = useState<string>("")
    const [options, setOptions] = useState<Option[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState<boolean>(false)
    const [isOpen, setIsOpen] = useState<boolean>(false)
    // Flag to prevent search when programmatically setting text
    const skipSearchRef = useRef<boolean>(false);

    const debounceTime = 300;
    const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Skip search if the flag is set
        if (skipSearchRef.current) {
            skipSearchRef.current = false;
            return;
        }

        if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
        }

        if (search.trim()) {
            timeoutIdRef.current = setTimeout(() => {
                setLoading(true);
                setError(null);
                setIsOpen(true);
                request<Option[]>({method: 'POST', url: props.url, data: {name: search}})
                    .then((data) => {
                        setOptions(data);
                    })
                    .catch(() => {
                        setError("Ошибка поиска");
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
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        skipSearchRef.current = false; // Make sure search happens for user input
        setSearch(e.target.value);
    };

    const handleInputFocus = () => {
        if (search.trim()) {
            setIsOpen(true);
        }
    };

    const isError = props.error;

    return (
        <div className={`${classes.input_container} ${isError ? classes.error : ''}`} ref={containerRef}>
            <Input
                label={props.label}
                type="text"
                value={search}
                onChange={handleInputChange}
                placeholder={props.placeholder}
                required={props.required}
                error={props.error}
                onFocus={handleInputFocus}
                onBlur={() => {
                    setTimeout(() => {
                        if (!isOpen) {
                            skipSearchRef.current = true; // Set flag to skip search
                            setSearch(confirmedText);
                        }
                    }, 150);
                }}
            />
            {error && <Error>{error}</Error>}

            {isOpen && (
                <div className={classes.options_container}>
                    {loading ? (
                            <div className={classes.option_item}>
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