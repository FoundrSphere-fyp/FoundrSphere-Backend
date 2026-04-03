function joinParts(parts) {
  return parts.filter(Boolean).join("\n").trim();
}

function buildFounderEmbeddingText(profile) {
  if (!profile) return "";
  const p = profile;
  return joinParts([
    p.startupName && `Startup: ${p.startupName}`,
    p.description && `Description: ${p.description}`,
    Array.isArray(p.industries) && p.industries.length && `Industries: ${p.industries.join(", ")}`,
    p.stage && `Stage: ${p.stage}`,
    p.location && `Location: ${p.location}`,
    p.businessModel && `Business model: ${p.businessModel}`,
    p.fundingNeeded != null && p.fundingNeeded !== "" && `Funding needed: ${p.fundingNeeded}`,
    p.traction &&
      (p.traction.users != null || p.traction.revenue != null) &&
      `Traction: users ${p.traction.users ?? 0}, revenue ${p.traction.revenue ?? 0}`,
  ]);
}

function buildInvestorEmbeddingText(profile) {
  if (!profile) return "";
  const p = profile;
  return joinParts([
    p.firmName && `Firm: ${p.firmName}`,
    p.investorType && `Investor type: ${p.investorType}`,
    Array.isArray(p.preferredIndustries) &&
      p.preferredIndustries.length &&
      `Preferred industries: ${p.preferredIndustries.join(", ")}`,
    Array.isArray(p.preferredStages) &&
      p.preferredStages.length &&
      `Preferred stages: ${p.preferredStages.join(", ")}`,
    Array.isArray(p.locations) && p.locations.length && `Locations: ${p.locations.join(", ")}`,
    (p.checkSizeMin != null || p.checkSizeMax != null) &&
      `Check size: ${p.checkSizeMin ?? "?"} - ${p.checkSizeMax ?? "?"}`,
    p.investmentThesis && `Investment thesis: ${p.investmentThesis}`,
  ]);
}

function buildProjectEmbeddingText(project) {
  if (!project) return "";
  const p = project;
  return joinParts([
    p.title && `Title: ${p.title}`,
    p.description && `Description: ${p.description}`,
    Array.isArray(p.industries) && p.industries.length && `Industries: ${p.industries.join(", ")}`,
    p.stage && `Stage: ${p.stage}`,
    Array.isArray(p.tags) && p.tags.length && `Tags: ${p.tags.join(", ")}`,
    p.metrics &&
      `Metrics: users ${p.metrics.users ?? 0}, revenue ${p.metrics.revenue ?? 0}`,
  ]);
}

module.exports = {
  buildFounderEmbeddingText,
  buildInvestorEmbeddingText,
  buildProjectEmbeddingText,
};
