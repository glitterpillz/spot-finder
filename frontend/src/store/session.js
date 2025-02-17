import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { csrfFetch } from "./csrf";

const initialState = {
    user: null,
    loading: false,
    errors: null,
}

export const restoreUser = createAsyncThunk(
    "session/restoreUser",
    async (_, { rejectWithValue }) => {
        try {
            const res = await csrfFetch("/api/session")
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

export const login = createAsyncThunk(
    "session/login",
    async ({ credential, password }, { rejectWithValue }) => {
        try {
            const res = await csrfFetch("/api/session/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    credential,
                    password
                }),
            });
            const data = await res.json();
            
            if (!res.ok) {
                return rejectWithValue(data.error || "Error logging in");
            }

            return data.user || data;
        } catch (error) {
            return rejectWithValue({ general: error.message || "Login failed" });
        }
    }
);


export const signup = createAsyncThunk(
    "session/signup",
    async (
        {
            firstName,
            lastName,
            username,
            email,
            password,
        },
        { rejectWithValue }
    ) => {
        try {
            const res = await fetch("/api/users/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    username,
                    email,
                    password,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                return rejectWithValue(data);
            }

            return data;
        } catch (error) {
            return rejectWithValue(error.message || "Signup failed");
        }
    }
);


export const logout = createAsyncThunk(
    "session/logout",
    async (_, { rejectWithValue }) => {
      try {
        await fetch("/api/session/logout");
        return;
      } catch (error) {
        return rejectWithValue(error.message || "Logout failed");
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
            })
            .addCase(login.pending, (state) => {
                state.loading = true;
                state.errors = null;
            })
            .addCase(login.rejected, (state, action) => {
                state.loading = false;
                state.errors = action.payload;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(signup.pending, (state) => {
                state.loading = true;
                state.errors = null;
            })
            .addCase(signup.rejected, (state, action) => {
                state.loading = false;
                state.errors = action.payload;
            })
            .addCase(signup.fulfilled, (state, action) => {
                state.loading = false;
                state.user = action.payload;
            })
            .addCase(logout.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
            })
        
    },
});

export default sessionSlice.reducer;