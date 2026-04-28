import { applyJob } from "../services/api";

const ApplyButton = ({ jobId }) => {

  const handleApply = async () => {
    try {
      const res = await applyJob(jobId);

      alert("Application submitted! Check your email 📧");

    } catch (error) {
      alert("Error applying for job");
    }
  };

  return (
    <button onClick={handleApply}>
      Apply Now
    </button>
  );
};

export default ApplyButton;
