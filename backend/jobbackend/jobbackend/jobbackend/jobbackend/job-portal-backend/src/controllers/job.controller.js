const Job = require("../models/job.model");
const asyncHandler = require("../utils/asyncHandler");
const jobStatuses = ["Open", "Applied", "Interview Scheduled", "Offer", "Rejected", "Closed"];
const normalizedJobStatuses = new Map(
  jobStatuses.map((status) => [
    status.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim(),
    status,
  ])
);

const assignJobFields = (job, data) => {
  const fields = [
    "title",
    "company",
    "location",
    "salary",
    "description",
    "status",
    "interviewDate",
    "notes",
  ];

  fields.forEach((field) => {
    if (data[field] !== undefined) {
      job[field] = data[field];
    }
  });
};

const formatJobResponse = (job) => ({
  _id: job._id,
  title: job.title,
  company: job.company,
  location: job.location,
  salary: job.salary,
  description: job.description,
  status: job.status,
  interviewDate: job.interviewDate,
  notes: job.notes,
  createdBy: job.createdBy,
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasQueryValue = (value) =>
  value !== undefined &&
  value !== null &&
  (typeof value !== "string" || value.trim().length > 0);
const getTrimmedQueryValue = (value) =>
  typeof value === "string" ? value.trim() : value;
const normalizeJobStatus = (value) =>
  value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

const buildJobFilters = (query) => {
  const filters = {};
  const { search, company, location, status, minSalary, maxSalary } = query;

  if (hasQueryValue(search)) {
    const safeSearch = escapeRegex(getTrimmedQueryValue(search));

    filters.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { company: { $regex: safeSearch, $options: "i" } },
      { location: { $regex: safeSearch, $options: "i" } },
      { description: { $regex: safeSearch, $options: "i" } },
      { notes: { $regex: safeSearch, $options: "i" } },
    ];
  }

  if (hasQueryValue(company)) {
    filters.company = {
      $regex: escapeRegex(getTrimmedQueryValue(company)),
      $options: "i",
    };
  }

  if (hasQueryValue(location)) {
    filters.location = {
      $regex: escapeRegex(getTrimmedQueryValue(location)),
      $options: "i",
    };
  }

  if (hasQueryValue(status)) {
    const normalizedStatus = normalizedJobStatuses.get(
      normalizeJobStatus(getTrimmedQueryValue(status))
    );

    if (!normalizedStatus) {
      const error = new Error("Invalid job status filter");
      error.statusCode = 400;
      throw error;
    }

    filters.status = normalizedStatus;
  }

  if (hasQueryValue(minSalary) || hasQueryValue(maxSalary)) {
    filters.salary = {};

    if (hasQueryValue(minSalary)) {
      const parsedMinSalary = Number(getTrimmedQueryValue(minSalary));

      if (Number.isNaN(parsedMinSalary)) {
        const error = new Error("minSalary must be a number");
        error.statusCode = 400;
        throw error;
      }

      filters.salary.$gte = parsedMinSalary;
    }

    if (hasQueryValue(maxSalary)) {
      const parsedMaxSalary = Number(getTrimmedQueryValue(maxSalary));

      if (Number.isNaN(parsedMaxSalary)) {
        const error = new Error("maxSalary must be a number");
        error.statusCode = 400;
        throw error;
      }

      filters.salary.$lte = parsedMaxSalary;
    }

    if (Object.keys(filters.salary).length === 0) {
      delete filters.salary;
    }
  }

  return filters;
};

const buildSortOptions = (query) => {
  const sortableFields = ["createdAt", "salary", "title", "company", "location", "status"];
  const sortBy = sortableFields.includes(query.sortBy) ? query.sortBy : "createdAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  return { [sortBy]: sortOrder };
};

const getJobs = asyncHandler(async (req, res) => {
  let filters;
  let sortOptions;

  try {
    filters = buildJobFilters(req.query);
    sortOptions = buildSortOptions(req.query);
  } catch (error) {
    res.status(error.statusCode || 400);
    throw error;
  }

  const jobs = await Job.find(filters)
    .sort(sortOptions)
    .populate("createdBy", "name email");

  res.json({
    success: true,
    message: "Jobs fetched successfully",
    data: {
      jobs,
      filters: {
        search: hasQueryValue(req.query.search) ? getTrimmedQueryValue(req.query.search) : null,
        company: hasQueryValue(req.query.company) ? getTrimmedQueryValue(req.query.company) : null,
        location: hasQueryValue(req.query.location) ? getTrimmedQueryValue(req.query.location) : null,
        status: hasQueryValue(req.query.status)
          ? normalizedJobStatuses.get(normalizeJobStatus(getTrimmedQueryValue(req.query.status))) || null
          : null,
        minSalary: hasQueryValue(req.query.minSalary) ? Number(getTrimmedQueryValue(req.query.minSalary)) : null,
        maxSalary: hasQueryValue(req.query.maxSalary) ? Number(getTrimmedQueryValue(req.query.maxSalary)) : null,
        sortBy: Object.keys(sortOptions)[0],
        sortOrder: Object.values(sortOptions)[0] === 1 ? "asc" : "desc",
      },
    },
  });
});

const createJob = asyncHandler(async (req, res) => {
  const job = new Job({ createdBy: req.user._id });
  assignJobFields(job, req.body);
  await job.save();

  res.status(201).json({
    success: true,
    message: "Job created successfully",
    data: {
      job: formatJobResponse(job),
    },
  });
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  assignJobFields(job, req.body);
  await job.save();

  res.json({
    success: true,
    message: "Job updated successfully",
    data: {
      job,
    },
  });
});

const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    res.status(404);
    throw new Error("Job not found");
  }

  await job.deleteOne();

  res.json({
    success: true,
    message: "Job deleted successfully",
  });
});

module.exports = {
  getJobs,
  createJob,
  updateJob,
  deleteJob,
};
