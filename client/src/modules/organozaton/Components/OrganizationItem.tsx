import React from 'react';
import classes from '../style.module.css';
import { Organization } from '../types.ts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type OrganizationCardProps = {
    organization: Organization;
};

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'dd.MM.yyyy HH:mm:ss', { locale: ru });
};

const OrganizationItem: React.FC<OrganizationCardProps> = ({ organization }) => {
    return (
        <div className={classes.card}>
            <h3 className={classes.title}>{organization.legalName}</h3>
            <p className={classes.info}>ИНН: {organization.INN}</p>
            <p className={classes.info}>ОГРН: {organization.OGRN}</p>
            <p className={classes.info}>Email: {organization.contactEmail}</p>
            <p className={classes.info}>Вебсайт: <a href={organization.website}>{organization.website}</a></p>
            <p className={classes.info}>Дата создания: {formatDate(organization.CreatedAt)}</p>
            <p className={classes.info}>Дата изменения: {formatDate(organization.UpdatedAt)}</p>
            <p className={`${classes.info} ${classes.status}`}>Статус: {organization.status}</p>
        </div>
    );
};

export default OrganizationItem;