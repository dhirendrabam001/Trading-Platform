import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./autSlice";

const store = configureStore({
  reducer: {
    authSlice: authSlice,
  },
});

export default store;
