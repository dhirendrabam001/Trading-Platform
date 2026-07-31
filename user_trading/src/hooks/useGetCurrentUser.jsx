import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { USER_API_END_POINT } from "../apis/apis";
import { setUser } from "../redux/authSlice";
const useGetCurrentUser = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${USER_API_END_POINT}/profile`, {
          withCredentials: true,
        });

        console.log("data", res.data);
        if (res.data.success) {
          dispatch(setUser(res.data.user));
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchCurrentUser();
  }, []);
};

export default useGetCurrentUser;
