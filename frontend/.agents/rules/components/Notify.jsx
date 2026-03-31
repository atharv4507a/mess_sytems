import toast from 'react-hot-toast';

/**
 * Standardized Notification Component Wrapper
 * Use this for all success, error, and info messages.
 */
const Notify = {
  success: (message) => {
    toast.success(message);
  },
  error: (message) => {
    toast.error(message);
  },
  loading: (message) => {
    return toast.loading(message);
  },
  dismiss: (id) => {
    toast.dismiss(id);
  }
};

export default Notify;
