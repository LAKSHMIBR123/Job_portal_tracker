import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import StatusMessage from '../components/StatusMessage';
import { fetchJobs } from '../features/jobSlice';

function getJobStatus(job) {
  const candidates = [job?.status, job?.applicationStatus, job?.stage];

  const status = candidates.find(
    (value) => typeof value === 'string' && value.trim() !== ''
  );

  return status ? status.trim().toLowerCase() : '';
}

function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { jobs, loading, error } = useSelector((state) => state.jobs);

  useEffect(() => {
    dispatch(fetchJobs({}));
  }, [dispatch]);

  const allJobs = Array.isArray(jobs) ? jobs : [];
  const totalJobs = allJobs.length;
  const interviewCount = allJobs.filter((job) =>
    getJobStatus(job).includes('interview')
  ).length;
  const applicantName = user?.name?.trim() || 'there';

  return (
    <section className="dashboard-page">
      <div className="dashboard-shell">
        <section className="dashboard-hero">
          <div className="dashboard-hero__copy">
            <p className="auth-kicker dashboard-hero__kicker">Dashboard</p>
            <h1 className="dashboard-title">Welcome back, {applicantName}</h1>
            <p className="dashboard-copy">
              Track your job activity in one place and keep an eye on how many roles
              are available and how many have reached the interview stage.
            </p>
          </div>

          <div className="dashboard-hero__status">
            <span className="dashboard-hero__status-label">Jobs sync</span>
            <strong>{loading ? 'Refreshing...' : 'Up to date'}</strong>
          </div>
        </section>

        <StatusMessage
          message={error}
          title="Couldn't load dashboard data"
          variant="error"
        />

        {loading && totalJobs === 0 && !error ? (
          <Loader
            description="We are syncing your latest jobs and interview activity."
            label="Loading dashboard..."
          />
        ) : (
          <section className="dashboard-stats" aria-label="Dashboard statistics">
            <article className="dashboard-stat-card">
              <span className="dashboard-stat-card__label">Total jobs</span>
              <strong className="dashboard-stat-card__value">{totalJobs}</strong>
              <p className="dashboard-stat-card__text">
                All jobs currently loaded from your jobs feed.
              </p>
            </article>

            <article className="dashboard-stat-card">
              <span className="dashboard-stat-card__label">Interview count</span>
              <strong className="dashboard-stat-card__value">{interviewCount}</strong>
              <p className="dashboard-stat-card__text">
                Roles whose status is marked as interview or interview stage.
              </p>
            </article>
          </section>
        )}

        <section className="dashboard-summary">
          <div className="dashboard-summary__card">
            <p className="dashboard-summary__eyebrow">Quick summary</p>
            <h2 className="dashboard-summary__title">Your pipeline at a glance</h2>
            <p className="dashboard-summary__text">
              {totalJobs > 0
                ? `You currently have ${totalJobs} job listings in view, and ${interviewCount} of them are in the interview stage.`
                : 'No jobs are loaded yet. Visit the jobs page to explore available opportunities.'}
            </p>
          </div>

          <div className="dashboard-summary__actions">
            <Link className="top-nav__link top-nav__link--primary" to="/jobs">
              View jobs
            </Link>
            <Link className="top-nav__link" to="/profile">
              Update profile
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}

export default Dashboard;
