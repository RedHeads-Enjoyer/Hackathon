import {request} from "../../config.ts";

export const logoutAPI = {
    logout: async () =>
        request({ method: 'POST', url: '/auth/logout'}),
};