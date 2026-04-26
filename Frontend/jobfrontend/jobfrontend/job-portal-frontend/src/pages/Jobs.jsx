import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/Loader';
import StatusMessage from '../components/StatusMessage';
import { fetchJobs, applyJobAsync, toggleJobSaved } from '../features/jobSlice';
import ApplicationTestModal from '../components/ApplicationTestModal';

const initialFilters = {
  search: '',
  company: '',
  location: '',
  status: '',
  minSalary: '',
  maxSalary: '',
};

function getDisplayText(value, fallback = '') {
  if (typeof value === 'string') {
    return value.trim() || fallback;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (Array.isArray(value)) {
    const joined = value
      .map((item) => getDisplayText(item))
      .filter(Boolean)
      .join(', ');

    return joined || fallback;
  }

  if (value && typeof value === 'object') {
    const commonText =
      value.name ??
      value.title ??
      value.label ??
      value.city ??
      value.location ??
      value.address ??
      value.company ??
      value.companyName;

    if (typeof commonText === 'string' && commonText.trim()) {
      return commonText.trim();
    }
  }

  return fallback;
}

function normalizeJob(job, index) {
  if (!job || typeof job !== 'object') {
    return null;
  }

  const company = getDisplayText(
    job.company ?? job.companyName ?? job.employer,
    'Company'
  );
  const title = getDisplayText(job.title ?? job.jobTitle ?? job.position, 'Open role');
  const location = getDisplayText(
    job.location ?? job.city ?? job.address,
    'Location flexible'
  );
  const salary = getDisplayText(
    job.salary ?? job.salaryRange ?? job.compensation,
    '$Negotiable'
  );
  const posted = getDisplayText(
    job.posted ?? job.postedAt ?? job.createdAt ?? job.datePosted,
    'Recently posted'
  );
  const status = getDisplayText(job.status ?? job.applicationStatus ?? job.stage, '');
  const type = getDisplayText(
    job.type ?? job.jobType ?? job.employmentType,
    'Full-time'
  );
  const level = getDisplayText(
    job.level ?? job.experienceLevel ?? job.seniority ?? job.experience,
    'Mid'
  );
  const workMode = getDisplayText(
    job.workMode ?? job.mode ?? job.workType,
    'Remote'
  );
  const summary = getDisplayText(
    job.summary ?? job.description ?? job.shortDescription,
    'Explore this opportunity and review the full role details.'
  );

  return {
    id: job._id ?? job.id ?? `${company}-${title}-${index}`,
    company,
    title,
    location,
    salary,
    posted,
    status,
    type,
    level,
    workMode,
    summary,
    saved: Boolean(job.saved),
  };
}

function getInitials(value = '') {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'JB'
  );
}

function normalizeSalaryValue(value) {
  const raw = String(value ?? '').trim();

  if (!raw) {
    return null;
  }

  const normalized = raw.toLowerCase().replace(/[,₹]/g, '');
  const lpaMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(lpa|lakh|lakhs|lac|lacs)/i);

  if (lpaMatch) {
    const lpaValue = Number(lpaMatch[1]);
    return Number.isNaN(lpaValue) ? null : lpaValue * 100000;
  }

  const match = normalized.match(/(\d+(?:\.\d+)?)\s*([kK])?/);

  if (!match) {
    return null;
  }

  const amount = Number(match[1]);

  if (Number.isNaN(amount)) {
    return null;
  }

  return match[2] ? amount * 1000 : amount;
}

function normalizeLpaToAnnualValue(value) {
  const normalized = String(value ?? '').trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed * 100000;
}

function sanitizeFilters(filters) {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [key, String(value).trim()])
  );
}

