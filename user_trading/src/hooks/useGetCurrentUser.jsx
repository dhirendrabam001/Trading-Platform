import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
import { USER_API_END_POINT } from "../apis/apis";
import { setUser } from "../redux/authSlice";

// Returns true while the profile request is in flight, so the app can hold a
// loader over the first paint instead of flashing an empty dashboard.
const useGetCurrentUser = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchCurrentUser = async () => {
      try {
        const res = await axios.get(`${USER_API_END_POINT}/getProfile`, {
          withCredentials: true,
        });

        if (res.data.success && !cancelled) {
          dispatch(setUser(res.data.user));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return loading;
};

export default useGetCurrentUser;
