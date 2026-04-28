import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  dismissNotification,
  markAllNotificationsRead,
  markNotificationRead,
  syncNotifications,
} from '../features/notificationSlice';

function getJobStatus(job) {
  const candidates = [job?.status, job?.applicationStatus, job?.stage];

  const status = candidates.find(
    (value) => typeof value === 'string' && value.trim() !== ''
  );

  return status ? status.trim().toLowerCase() : '';
}

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function toStableId(value, fallback) {
  if (!hasText(value)) {
    return fallback;
  }

  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function buildNotifications({
  jobs,
  profile,
  success,
  user,
}) {
  const notifications = [];
  const displayName = user?.name?.trim() || profile?.name?.trim() || 'there';
  const profileSource = profile || user || {};
  const interviewCount = jobs.filter((job) => getJobStatus(job).includes('interview')).length;
  const appliedJobs = jobs.filter((job) => getJobStatus(job).includes('applied'));
  const appliedCount = appliedJobs.length;
  const latestAppliedJob = appliedJobs[0];
  const missingProfileFields = [
    !hasText(profileSource.headline) ? 'headline' : null,
    !hasText(profileSource.location) ? 'location' : null,
    !hasText(profileSource.phone) ? 'phone number' : null,
  ].filter(Boolean);

  notifications.push({
    id: 'dashboard-welcome',
    category: 'Dashboard',
    title: `Welcome back, ${displayName}`,
    message: 'Your latest dashboard activity, profile tools, and job updates are ready.',
    href: '/dashboard',
    ctaLabel: 'Open dashboard',
  });

  if (hasText(success)) {
    notifications.push({
      id: `account-update-${toStableId(success, 'latest')}`,
      category: 'Account',
      title: 'Account update completed',
      message: success.trim(),
      href: '/profile',
      ctaLabel: 'Review account',
    });
  }

  if (missingProfileFields.length > 0) {
    notifications.push({
      id: 'profile-reminder',
      category: 'Account',
      title: 'Complete your profile',
      message: `Add your ${missingProfileFields.join(', ')} to make your profile feel more complete.`,
      href: '/profile',
      ctaLabel: 'Update profile',
    });
  }

  if (jobs.length > 0) {
    notifications.push({
      id: `jobs-feed-ready-${jobs.length}`,
      category: 'Jobs',
      title: `${jobs.length} job${jobs.length === 1 ? '' : 's'} available`,
      message: 'Your jobs feed has data ready to browse. Review the latest openings now.',
      href: '/jobs',
      ctaLabel: 'View jobs',
    });
  }

  if (appliedCount > 0) {
    const companyText = hasText(latestAppliedJob?.company) ? ` at ${latestAppliedJob.company}` : '';
    const roleText = hasText(latestAppliedJob?.title) ? latestAppliedJob.title : 'a job';
    notifications.push({
      id: `job-application-activity-${appliedCount}`,
      category: 'Jobs',
      title: appliedCount === 1 ? 'Application submitted' : `${appliedCount} applications submitted`,
      message:
        appliedCount === 1
          ? `You successfully applied to ${roleText}${companyText}.`
          : `You have successfully applied to ${appliedCount} jobs. Keep tracking your progress from the jobs page.`,
      href: '/jobs',
      ctaLabel: 'Open jobs',
    });
  }

  if (interviewCount > 0) {
    notifications.push({
      id: `interview-stage-alert-${interviewCount}`,
      category: 'Jobs',
      title: `${interviewCount} interview-stage opportunit${interviewCount === 1 ? 'y' : 'ies'}`,
      message: 'You have roles marked in the interview stage. Check your dashboard for the quick summary.',
      href: '/dashboard',
      ctaLabel: 'Review stats',
    });
  }

  if (user?.role === 'admin') {
    notifications.push({
      id: 'admin-access',
      category: 'Admin',
      title: 'Admin access available',
      message: 'Protected admin tools are enabled for this account.',
      href: '/admin',
      ctaLabel: 'Open admin',
    });
  }

  return notifications;
}

function NotificationPanel() {
  const dispatch = useDispatch();
  const panelRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const { jobs } = useSelector((state) => state.jobs);
  const { profile, success } = useSelector((state) => state.user);
  const notifications = useSelector((state) => state.notifications.items);

  useEffect(() => {
    dispatch(
      syncNotifications(
        buildNotifications({
          jobs: Array.isArray(jobs) ? jobs : [],
          profile,
          success,
          user,
        })
      )
    );
  }, [dispatch, jobs, profile, success, user]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const handleOpenLink = (notificationId) => {
    dispatch(markNotificationRead(notificationId));
    setIsOpen(false);
  };

  const handleMarkRead = (notificationId) => {
    dispatch(markNotificationRead(notificationId));
  };

  const handleDismiss = (notificationId) => {
    dispatch(dismissNotification(notificationId));
  };

  return (
    <div className="notification-center" ref={panelRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`top-nav__button notification-button${isOpen ? ' notification-button--active' : ''}`}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        type="button"
      >
        <span>Notifications</span>
        <span className="notification-button__badge">{unreadCount}</span>
      </button>

      {isOpen && (
        <section
          aria-label="Notifications"
          className="notification-panel"
          role="dialog"
        >
          <div className="notification-panel__header">
            <div>
              <p className="notification-panel__eyebrow">Inbox</p>
              <h2 className="notification-panel__title">Notifications</h2>
            </div>

            {notifications.length > 0 && unreadCount > 0 && (
              <button
                className="notification-panel__action"
                onClick={() => dispatch(markAllNotificationsRead())}
                type="button"
              >
                Mark all read
              </button>
            )}
          </div>

          <p className="notification-panel__copy">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}.`
              : 'You are all caught up.'}
          </p>

          {notifications.length > 0 ? (
            <div className="notification-list">
              {notifications.map((item) => (
                <article
                  className={`notification-item${item.read ? '' : ' notification-item--unread'}`}
                  key={item.id}
                >
                  <div className="notification-item__header">
                    <span className="notification-item__category">{item.category}</span>
                    {!item.read && <span className="notification-item__status">New</span>}
                  </div>

                  <h3 className="notification-item__title">{item.title}</h3>
                  <p className="notification-item__message">{item.message}</p>

                  <div className="notification-item__footer">
                    {item.href && (
                      <Link
                        className="notification-item__link"
                        onClick={() => handleOpenLink(item.id)}
                        to={item.href}
                      >
                        {item.ctaLabel || 'Open'}
                      </Link>
                    )}

                    {!item.read && (
                      <button
                        className="notification-item__button"
                        onClick={() => handleMarkRead(item.id)}
                        type="button"
                      >
                        Mark read
                      </button>
                    )}

                    <button
                      className="notification-item__button"
                      onClick={() => handleDismiss(item.id)}
                      type="button"
                    >
                      Dismiss
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="notification-empty-state">
              <h3>Nothing pending</h3>
              <p>Fresh activity will appear here as you move through jobs, tests, and profile updates.</p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default NotificationPanel;
