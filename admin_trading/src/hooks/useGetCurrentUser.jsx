import { useEffect } from "react";
import axios from "axios";
import { useDispatch } from "react-redux";
const useGetCurrentUser = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.setItem("token");
        if (!token) return;
        const res = await axios.get();
      } catch (error) {
        console.error(error);
      }
    };
  });
};

export default useGetCurrentUser;
