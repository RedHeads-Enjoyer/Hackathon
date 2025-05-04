import React, { useState, useEffect } from 'react';
import { hackathonAPI } from '../../modules/hackathon/hackathonAPI';
import styles from './styles.module.css';

interface ApiImageProps {
    fileId: string | number | null | undefined;
    alt: string;
    className?: string;
    placeholderContent?: React.ReactNode;
    placeholderClassName?: string;
}

const ApiImage: React.FC<ApiImageProps> = ({
                                               fileId,
                                               alt,
                                               className = '',
                                               placeholderContent,
                                               placeholderClassName = '',
                                           }) => {
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<boolean>(false);
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!fileId) {
            setLoading(false);
            setError(true);
            return;
        }

        let isMounted = true;

        const loadImage = async () => {
            try {
                const blob = await hackathonAPI.getBlobFile(Number(fileId));

                const objectUrl = URL.createObjectURL(blob);

                if (isMounted) {
                    setImageSrc(objectUrl);
                    setLoading(false);
                    setError(false);
                }
            } catch (err) {
                if (isMounted) {
                    setLoading(false);
                    setError(true);
                }
            }
        };

        loadImage();

        return () => {
            isMounted = false;
            if (imageSrc) {
                URL.revokeObjectURL(imageSrc);
            }
        };
    }, [fileId]);

    if (loading) {
        return (
            <div className={`${placeholderClassName} ${className} ${styles.loading}`}>
                <div className={styles.spinner}></div>
            </div>
        );
    }

    if (error || !imageSrc) {
        return (
            <div className={placeholderClassName || className}>
                {placeholderContent}
            </div>
        );
    }

    return (
        <img
            src={imageSrc}
            alt={alt}
            className={className}
            onError={() => setError(true)}
        />
    );
};

export default ApiImage;