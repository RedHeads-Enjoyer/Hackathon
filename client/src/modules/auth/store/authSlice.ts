import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../authTypes';

interface AuthState {
    user: User | null;
    loading: boolean;
}

const initialState: AuthState = {
    user: null,
    loading: true,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart(state) {
            state.loading = true;
        },
        loginSuccess(state, action: PayloadAction<User>) {
            state.user = action.payload;
            state.loading = false;
        },
        loginFailure(state) {
            state.loading = false;
        },
        logout(state) {
            state.user = null;
        }
    },
});

export const { loginStart, loginSuccess, loginFailure, logout} = authSlice.actions;
export default authSlice.reducer;