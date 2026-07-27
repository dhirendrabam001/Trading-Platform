import { toast } from "react-toastify";

// ✅ BASIC TOASTS
export const showSuccess = (msg) => toast.success(msg);
export const showError = (msg) => toast.error(msg);
export const showInfo = (msg) => toast.info(msg);
export const showWarning = (msg) => toast.warning(msg);

// ⭐ PROMISE TOAST (PRO VERSION)
export const showPromise = (promise, messages = {}) => {
  return toast.promise(promise, {
    pending: messages.pending || "Processing...",

    // ✅ SUCCESS
    success: {
      render({ data }) {
        // data = axios response
        return (
          messages.success ||
          data?.data?.message || // 🔥 backend message
          "Success ✅"
        );
      },
    },

    // ❌ ERROR
    error: {
      render({ data }) {
        return (
          data?.response?.data?.message || // 🔥 backend error
          messages.error ||
          "Something went wrong ❌"
        );
      },
    },
  });
};
