import emailjs from '@emailjs/browser';

function getSessionUserEmail() {
  try {
    const rawUser = localStorage.getItem('user');

    if (!rawUser) {
      return '';
    }

    const parsedUser = JSON.parse(rawUser);
    return typeof parsedUser?.email === 'string' ? parsedUser.email.trim() : '';
  } catch {
    return '';
  }
}

function resolveRecipientEmail(user) {
  const directEmail = typeof user?.email === 'string' ? user.email.trim() : '';
  const sessionEmail = getSessionUserEmail();
  return directEmail || sessionEmail;
}

export const sendJobApplicationEmail = async (job, user) => {
  const recipientEmail = resolveRecipientEmail(user);

  if (!recipientEmail) {
    return {
      success: false,
      reason: 'missing-user-email',
    };
  }

  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

  if (!serviceId || !templateId || !publicKey) {
    return {
      success: false,
      reason: 'missing-emailjs-config',
    };
  }

  const templateParams = {
    to_name: user.name || 'Applicant',
    to_email: recipientEmail,
    applicant_email: recipientEmail,
    job_title: job.title,
    company_name: job.company,
    applied_at: new Date().toLocaleString(),
  };

  try {
    const response = await emailjs.send(serviceId, templateId, templateParams, publicKey);
    return {
      success: true,
      status: response.status,
      recipientEmail,
    };
  } catch (error) {
    return {
      success: false,
      reason: 'send-failed',
      error,
    };
  }
};
