require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../db/connect");
const User = require("../models/User");
const FounderProfile = require("../models/FounderProfile");
const InvestorProfile = require("../models/InvestorProfile");
const { trySaveFounderEmbedding, trySaveInvestorEmbedding } = require("../services/persistEmbeddings");

const INDUSTRIES = [
  "FinTech",
  "HealthTech",
  "EdTech",
  "SaaS",
  "E-commerce",
  "AI/ML",
  "Cybersecurity",
  "AgriTech",
  "CleanTech",
  "Logistics",
  "PropTech",
  "BioTech",
];

const STAGES = ["Idea", "MVP", "Early Revenue", "Growth"];
const LOCATIONS = ["Karachi", "Lahore", "Islamabad", "Dubai", "London", "Berlin", "Singapore"];
const BUSINESS_MODELS = ["B2B", "B2C", "B2B2C", "Marketplace", "Subscription"];
const FOUNDER_ROLES = ["Technical", "Business", "Product", "Marketing", "Operations"];
const COMMITMENTS = ["Part-time", "Full-time", "Flexible"];
const INVESTOR_TYPES = ["Angel", "VC", "Micro VC", "Family Office", "Accelerator"];

const FIRST_NAMES = [
  "Ali", "Ayesha", "Usman", "Sara", "Hassan", "Fatima", "Bilal", "Zainab", "Hamza", "Noor",
  "Omar", "Mariam", "Ahmed", "Hira", "Saad", "Iqra", "Daniyal", "Mahnoor", "Rayyan", "Anaya",
];
const LAST_NAMES = ["Khan", "Malik", "Sheikh", "Raza", "Qureshi", "Ahmed", "Siddiqui", "Mirza", "Javed", "Nawaz"];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOne(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function pickMany(arr, min = 1, max = 3) {
  const count = randInt(min, max);
  const copy = [...arr];
  const picked = [];
  while (copy.length && picked.length < count) {
    const idx = randInt(0, copy.length - 1);
    picked.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return picked;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {
    founders: 20,
    investors: 20,
    password: "Test@12345",
    prefix: "seed",
    withEmbeddings: true,
    cleanPrevious: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--founders") out.founders = Number(args[i + 1]);
    if (arg === "--investors") out.investors = Number(args[i + 1]);
    if (arg === "--password") out.password = String(args[i + 1] || out.password);
    if (arg === "--prefix") out.prefix = String(args[i + 1] || out.prefix);
    if (arg === "--with-embeddings") out.withEmbeddings = true;
    if (arg === "--no-embeddings") out.withEmbeddings = false;
    if (arg === "--clean") out.cleanPrevious = true;
  }

  out.founders = Number.isFinite(out.founders) && out.founders > 0 ? Math.floor(out.founders) : 20;
  out.investors = Number.isFinite(out.investors) && out.investors > 0 ? Math.floor(out.investors) : 20;
  return out;
}

function makeName() {
  return `${pickOne(FIRST_NAMES)} ${pickOne(LAST_NAMES)}`;
}

function makeFounderProfile(i) {
  const industries = pickMany(INDUSTRIES, 1, 3);
  const startupDomain = industries[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
  const stage = pickOne(STAGES);
  const founderRole = pickOne(FOUNDER_ROLES);
  const commitmentLevel = pickOne(COMMITMENTS);
  const desiredRoles = pickMany(FOUNDER_ROLES.filter((r) => r !== founderRole), 1, 2);

  return {
    startupName: `${startupDomain.toUpperCase()} Venture ${i + 1}`,
    description: `Building a ${industries.join("/")} startup focused on strong user growth and scalable revenue.`,
    industries,
    stage,
    fundingNeeded: randInt(20000, 400000),
    location: pickOne(LOCATIONS),
    businessModel: pickOne(BUSINESS_MODELS),
    founderRole,
    commitmentLevel,
    desiredCofounderRoles: desiredRoles,
    desiredCommitmentLevel: pickOne(COMMITMENTS),
    cofounderPreferenceText: `Looking for ${desiredRoles.join(", ")} cofounder with execution mindset and startup speed.`,
    traction: {
      users: randInt(100, 25000),
      revenue: randInt(0, 50000),
    },
  };
}

function makeInvestorProfile() {
  const preferredIndustries = pickMany(INDUSTRIES, 2, 4);
  const minCheck = randInt(10000, 120000);
  const maxCheck = minCheck + randInt(100000, 700000);

  return {
    firmName: `${pickOne(["Peak", "North", "Blue", "Nova", "Crescent", "Orbit"])} Capital`,
    investorType: pickOne(INVESTOR_TYPES),
    preferredIndustries,
    preferredStages: pickMany(STAGES, 1, 3),
    checkSizeMin: minCheck,
    checkSizeMax: maxCheck,
    locations: pickMany(LOCATIONS, 1, 3),
    investmentThesis: `We back ${preferredIndustries.join(", ")} founders with clear distribution and defensible product edges.`,
  };
}

async function cleanExistingByPrefix(prefix) {
  const regex = new RegExp(`^${prefix}\\.(founder|investor)\\.`, "i");
  const users = await User.find({ username: regex }).select("_id").lean();
  const userIds = users.map((u) => u._id);

  if (!userIds.length) return { users: 0, founders: 0, investors: 0 };

  const [fRes, iRes, uRes] = await Promise.all([
    FounderProfile.deleteMany({ userId: { $in: userIds } }),
    InvestorProfile.deleteMany({ userId: { $in: userIds } }),
    User.deleteMany({ _id: { $in: userIds } }),
  ]);

  return {
    users: uRes.deletedCount || 0,
    founders: fRes.deletedCount || 0,
    investors: iRes.deletedCount || 0,
  };
}

async function seed() {
  const opts = parseArgs();
  const runId = Date.now();

  console.log(`[seed] EMBEDDING_PROVIDER=${process.env.EMBEDDING_PROVIDER || "azure"}`);
  console.log(`[seed] embeddings enabled=${opts.withEmbeddings}`);

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing in backend/.env");
  }

  await connectDB(process.env.MONGO_URI);

  if (opts.cleanPrevious) {
    const deleted = await cleanExistingByPrefix(opts.prefix);
    console.log(`[seed] cleaned users=${deleted.users}, founders=${deleted.founders}, investors=${deleted.investors}`);
  }

  const passwordHash = await bcrypt.hash(opts.password, 10);

  const created = {
    founders: 0,
    investors: 0,
  };

  for (let i = 0; i < opts.founders; i += 1) {
    const fullName = makeName();
    const username = `${opts.prefix}.founder.${runId}.${i + 1}`;
    const email = `${opts.prefix}.founder.${runId}.${i + 1}@test.local`;

    const user = await User.create({
      username,
      email,
      password: passwordHash,
      fullName,
      bio: "Auto-seeded founder account for testing",
      userType: "founder",
      isProfileComplete: true,
    });

    await FounderProfile.create({
      userId: user._id,
      ...makeFounderProfile(i),
    });

    if (opts.withEmbeddings) {
      await trySaveFounderEmbedding(user._id);
    }

    created.founders += 1;
  }

  for (let i = 0; i < opts.investors; i += 1) {
    const fullName = makeName();
    const username = `${opts.prefix}.investor.${runId}.${i + 1}`;
    const email = `${opts.prefix}.investor.${runId}.${i + 1}@test.local`;

    const user = await User.create({
      username,
      email,
      password: passwordHash,
      fullName,
      bio: "Auto-seeded investor account for testing",
      userType: "investor",
      isProfileComplete: true,
    });

    await InvestorProfile.create({
      userId: user._id,
      ...makeInvestorProfile(),
    });

    if (opts.withEmbeddings) {
      await trySaveInvestorEmbedding(user._id);
    }

    created.investors += 1;
  }

  console.log(`[seed] done founders=${created.founders}, investors=${created.investors}`);
  console.log(`[seed] login password for all seeded users: ${opts.password}`);
}

seed()
  .catch((err) => {
    console.error("[seed] failed:", err?.message || err);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.connection.close();
    } catch (_err) {
      // no-op
    }
  });
