const { PrismaClient } = require("@prisma/client");

// Initialize Prisma Client
const prisma = new PrismaClient({});

// Helper to convert "Abstract Read" -> "AbstractRead" for Prisma Enum compatibility
const formatEnum = (str) => str.replace(/\s+/g, "");

const addPaper = async (paperData) => {
  // Format enum fields: "Results Analyzed" -> "ResultsAnalyzed"
  const data = {
    ...paperData,
    domain: formatEnum(paperData.domain),
    readingStage: formatEnum(paperData.readingStage),
    impactScore: formatEnum(paperData.impactScore),
  };
  return await prisma.paper.create({ data });
};

const fetchPapers = async (queryParams) => {
  const { domain, readingStage, impactScore, dateAdded } = queryParams;
  const where = {};

  if (domain) {
    where.domain = { in: domain.split(",").map(formatEnum) };
  }

  if (readingStage) {
    where.readingStage = { in: readingStage.split(",").map(formatEnum) };
  }

  if (impactScore) {
    where.impactScore = { in: impactScore.split(",").map(formatEnum) };
  }

  if (dateAdded && dateAdded !== "All time") {
    const now = new Date();
    let fromDate;

    switch (dateAdded) {
      case "This Week":
        fromDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case "This Month":
        fromDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case "Last 3 Months":
        fromDate = new Date(now.setDate(now.getDate() - 90));
        break;
    }

    if (fromDate) {
      where.dateAdded = { gte: fromDate };
    }
  }

  return await prisma.paper.findMany({
    where,
    orderBy: { dateAdded: "desc" },
  });
};

const fetchAnalytics = async () => {
  // 1. Funnel Chart Data: Paper count at each Reading Stage
  const funnelRaw = await prisma.paper.groupBy({
    by: ["readingStage"],
    _count: { _all: true },
  });
  const funnelData = funnelRaw.map((item) => ({
    stage: item.readingStage, // Will be returned as 'AbstractRead', etc.
    count: item._count._all,
  }));

  // 2. Scatter Plot Data: Fetch raw points for Citations vs. Impact Score
  const scatterData = await prisma.paper.findMany({
    select: {
      id: true,
      title: true,
      citationCount: true,
      impactScore: true,
    },
  });

  // 3. Stacked Bar Chart Data: Papers by Domain and Reading Stage
  const stackedBarData = await prisma.paper.groupBy({
    by: ["domain", "readingStage"],
    _count: { _all: true },
  });

  // 4. Summary Statistics
  const avgCitationsRaw = await prisma.paper.groupBy({
    by: ["domain"],
    _avg: { citationCount: true },
  });
  const averageCitationsPerDomain = avgCitationsRaw.map((item) => ({
    domain: item.domain,
    average: Math.round(item._avg.citationCount || 0),
  }));

  const totalPapers = await prisma.paper.count();
  const fullyReadPapers = await prisma.paper.count({
    where: { readingStage: "FullyRead" },
  });
  const completionRate =
    totalPapers > 0 ? ((fullyReadPapers / totalPapers) * 100).toFixed(1) : 0;

  return {
    funnelData,
    scatterData,
    stackedBarData,
    summary: {
      totalPapers,
      completionRate: `${completionRate}%`,
      averageCitationsPerDomain,
    },
  };
};

module.exports = {
  addPaper,
  fetchPapers,
  fetchAnalytics,
};
