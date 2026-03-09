/**
 * Import Anniversary Giveaway Applications from CSV.
 * Run: node scripts/import-giveaway-applications.cjs
 *
 * Actions:
 * 1. Parse CSV (3 header rows), import 82 real applicants
 * 2. Calculate driveDayScore (0-100) for each applicant
 * 3. Upsert into giveawayApplications table (match on email)
 * 4. Update campaigns table: goalTarget=150, goalActual=actual count, actualSpend=1225, budget=1500
 */

require("dotenv").config();
const mysql = require("mysql2/promise");
const fs    = require("fs");
const path  = require("path");

const CSV_PATH = path.join(
  process.env.HOME,
  "Downloads",
  "GOLFVX AH _ Anniversary Applications 2026 - Long Form.csv"
);

// ─── Column indices (0-based) based on the 3-row header structure ─────────────
const COL = {
  timestamp:         0,
  name:              1,
  email:             2,
  phone:             3,
  ageRange:          4,
  gender:            5,
  city:              6,
  ilResident:        7,
  golfExp:           8,
  visitedBefore:     9,
  firstHeard:       10,
  firstVisitTiming: 11,
  indoorFreq:       12,
  whatStoodOut:     13,
  indoorFamiliarity:14,
  // Golf VX Interest (TRUE/FALSE checkboxes)
  intAccurate:      15,
  intMembership:    16,
  intAtmosphere:    17,
  intCoaching:      18,
  intSocial:        19,
  // Golf VX Purpose (TRUE/FALSE)
  purPractice:      20,
  purTournaments:   21,
  purFriends:       22,
  purMixAll:        23,
  // Stories
  passionStory:     24,
  communityStory:   25,
  // Social engagement
  socialActive:     26,
  wordOfMouth:      27,
  involvedGroups:   28,
  socialHandle:     29,
  groupsEngaged:    30,
  bestTimeToCall:   31,
  // How heard
  heardInstagram:   32,
  heardFacebook:    33,
  heardEmail:       34,
  heardInVenue:     35,
  heardReferral:    36,
  heardPBGA:        37,
  heardOther:       38,
  heardOtherText:   39,
  consent:          40,
};

