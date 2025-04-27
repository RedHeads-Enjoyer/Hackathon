import React, { useState } from 'react';
import classes from '../style.module.css';
import { Organization } from '../types.ts';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import Select from "../../../components/select/Select.tsx";
import {statusOptions} from "../storage.ts";
import {OrganizationAPI} from "../organizationAPI.ts";
import Notification, {NotificationProps} from "../../../components/notification/notification.tsx";

type OrganizationCardProps = {
    organization: Organization;
    statusChange?: boolean;
};

const OrganizationItem: React.FC<OrganizationCardProps> = (props) => {
    const [changeStatusLoading, setChangeStatusLoading] = useState<boolean>(false);
    const [organization, setOrganization] = useState<Organization>(props.organization);
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return format(date, 'dd.MM.yyyy HH:mm:ss', { locale: ru });
    };

    const handleStatusChange = (n: number) => {
        setChangeStatusLoading(true);
        OrganizationAPI.setStatus(props.organization.ID, n)
            .then(() => {
                setOrganization(prevState => ({
                    ...prevState,
                    status: n
                }));
                setChangeStatusLoading(false);
                setNotification({
                    message: 'Статус успешно изменен',
                    type: 'success'
                });
            })
            .catch((error) => {
                setChangeStatusLoading(false);
                setNotification({
                    message: 'Ошибка при изменении статуса',
                    type: 'error'
                });
                console.error(error);
            })
            .finally(() => {
                setChangeStatusLoading(false)
            })
    };

    const handleNotificationClose = () => {
        setNotification(null);
    };

    return (
        <div className={classes.card}>
            <h3 className={classes.title}>{organization.legalName}</h3>
            <p className={classes.info}>ИНН: {organization.INN}</p>
            <p className={classes.info}>ОГРН: {organization.OGRN}</p>
            <p className={classes.info}>Email: {organization.contactEmail}</p>
            <p className={classes.info}>Вебсайт: <a href={organization.website}>{organization.website}</a></p>
            <p className={classes.info}>Дата создания: {formatDate(organization.CreatedAt)}</p>
            <p className={classes.info}>Дата изменения: {formatDate(organization.UpdatedAt)}</p>
            {props.statusChange ?
                    <Select
                        options={statusOptions}
                        value={organization.status}
                        onChange={handleStatusChange}
                        loading={changeStatusLoading}
                        label={"Статус"}
                        horizontal
                    />
                :
                <p className={`${classes.info} ${classes.status}`}>Статус: {statusOptions.find(option => option.value == organization.status)?.label}</p>
            }

            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    duration={1500}
                    onClose={handleNotificationClose}
                />
            )}
        </div>
    );
};

export default OrganizationItem;