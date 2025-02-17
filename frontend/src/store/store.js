import { configureStore } from "@reduxjs/toolkit";
import { default as logger } from "redux-logger";
import sessionReducer from './session';
import spotsReducer from './spots';

const store = configureStore({
    reducer: {
        session: sessionReducer,
        spots: spotsReducer,
    },
    middleware: (getDefaultMiddleware) => {
        const middlewares = getDefaultMiddleware();
        if (import.meta.env.MODE === "development") {  // Use import.meta.env.MODE for environment checks
            middlewares.push(logger);
        }
        return middlewares;
    },
    devTools: import.meta.env.MODE !== "production", // Use import.meta.env.MODE to determine devTools
});

export default store;
