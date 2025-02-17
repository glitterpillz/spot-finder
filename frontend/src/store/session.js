import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    loading: false,
    errors: null,
}

export const restoreUser = createAsyncThunk(
    "session/restoreUser",
    async (_, { rejectWithValue }) => {
        try {
            const res = await fetch("/api/session")
            const data = await res.json();

            if (!res.ok) {
                return rejectWithValue(data);
            }

            return data.user || data;
        } catch (error) {
            return rejectWithValue(error.message || "Error getting current user");
        }
    }
);


const sessionSlice = createSlice({
    name: "session",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(restoreUser.pending, (state) => {
                state.loading = true;
                state.errors = null;
            })
            .addCase(restoreUser.rejected, (state, action) => {
                state.loading = false;
                state.errors = action.payload;
            })
            .addCase(restoreUser.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            });
    },
});

export default sessionSlice.reducer;