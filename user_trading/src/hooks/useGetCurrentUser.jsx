import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { USER_API_END_POINT } from "../apis/apis";
import { setUser } from "../redux/authSlice";
const useGetCurrentUser = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    console.log("useGetCurrentUser called");
    const fetchCurrentUser = async () => {
      console.log("Fetching profile...");
      try {
        const res = await axios.get(`${USER_API_END_POINT}/profile`, {
          withCredentials: true,
        });
        console.log("Profile Response:", res.status, res.data);
        console.log("data", res.data);
        if (res.data.success) {
          dispatch(setUser(res.data.user));
        }
      } catch (error) {
        console.log("Status:", error.response?.status);
        console.log("Response:", error.response?.data);
        console.error(error);
      }
    };
    fetchCurrentUser();
  }, []);
};

export default useGetCurrentUser;