function Jobs() {
  const dispatch = useDispatch();
  const { jobs, loading, error } = useSelector((state) => state.jobs);
  const user = useSelector((state) => state.auth.user);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [applicationNotice, setApplicationNotice] = useState('');
  const [applicationError, setApplicationError] = useState('');
  const [applyingJob, setApplyingJob] = useState(null);

  useEffect(() => {
    dispatch(fetchJobs({}));
  }, [dispatch]);

  const fetchedJobs = (Array.isArray(jobs) ? jobs : []).map(normalizeJob).filter(Boolean);
  const sourceJobs = fetchedJobs;

  const visibleJobs = sourceJobs.filter((job) => {
    const searchValue = appliedFilters.search.trim().toLowerCase();
    const companyValue = appliedFilters.company.trim().toLowerCase();
    const locationValue = appliedFilters.location.trim().toLowerCase();
    const statusValue = appliedFilters.status.trim().toLowerCase();
    const minSalaryValue = normalizeLpaToAnnualValue(appliedFilters.minSalary);
    const maxSalaryValue = normalizeLpaToAnnualValue(appliedFilters.maxSalary);
    const effectiveMinSalary =
      minSalaryValue !== null && maxSalaryValue !== null
        ? Math.min(minSalaryValue, maxSalaryValue)
        : minSalaryValue;
    const effectiveMaxSalary =
      minSalaryValue !== null && maxSalaryValue !== null
        ? Math.max(minSalaryValue, maxSalaryValue)
        : maxSalaryValue;
    const jobSalary = normalizeSalaryValue(job.salary);
    const haystack = (
      `${job.title} ${job.company} ${job.location} ${job.summary} ` +
      `${job.type} ${job.level} ${job.workMode} ${job.status}`
    ).toLowerCase();

    const matchesSearch = !searchValue || haystack.includes(searchValue);
    const matchesCompany =
      !companyValue || job.company.toLowerCase().includes(companyValue);
    const matchesLocation =
      !locationValue || job.location.toLowerCase().includes(locationValue);
    const statusText = String(job.status || '').toLowerCase();
    const matchesStatus =
      !statusValue ||
      (statusValue === 'saved' ? job.saved : statusText.includes(statusValue));
    const matchesMinSalary =
      effectiveMinSalary === null ||
      jobSalary === null ||
      jobSalary >= effectiveMinSalary;
    const matchesMaxSalary =
      effectiveMaxSalary === null ||
      jobSalary === null ||
      jobSalary <= effectiveMaxSalary;

    return (
      matchesSearch &&
      matchesCompany &&
      matchesLocation &&
      matchesStatus &&
      matchesMinSalary &&
      matchesMaxSalary
    );
  });

  const updateFilter = (field) => (event) => {
    setFilters((currentFilters) => ({
      ...currentFilters,
      [field]: event.target.value,
    }));

    if (applicationNotice) {
      setApplicationNotice('');
    }
    if (applicationError) {
      setApplicationError('');
    }
  };

  const runSearch = () => {
    const sanitizedFilters = sanitizeFilters(filters);
    setAppliedFilters(sanitizedFilters);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const sanitizedFilters = sanitizeFilters(filters);
    const quickFilters = {
      ...sanitizedFilters,
      company: '',
      status: '',
      minSalary: '',
      maxSalary: '',
    };

    // Top search bar is treated as quick search by role/location only.
    setFilters(quickFilters);
    setAppliedFilters(quickFilters);
  };

  const handleApply = (job) => {
    if (!job.id || job.status.toLowerCase() === 'applied') {
      return;
    }
    setApplyingJob(job);
  };

  const handleSaveToggle = (job) => {
    if (!job?.id) {
      return;
    }

    dispatch(toggleJobSaved(job.id));
  };

  const handleTestSuccess = async (job) => {
    setApplyingJob(null);
    setApplicationError('');
    setApplicationNotice('');

    try {
      // 1) Actually apply via the backend API
      const resultAction = await dispatch(applyJobAsync(job.id));

      if (applyJobAsync.fulfilled.match(resultAction)) {
        const responseData = resultAction.payload;
        // Professional UI messages for application submission
        if (responseData.data?.emailSent) {
          setApplicationNotice(
            'Application submitted successfully. A confirmation email has been sent to your email address.'
          );
        } else {
          setApplicationNotice(
            'Application submitted successfully, but we could not send a confirmation email. Please check your email address or contact support.'
          );
        }
      } else {
        const errorMsg = resultAction.payload || 'Failed to submit application to the server.';
        setApplicationError(errorMsg);
      }
    } catch (err) {
      console.error('Application submission failed:', err);
      setApplicationError('An unexpected error occurred while applying.');
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setApplicationNotice('');
    setApplicationError('');
  };

  return (
    <section className="jobs-page">
      <div className="jobs-shell">
        <section className="jobs-hero">
          <div className="jobs-hero__copy">
            <p className="auth-kicker jobs-hero__kicker">Discover roles</p>
            <h1 className="jobs-hero__title">Find your next standout opportunity</h1>
            <p className="jobs-hero__text">
              Search across curated roles, narrow the list with filters, and scan
              openings quickly from one clean workspace.
            </p>
          </div>

          <div className="jobs-hero__stat">
            <span className="jobs-hero__stat-label">Open listings</span>
            <strong>{sourceJobs.length}</strong>
          </div>

          <form className="jobs-search" onSubmit={handleSearchSubmit}>
            <label className="jobs-search__field">
              <span>Search jobs</span>
              <input
                className="jobs-search__input"
                value={filters.search}
                onChange={updateFilter('search')}
                placeholder="Frontend Developer"
              />
            </label>

            <label className="jobs-search__field">
              <span>Location</span>
              <input
                className="jobs-search__input"
                value={filters.location}
                onChange={updateFilter('location')}
                placeholder="Bengaluru or Remote"
              />
            </label>

            <button className="jobs-search__button" type="submit">
              Search
            </button>
          </form>
        </section>

        <section className="jobs-layout">
          <aside className="jobs-filters">
            <div className="jobs-filters__header">
              <div>
                <p className="jobs-filters__eyebrow">Filters</p>
                <h2 className="jobs-filters__title">Refine results</h2>
              </div>

              <button
                className="jobs-filters__clear"
                type="button"
                onClick={clearFilters}
              >
                Clear all
              </button>
            </div>

            <div className="jobs-filter-group">
              <h3>Company</h3>
              <div className="jobs-filter-fields">
                <input
                  className="jobs-search__input"
                  value={filters.company}
                  onChange={updateFilter('company')}
                  placeholder="Amazon"
                />
              </div>
            </div>

            <div className="jobs-filter-group">
              <h3>Status</h3>
              <div className="jobs-filter-fields">
                <select
                  className="jobs-search__input"
                  value={filters.status}
                  onChange={updateFilter('status')}
                >
                  <option value="">All</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interview</option>
                  <option value="saved">Saved</option>
                </select>
              </div>
            </div>

            <div className="jobs-filter-group">
              <h3>Salary range</h3>
              <div className="jobs-filter-salary">
                <input
                  className="jobs-search__input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={filters.minSalary}
                  onChange={updateFilter('minSalary')}
                  placeholder="Min LPA"
                />
                <input
                  className="jobs-search__input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={filters.maxSalary}
                  onChange={updateFilter('maxSalary')}
                  placeholder="Max LPA"
                />
              </div>
            </div>

            <div className="jobs-filter-group jobs-filter-group--summary">
              <h3>Current search</h3>
              <div className="jobs-filter-summary">
                <span>{appliedFilters.search || 'Any role'}</span>
                <span>{appliedFilters.company || 'Any company'}</span>
                <span>{appliedFilters.location || 'Any location'}</span>
                <span>{appliedFilters.status || 'Any status'}</span>
              </div>
            </div>

            <button
              className="auth-button jobs-filters__action"
              type="button"
              onClick={runSearch}
            >
              Search jobs
            </button>
          </aside>

          <div className="jobs-results">
            <div className="jobs-results__header">
              <div>
                <p className="jobs-results__eyebrow">Recommended jobs</p>
                <h2 className="jobs-results__title">
                  {visibleJobs.length} role{visibleJobs.length === 1 ? '' : 's'} found
                </h2>
              </div>
              <p className="jobs-results__copy">
                Browse cards below and use the search area above to tighten the list.
              </p>
            </div>

            <StatusMessage
              message={applicationNotice}
              title="Application sent"
              variant="success"
            />
            <StatusMessage
              message={error}
              title="Couldn't load jobs"
              variant="error"
            />
            <StatusMessage
              message={applicationError}
              title="Email notification"
              variant="error"
            />

            {loading ? (
              <Loader
                description="We are preparing the latest roles for you."
                label="Loading jobs..."
              />
            ) : visibleJobs.length === 0 ? (
              <div className="jobs-empty-state">
                <h3>No jobs match those filters</h3>
                <p>Try clearing a few filters or searching with broader keywords.</p>
              </div>
            ) : (
              <div className="jobs-grid">
                {visibleJobs.map((job) => (
                  <article key={job.id} className="job-card">
                    <div className="job-card__top">
                      <div className="job-card__brand">
                        <div className="job-card__avatar" aria-hidden="true">
                          {getInitials(job.company)}
                        </div>
                        <div>
                          <p className="job-card__company">{job.company}</p>
                          <p className="job-card__posted">{job.posted}</p>
                        </div>
                      </div>

                      <button
                        className="job-card__save"
                        type="button"
                        onClick={() => handleSaveToggle(job)}
                      >
                        {job.saved ? 'Saved' : 'Save'}
                      </button>
                    </div>

                    <h3 className="job-card__title">{job.title}</h3>

                    <div className="job-card__tags">
                      <span className="job-card__tag">{job.type}</span>
                      <span className="job-card__tag">{job.level}</span>
                      <span className="job-card__tag">{job.workMode}</span>
                      {job.status && (
                        <span className="job-card__tag job-card__tag--status">
                          {job.status}
                        </span>
                      )}
                    </div>

                    <p className="job-card__summary">{job.summary}</p>

                    <div className="job-card__footer">
                      <div>
                        <strong className="job-card__salary">{job.salary}</strong>
                        <p className="job-card__location">{job.location}</p>
                      </div>

                      <button
                        className="job-card__apply"
                        type="button"
                        onClick={() => handleApply(job)}
                        disabled={job.status.toLowerCase() === 'applied'}
                      >
                        {job.status.toLowerCase() === 'applied' ? 'Applied' : 'Apply now'}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
      {applyingJob && (
        <ApplicationTestModal
          job={applyingJob}
          onClose={() => setApplyingJob(null)}
          onSuccess={handleTestSuccess}
        />
      )}
    </section>
  );
}

export default Jobs;
