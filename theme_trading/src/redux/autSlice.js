import { createSlice } from "@reduxjs/toolkit";

const loadStoredUser = () => {
  try {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: loadStoredUser(),
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
  },
});

export const { setUser } = authSlice.actions;
export default authSlice.reducer;
