import classes from './style.module.css';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

type PaginationProps = {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
};

const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

    // Ограничиваем currentPage в допустимых пределах
    const normalizedCurrentPage = Math.max(1, Math.min(currentPage, totalPages));

    const getVisiblePages = () => {
        const visiblePages = [];
        const maxVisible = 5;
        let start = Math.max(1, normalizedCurrentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);

        // Корректируем, если в начале
        if (normalizedCurrentPage <= Math.floor(maxVisible / 2) + 1) {
            start = 1;
            end = Math.min(maxVisible, totalPages);
        }
        // Корректируем, если в конце
        else if (normalizedCurrentPage >= totalPages - Math.floor(maxVisible / 2)) {
            end = totalPages;
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            visiblePages.push(i);
        }

        return visiblePages;
    };

    const handleClick = (page: number) => {
        if (page !== normalizedCurrentPage) {
            onPageChange(page);
        }
    };

    if (totalPages <= 1) return null;

    return (
        <div className={classes.pagination}>
            <button
                className={`${classes.paginationButton} ${normalizedCurrentPage === 1 ? classes.disabled : ''}`}
                onClick={() => handleClick(normalizedCurrentPage - 1)}
                disabled={normalizedCurrentPage === 1}
                aria-label="Previous page"
            >
                <FiChevronLeft />
            </button>

            {getVisiblePages().map(page => (
                <button
                    key={page}
                    className={`${classes.paginationButton} ${normalizedCurrentPage === page ? classes.active : ''}`}
                    onClick={() => handleClick(page)}
                    aria-current={normalizedCurrentPage === page ? 'page' : undefined}
                >
                    {page}
                </button>
            ))}

            <button
                className={`${classes.paginationButton} ${normalizedCurrentPage === totalPages ? classes.disabled : ''}`}
                onClick={() => handleClick(normalizedCurrentPage + 1)}
                disabled={normalizedCurrentPage === totalPages}
                aria-label="Next page"
            >
                <FiChevronRight />
            </button>
        </div>
    );
};

export default Pagination;