import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { csrfFetch } from "./csrf";

const initialState = {
    spots: [],
    userSpots: { Spots: [] },
    spotDetails: null,
    loading: false,
    errors: null
}

export const getAllSpots = createAsyncThunk(
    "spots/getAllSpots",
    async (_, { rejectWithValue }) => {
        try {
            const res = await fetch("/api/spots");

            if (!res.ok) {
                const data = await res.json();
                throw new Error(`Error getting spots: ${data.message}`);
            }

            const data = await res.json(); // Directly parse JSON
            console.log("Raw response:", data); // Log the parsed data

            return data.Spots || data;
        } catch (error) {
            return rejectWithValue(error.message || 'Error fetching all spots');
        }
    }
);


export const fetchUserSpots = createAsyncThunk(
    "spots/fetchUserSpots",
    async (_, { rejectWithValue }) => {
        try {
            const res = await csrfFetch("/api/session/spots");
            const data = await res.json();
    
            if (!res.ok) {
                return rejectWithValue(data);
            }
    
            return data?.Spots || []; // Ensure it's an array
        } catch (error) {
            return rejectWithValue(error.message || "Error fetching user spots");
        }
    }    
)

const spotsSlice = createSlice({
    name: "spots",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
        .addCase(getAllSpots.pending, (state) => {
            state.loading = true;
            state.errors = null;
        })
        .addCase(getAllSpots.rejected, (state, action) => {
            state.loading = false;
            state.errors = action.payload;
        })
        .addCase(getAllSpots.fulfilled, (state, action) => {
            state.loading = false;
            state.spots = action.payload || [];
        })
        .addCase(fetchUserSpots.pending, (state) => {
            state.loading = true;
            state.errors = null;
        })
        .addCase(fetchUserSpots.rejected, (state, action) => {
            state.loading = false;
            state.errors = action.payload;
        })
        .addCase(fetchUserSpots.fulfilled, (state, action) => {
            state.loading = false;
            state.userSpots = action.payload || [];
        });
    }
})

export default spotsSlice.reducer;