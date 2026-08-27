import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import authSlice from "./authSlice";
import { tradingApi } from "./api/tradingApi";

const store = configureStore({
  reducer: {
    auth: authSlice,
    // All server data lives under this one key. You never write reducers for
    // it — RTK Query manages the cache, loading flags and errors itself.
    [tradingApi.reducerPath]: tradingApi.reducer,
  },

  // The API needs its own middleware to run requests and manage the cache.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tradingApi.middleware),
});

// Refetches data when the browser regains focus or comes back online, so a
// tab left open overnight is not showing yesterday's balances.
setupListeners(store.dispatch);

export default store;