// ─── Parse raw CSV line handling quotes ───────────────────────────────────────
function parseLine(line) {
  const fields = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      fields.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

function bool(val) {
  return String(val || "").trim().toUpperCase() === "TRUE";
}

// ─── driveDayScore: 0–100, measures likelihood to become paying GolfVX member ─
function calcDriveDayScore(v) {
  let score = 0;
  const reasons = [];

  // 1. Golf experience (0–25 pts)
  const exp = String(v[COL.golfExp] || "").trim().toLowerCase();
  if (exp.includes("intermediate")) { score += 25; reasons.push("Intermediate golfer (high fit)"); }
  else if (exp.includes("advanced"))   { score += 18; reasons.push("Advanced golfer"); }
  else if (exp.includes("beginner"))   { score += 20; reasons.push("Beginner (growth opportunity)"); }
  else if (exp.includes("new"))        { score += 10; reasons.push("New to golf"); }

  // 2. Prior visit engagement (0–20 pts)
  const visited = String(v[COL.visitedBefore] || "").trim().toLowerCase();
  if (visited.includes("existing"))    { score += 20; reasons.push("Existing visitor"); }
  else if (visited.includes("new"))    { score += 10; reasons.push("New to Golf VX"); }

  // 3. Indoor golf familiarity (0–15 pts)
  const fam = String(v[COL.indoorFamiliarity] || "").trim().toLowerCase();
  if (fam.includes("tried once") || fam.includes("tried one or two")) { score += 15; reasons.push("Tried indoor golf (sweet spot)"); }
  else if (fam.includes("play regularly"))                             { score += 10; reasons.push("Regular indoor player"); }
  else if (fam.includes("never"))                                      { score +=  8; reasons.push("New to indoor golf"); }

  // 4. Membership & coaching interest (0–15 pts)
  if (bool(v[COL.intMembership])) { score += 8; reasons.push("Interested in membership perks"); }
  if (bool(v[COL.intCoaching]))   { score += 5; reasons.push("Interested in coaching"); }
  if (bool(v[COL.purMixAll]))     { score += 2; reasons.push("Interested in full mix"); }

  // 5. Practice & competitive intent (0–10 pts)
  if (bool(v[COL.purPractice]))     { score += 5; reasons.push("Practice improvement focus"); }
  if (bool(v[COL.purTournaments]))  { score += 5; reasons.push("Tournament/league interest"); }

  // 6. Community & social engagement (0–10 pts)
  if (bool(v[COL.socialActive]))    { score += 3; reasons.push("Active on social media"); }
  if (bool(v[COL.wordOfMouth]))     { score += 4; reasons.push("Word-of-mouth potential"); }
  if (bool(v[COL.involvedGroups]))  { score += 3; reasons.push("Involved in groups"); }

  // 7. Attribution quality (0–5 pts)
  if (bool(v[COL.heardReferral]))   { score += 5; reasons.push("Friend/referral (highest quality)"); }
  else if (bool(v[COL.heardPBGA])) { score += 4; reasons.push("PBGA connection"); }
  else if (bool(v[COL.heardInVenue])) { score += 4; reasons.push("In-venue signage"); }

  return { score: Math.min(100, score), reasons };
}

// ─── Build notes JSON with all rich form data ────────────────────────────────
function buildNotes(v) {
  const interestMap = {
    accurateSimulators: bool(v[COL.intAccurate]),
    membershipPerks:    bool(v[COL.intMembership]),
    atmosphere:         bool(v[COL.intAtmosphere]),
    coaching:           bool(v[COL.intCoaching]),
    socialCommunity:    bool(v[COL.intSocial]),
  };
  const purposeMap = {
    practiceImprovement: bool(v[COL.purPractice]),
    tournamentsLeagues:  bool(v[COL.purTournaments]),
    friendsFamily:       bool(v[COL.purFriends]),
    mixOfAll:            bool(v[COL.purMixAll]),
  };
  const heardMap = {
    instagram:  bool(v[COL.heardInstagram]),
    facebook:   bool(v[COL.heardFacebook]),
    email:      bool(v[COL.heardEmail]),
    inVenue:    bool(v[COL.heardInVenue]),
    referral:   bool(v[COL.heardReferral]),
    pbga:       bool(v[COL.heardPBGA]),
    other:      v[COL.heardOtherText]?.trim() || null,
  };
  const socialConn = {
    activeOnSocial:   bool(v[COL.socialActive]),
    wordOfMouth:      bool(v[COL.wordOfMouth]),
    involvedInGroups: bool(v[COL.involvedGroups]),
    handle:           v[COL.socialHandle]?.trim() || null,
    groups:           v[COL.groupsEngaged]?.trim() || null,
  };
  const extra = {
    firstVisitTiming:    v[COL.firstVisitTiming]?.trim() || null,
    indoorGolfFrequency: v[COL.indoorFreq]?.trim() || null,
    whatStoodOut:        v[COL.whatStoodOut]?.trim() || null,
    passionStory:        v[COL.passionStory]?.trim() || null,
    communityStory:      v[COL.communityStory]?.trim() || null,
    firstHeardAbout:     v[COL.firstHeard]?.trim() || null,
    interests:           Object.entries(interestMap).filter(([, val]) => val).map(([k]) => k),
    purpose:             Object.entries(purposeMap).filter(([, val]) => val).map(([k]) => k),
    heardAbout:          Object.entries(heardMap).filter(([k, val]) => k !== "other" && val).map(([k]) => k),
    heardAboutOther:     heardMap.other,
    socialConnection:    socialConn,
    consentGiven:        bool(v[COL.consent]),
  };
  return JSON.stringify(extra);
}

// ─── Build howDidTheyHear text ────────────────────────────────────────────────
function buildHowHeard(v) {
  const channels = [];
  if (bool(v[COL.heardInstagram])) channels.push("Instagram");
  if (bool(v[COL.heardFacebook]))  channels.push("Facebook");
  if (bool(v[COL.heardEmail]))     channels.push("Email");
  if (bool(v[COL.heardInVenue]))   channels.push("In-Venue Signage");
  if (bool(v[COL.heardReferral])) channels.push("Friend/Referral");
  if (bool(v[COL.heardPBGA]))      channels.push("PBGA");
  const other = v[COL.heardOtherText]?.trim();
  if (other) channels.push(`Other: ${other}`);
  return channels.join(", ") || v[COL.firstHeard]?.trim() || null;
}

async function run() {
  const raw   = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = raw.split("\n").filter(l => l.trim());

  // Skip 3 header rows
  const dataRows = lines.slice(3);
  console.log(`CSV data rows: ${dataRows.length}`);

  // Parse into value arrays
  const records = dataRows
    .map(l => parseLine(l))
    .filter(v => v[COL.email]?.trim() && v[COL.email].includes("@")); // must have email

  console.log(`Valid email rows: ${records.length}`);

  const conn = await mysql.createConnection(process.env.DATABASE_URL);

  // Load existing records by email
  const [existing] = await conn.query(
    "SELECT id, email, name, driveDayScore FROM giveawayApplications WHERE isTestEntry = 0"
  );
  const byEmail = new Map(existing.map(r => [r.email.toLowerCase().trim(), r]));
  console.log(`Existing non-test applicants in DB: ${existing.length}`);

  let inserted = 0, updated = 0;
  const scoreReport = [];

  for (const v of records) {
    const email = v[COL.email].trim().toLowerCase();
    const name  = v[COL.name]?.trim() || "Unknown";
    const phone = (v[COL.phone] || "").replace(/[^\d+\-() ]/g, "").slice(0, 50) || null;
    const ts    = v[COL.timestamp]?.trim();

    const { score, reasons } = calcDriveDayScore(v);
    const notes = buildNotes(v);
    const howHeard = buildHowHeard(v);

    scoreReport.push({ name, email, score, reasons: reasons.join("; ") });

    const fields = {
      name,
      email,
      phone,
      submissionTimestamp: ts ? new Date(ts) : new Date(),
      ageRange:            v[COL.ageRange]?.trim()       || null,
      gender:              v[COL.gender]?.trim()         || null,
      city:                v[COL.city]?.trim()           || null,
      illinoisResident:    bool(v[COL.ilResident]),
      golfExperienceLevel: v[COL.golfExp]?.trim()        || null,
      visitedBefore:       v[COL.visitedBefore]?.trim()  || null,
      indoorGolfFamiliarity: v[COL.indoorFamiliarity]?.trim() || null,
      bestTimeToCall:      (v[COL.bestTimeToCall]?.trim() || "").slice(0, 100) || null,
      howDidTheyHear:      howHeard,
      driveDayScore:       score,
      notes,
    };

    const existingRow = byEmail.get(email);

    if (existingRow) {
      await conn.query(
        `UPDATE giveawayApplications SET
          name = ?, phone = ?,
          ageRange = ?, gender = ?, city = ?,
          illinoisResident = ?,
          golfExperienceLevel = ?, visitedBefore = ?, indoorGolfFamiliarity = ?,
          bestTimeToCall = ?, howDidTheyHear = ?,
          driveDayScore = ?, notes = ?,
          isTestEntry = 0,
          updatedAt = NOW()
        WHERE id = ?`,
        [
          fields.name, fields.phone,
          fields.ageRange, fields.gender, fields.city,
          fields.illinoisResident,
          fields.golfExperienceLevel, fields.visitedBefore, fields.indoorGolfFamiliarity,
          fields.bestTimeToCall, fields.howDidTheyHear,
          fields.driveDayScore, fields.notes,
          existingRow.id,
        ]
      );
      updated++;
    } else {
      await conn.query(
        `INSERT INTO giveawayApplications
          (name, email, phone, submissionTimestamp,
           ageRange, gender, city, illinoisResident,
           golfExperienceLevel, visitedBefore, indoorGolfFamiliarity,
           bestTimeToCall, howDidTheyHear,
           driveDayScore, notes,
           status, isTestEntry, lastSyncedAt, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, NOW(), NOW(), NOW())`,
        [
          fields.name, fields.email, fields.phone, fields.submissionTimestamp,
          fields.ageRange, fields.gender, fields.city, fields.illinoisResident,
          fields.golfExperienceLevel, fields.visitedBefore, fields.indoorGolfFamiliarity,
          fields.bestTimeToCall, fields.howDidTheyHear,
          fields.driveDayScore, fields.notes,
        ]
      );
      byEmail.set(email, { id: null }); // prevent double-insert
      inserted++;
    }
  }

  // ─── Get final real count (for campaigns.goalActual) ─────────────────────
  const [[{ realCount }]] = await conn.query(
    "SELECT COUNT(*) as realCount FROM giveawayApplications WHERE isTestEntry = 0"
  );

  // ─── Update campaigns table: goalTarget=150, goalActual=realCount, fix spend ─
  await conn.query(
    `UPDATE campaigns SET
      goalTarget = 150,
      goalActual = ?,
      targetApplications = 150,
      actualSpend = 1225.00,
      budget = 1500.00
    WHERE id = 5`,
    [realCount]
  );

  await conn.end();

  // ─── Print score breakdown ──────────────────────────────────────────────
  console.log(`\n=== Drive Day Score Breakdown ===`);
  const sorted = [...scoreReport].sort((a, b) => b.score - a.score);
  const high   = sorted.filter(r => r.score >= 80);
  const med    = sorted.filter(r => r.score >= 60 && r.score < 80);
  const low    = sorted.filter(r => r.score < 60);

  console.log(`High priority (80+): ${high.length}`);
  high.forEach(r => console.log(`  ${r.score}  ${r.name} (${r.email})`));
  console.log(`Medium priority (60-79): ${med.length}`);
  med.forEach(r => console.log(`  ${r.score}  ${r.name}`));
  console.log(`Lower priority (<60): ${low.length}`);

  console.log(`\n=== Summary ===`);
  console.log(`  Inserted:  ${inserted}`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Total real applicants in DB: ${realCount}`);
  console.log(`\n  Campaign updated:`);
  console.log(`    goalTarget: 250 → 150`);
  console.log(`    goalActual: 88 → ${realCount}`);
  console.log(`    actualSpend: $5,467.59 → $1,225.00`);
  console.log(`    budget:     $100.00 → $1,500.00`);
}

run().catch(err => { console.error(err); process.exit(1); });
