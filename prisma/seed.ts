import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding demo data...");

  // Clear existing demo user (cascades to all related data)
  await prisma.user.deleteMany({ where: { email: "demo@dossier.local" } });

  // ─── User ────────────────────────────────────────────────────────────────────

  const user = await prisma.user.create({
    data: {
      email: "demo@dossier.local",
      name: "Alex Mercer",
    },
  });

  // ─── Tags ────────────────────────────────────────────────────────────────────

  const tagRegulatory = await prisma.tag.upsert({
    where: { name: "regulatory" },
    update: {},
    create: { name: "regulatory" },
  });

  const tagFinancial = await prisma.tag.upsert({
    where: { name: "financial" },
    update: {},
    create: { name: "financial" },
  });

  const tagManufacturing = await prisma.tag.upsert({
    where: { name: "manufacturing" },
    update: {},
    create: { name: "manufacturing" },
  });

  // ─── Dossier ─────────────────────────────────────────────────────────────────

  const dossier = await prisma.dossier.create({
    data: {
      owner_id: user.id,
      title: "Northgate Pharma — FDA Warning Letter Investigation",
      slug: "northgate-pharma-fda-warning",
      summary:
        "Investigation into systemic manufacturing violations at Northgate Pharma's Raleigh facility and the company's regulatory exposure following a 2024 FDA warning letter.",
      status: "active",
      research_goal:
        "Determine whether manufacturing violations are systemic, establish a timeline of internal knowledge, and assess total litigation and remediation exposure.",
      priority: 1,
    },
  });

  // ─── Sources ─────────────────────────────────────────────────────────────────

  const sourceFdaLetter = await prisma.source.create({
    data: {
      dossier_id: dossier.id,
      type: "pdf",
      title: "FDA Warning Letter — Northgate Pharma (WL-2024-0108)",
      author: "U.S. Food and Drug Administration",
      publisher: "FDA",
      published_at: new Date("2024-01-08"),
      raw_text: `Dear Mr. Harrington,

During our inspection of Northgate Pharmaceutical Inc., 4200 Research Triangle Pkwy, Raleigh, NC, conducted October 16–November 2, 2023, our investigator(s) identified significant violations of Current Good Manufacturing Practice (CGMP) regulations for finished pharmaceuticals, Title 21, Code of Federal Regulations, Parts 210 and 211.

Specifically, we found:

1. Your firm failed to establish adequate written procedures for production and process controls (21 CFR 211.100(a)). Batch records for Lot Nos. NGP-2023-0441 through NGP-2023-0489 lacked required in-process testing documentation.

2. Your firm failed to maintain equipment in a clean and orderly manner and in good repair (21 CFR 211.67(a)). Sterile filling Line 3 exhibited visible particulate contamination residue from prior production runs. No documented cleaning verification was performed between October 4–12, 2023.

3. Your firm failed to exercise appropriate controls over computer or related systems to assure that only authorized personnel institute changes in master production records (21 CFR 211.68(b)). Audit log analysis revealed 47 instances of data backdating between March 2022 and September 2023.

We acknowledge receipt of your response dated November 30, 2023. After reviewing your response, we conclude it does not adequately address our concerns. Failure to promptly correct these violations may result in legal action without further notice, including, without limitation, seizure and injunction.`,
      summary:
        "FDA identifies three CGMP violations: inadequate batch documentation, equipment contamination, and 47 instances of audit log backdating over 18 months.",
      credibility_rating: 5,
      source_status: "reviewed",
      tags: {
        create: [
          { tag_id: tagRegulatory.id },
          { tag_id: tagManufacturing.id },
        ],
      },
    },
  });

  const sourceReuters = await prisma.source.create({
    data: {
      dossier_id: dossier.id,
      type: "web_link",
      title:
        "Northgate Pharma shares drop 18% after FDA warning letter disclosed",
      url: "https://example.com/reuters-northgate-fda-2024",
      author: "Priya Chandrasekaran",
      publisher: "Reuters",
      published_at: new Date("2024-01-11"),
      raw_text: `Shares of Northgate Pharmaceutical Inc. fell as much as 18% on Thursday after the company disclosed it had received an FDA warning letter citing data integrity failures and manufacturing control deficiencies at its Raleigh, North Carolina facility.

The warning letter, dated January 8, 2024, is the company's second regulatory action in four years. In 2020, Northgate received a Form 483 observation letter citing similar documentation gaps at the same facility, raising questions about whether management took adequate corrective action.

"This is not a first offense situation," said Elena Vasquez, a pharmaceutical regulatory consultant at Meridian Advisory Group. "The 2020 observations were a clear warning. If Northgate's board was paying attention, they knew the risk."

Northgate's Chief Scientific Officer, Dr. Sandra Wei, issued a statement saying the company "respectfully disagrees with several characterizations in the letter" and has initiated a comprehensive remediation program with an outside consultant.

Analysts at Morgan Stanley estimated the financial impact at between $40M and $120M depending on whether the FDA proceeds to a consent decree. The company's Raleigh facility accounts for approximately 34% of total revenue.`,
      summary:
        "Reuters coverage of the FDA warning letter disclosure. Notes prior 2020 Form 483 at same facility, analyst estimates of $40M-$120M exposure, and CSO Dr. Sandra Wei's public response.",
      credibility_rating: 4,
      source_status: "reviewed",
      tags: {
        create: [{ tag_id: tagFinancial.id }, { tag_id: tagRegulatory.id }],
      },
    },
  });

  const sourceMemo = await prisma.source.create({
    data: {
      dossier_id: dossier.id,
      type: "internal_memo",
      title: "Internal QA Escalation Memo — Raleigh Facility (June 2022)",
      author: "Raymond Chu, VP Quality Assurance",
      published_at: new Date("2022-06-14"),
      raw_text: `TO: Sandra Wei, CSO; David Harrington, CEO
FROM: Raymond Chu, VP Quality Assurance
DATE: June 14, 2022
RE: Escalation — Line 3 Sterile Fill Data Integrity Concerns

I am escalating a matter that Quality has flagged internally since Q1 2022 and that has not received adequate resolution.

Our internal audit in May 2022 identified a pattern of retroactive entries in the LIMS system for Sterile Fill Line 3. Specifically, 12 batch records between January and April 2022 show timestamp anomalies consistent with post-hoc data entry rather than contemporaneous recording. This is a potential 21 CFR 211.68(b) violation.

I raised this with the site Quality Director on March 18, 2022. No corrective action plan has been issued. Given the pattern and the timeline, I believe the company faces material regulatory risk if this is not addressed before the next FDA inspection cycle.

I am formally requesting executive sign-off on a CAPA within 30 days.

Raymond Chu`,
      summary:
        "Internal QA memo from June 2022 documenting data integrity concerns on Line 3 escalated to CSO and CEO. Chu notes the issue was first raised in March 2022 with no corrective action taken.",
      credibility_rating: 5,
      source_status: "reviewed",
      tags: {
        create: [
          { tag_id: tagManufacturing.id },
          { tag_id: tagRegulatory.id },
        ],
      },
    },
  });

  const sourceExpertInterview = await prisma.source.create({
    data: {
      dossier_id: dossier.id,
      type: "pasted_text",
      title: "Expert Interview — Dr. Marcus Obi, Former FDA Investigator",
      author: "Dr. Marcus Obi",
      published_at: new Date("2024-02-15"),
      raw_text: `Q: How serious are audit log backdating findings in FDA warning letters?

A: They're among the most serious findings we can make. Audit trail manipulation goes to the fundamental integrity of the GMP data system. It's not a paperwork error — it's a data integrity failure. The agency has been exceptionally aggressive on this since 2016.

Q: Forty-seven instances over 18 months — does that suggest a systemic problem or isolated incidents?

A: Forty-seven instances is not rogue behavior by a single employee. That pattern, sustained over 18 months, tells me there was either a cultural tolerance for this or it was tacitly encouraged. Either way, that's a management failure, not a QA failure.

Q: What's the risk of a consent decree here?

A: If the company had a prior 483 at the same site and documentation gaps weren't fully remediated, the probability of a consent decree is high. I'd put it above 50%. The financial range analysts are quoting — $40M to $120M — honestly, consent decrees for facilities this size can run higher if they include facility remediation requirements. I would not anchor to that lower number.`,
      summary:
        "Interview with former FDA investigator Dr. Marcus Obi. Characterizes the backdating pattern as a management failure, not isolated misconduct. Consent decree probability assessed at above 50%. Skeptical of analyst $40M floor.",
      credibility_rating: 4,
      source_status: "reviewing",
    },
  });

  // ─── Highlights ───────────────────────────────────────────────────────────────

  const hl1 = await prisma.highlight.create({
    data: {
      source_id: sourceFdaLetter.id,
      quote_text:
        "Audit log analysis revealed 47 instances of data backdating between March 2022 and September 2023.",
      start_offset: 1402,
      end_offset: 1483,
      label: "stat",
      annotation: "Core finding — 18-month window of systematic backdating.",
    },
  });

  const hl2 = await prisma.highlight.create({
    data: {
      source_id: sourceFdaLetter.id,
      quote_text:
        "Sterile filling Line 3 exhibited visible particulate contamination residue from prior production runs. No documented cleaning verification was performed between October 4–12, 2023.",
      start_offset: 1021,
      end_offset: 1183,
      label: "evidence",
      annotation: "Physical contamination distinct from data integrity issue.",
    },
  });

  const hl3 = await prisma.highlight.create({
    data: {
      source_id: sourceReuters.id,
      quote_text:
        "In 2020, Northgate received a Form 483 observation letter citing similar documentation gaps at the same facility, raising questions about whether management took adequate corrective action.",
      start_offset: 371,
      end_offset: 546,
      label: "evidence",
      annotation: "Prior notice — company was on record as knowing the risk.",
    },
  });

  const hl4 = await prisma.highlight.create({
    data: {
      source_id: sourceMemo.id,
      quote_text:
        "I raised this with the site Quality Director on March 18, 2022. No corrective action plan has been issued.",
      start_offset: 621,
      end_offset: 724,
      label: "evidence",
      annotation:
        "Internal escalation with no follow-through. March 2022 is 21 months before FDA inspection.",
    },
  });

  const hl5 = await prisma.highlight.create({
    data: {
      source_id: sourceMemo.id,
      quote_text:
        "I am formally requesting executive sign-off on a CAPA within 30 days.",
      start_offset: 810,
      end_offset: 876,
      label: "quote",
      annotation:
        "Chu put leadership on notice in writing. Key document for knowledge timeline.",
    },
  });

  const hl6 = await prisma.highlight.create({
    data: {
      source_id: sourceExpertInterview.id,
      quote_text:
        "Forty-seven instances is not rogue behavior by a single employee. That pattern, sustained over 18 months, tells me there was either a cultural tolerance for this or it was tacitly encouraged.",
      start_offset: 482,
      end_offset: 663,
      label: "quote",
      annotation:
        "Expert opinion framing this as a management/culture failure, not individual misconduct.",
    },
  });

  const hl7 = await prisma.highlight.create({
    data: {
      source_id: sourceExpertInterview.id,
      quote_text:
        "I would not anchor to that lower number.",
      start_offset: 1201,
      end_offset: 1241,
      label: "counterpoint",
      annotation:
        "Expert explicitly pushes back on the $40M floor estimate used by analysts.",
    },
  });

  // ─── Claims ───────────────────────────────────────────────────────────────────

  const claimSystemic = await prisma.claim.create({
    data: {
      dossier_id: dossier.id,
      statement:
        "The manufacturing violations at Northgate's Raleigh facility were systemic, not isolated incidents.",
      confidence: 85,
      status: "supported",
      notes:
        "Supported by: 47 backdating instances over 18 months (FDA), expert characterization of a management/culture failure (Obi interview), and prior 2020 483 at same facility.",
      highlights: {
        create: [
          { highlight_id: hl1.id },
          { highlight_id: hl3.id },
          { highlight_id: hl6.id },
        ],
      },
      tags: { create: [{ tag_id: tagManufacturing.id }] },
    },
  });

  const claimKnowledge = await prisma.claim.create({
    data: {
      dossier_id: dossier.id,
      statement:
        "Northgate's executive leadership had documented internal knowledge of data integrity risks at least 21 months before the FDA inspection.",
      confidence: 90,
      status: "supported",
      notes:
        "The June 2022 internal QA memo addressed to the CSO and CEO establishes executive-level knowledge. The March 2022 escalation to the Quality Director is an additional prior notice.",
      highlights: {
        create: [{ highlight_id: hl4.id }, { highlight_id: hl5.id }],
      },
      tags: { create: [{ tag_id: tagRegulatory.id }] },
    },
  });

  const claimExposure = await prisma.claim.create({
    data: {
      dossier_id: dossier.id,
      statement:
        "Total financial exposure from this FDA action is unlikely to be contained within the $40M analyst floor estimate.",
      confidence: 65,
      status: "open",
      notes:
        "Expert opinion and prior consent decree data suggest the lower bound is too optimistic. Need to pull comparable consent decree financials for context.",
      highlights: {
        create: [{ highlight_id: hl7.id }],
      },
      tags: { create: [{ tag_id: tagFinancial.id }] },
    },
  });

  // ─── Entities ─────────────────────────────────────────────────────────────────

  const entityNorthgate = await prisma.entity.create({
    data: {
      dossier_id: dossier.id,
      name: "Northgate Pharmaceutical Inc.",
      type: "company",
      description:
        "Mid-size specialty pharmaceutical manufacturer headquartered in Raleigh, NC. Subject of the FDA warning letter and primary subject of this investigation.",
      aliases: ["Northgate Pharma", "NGP", "Northgate"],
      importance: 10,
      tags: {
        create: [
          { tag_id: tagRegulatory.id },
          { tag_id: tagManufacturing.id },
        ],
      },
    },
  });

  const entityWei = await prisma.entity.create({
    data: {
      dossier_id: dossier.id,
      name: "Dr. Sandra Wei",
      type: "person",
      description:
        "Chief Scientific Officer of Northgate Pharma. Named recipient of the June 2022 internal QA memo. Issued public statement disputing some FDA characterizations.",
      aliases: ["Wei", "S. Wei"],
      importance: 7,
    },
  });

  const entityChu = await prisma.entity.create({
    data: {
      dossier_id: dossier.id,
      name: "Raymond Chu",
      type: "person",
      description:
        "VP of Quality Assurance at Northgate Pharma. Author of the June 2022 escalation memo. Key witness to internal knowledge timeline.",
      aliases: ["Chu", "R. Chu"],
      importance: 8,
    },
  });

  // ─── Mentions ─────────────────────────────────────────────────────────────────

  await prisma.mention.create({
    data: {
      entity_id: entityNorthgate.id,
      source_id: sourceFdaLetter.id,
      highlight_id: hl1.id,
      context_snippet:
        "Northgate Pharmaceutical Inc. — primary subject of FDA Warning Letter WL-2024-0108.",
    },
  });

  await prisma.mention.create({
    data: {
      entity_id: entityWei.id,
      source_id: sourceMemo.id,
      highlight_id: hl5.id,
      context_snippet:
        "Dr. Sandra Wei named as memo recipient alongside CEO David Harrington.",
    },
  });

  await prisma.mention.create({
    data: {
      entity_id: entityChu.id,
      source_id: sourceMemo.id,
      highlight_id: hl4.id,
      context_snippet:
        "Raymond Chu authored the June 2022 escalation memo and signed the CAPA request.",
    },
  });

  await prisma.mention.create({
    data: {
      entity_id: entityNorthgate.id,
      source_id: sourceReuters.id,
      highlight_id: hl3.id,
      context_snippet:
        "Northgate shares fell 18% on FDA warning letter disclosure.",
    },
  });

  // ─── Events ───────────────────────────────────────────────────────────────────

  const eventInspection = await prisma.event.create({
    data: {
      dossier_id: dossier.id,
      title: "FDA CGMP Inspection — Raleigh Facility",
      description:
        "FDA investigators conducted an unannounced CGMP inspection of Northgate's Raleigh sterile fill facility, spanning 13 business days.",
      event_date: new Date("2023-10-16"),
      precision: "day",
      confidence: 5,
      claim_id: claimSystemic.id,
      highlights: { create: [{ highlight_id: hl2.id }] },
      entities: {
        create: [{ entity_id: entityNorthgate.id }],
      },
      tags: {
        create: [{ tag_id: tagRegulatory.id }],
      },
    },
  });

  const eventWarningLetter = await prisma.event.create({
    data: {
      dossier_id: dossier.id,
      title: "FDA Issues Warning Letter WL-2024-0108",
      description:
        "FDA formally issued warning letter citing three CGMP violations, including 47 instances of audit log backdating.",
      event_date: new Date("2024-01-08"),
      precision: "day",
      confidence: 5,
      claim_id: claimSystemic.id,
      highlights: { create: [{ highlight_id: hl1.id }] },
      entities: {
        create: [{ entity_id: entityNorthgate.id }],
      },
      tags: {
        create: [
          { tag_id: tagRegulatory.id },
          { tag_id: tagManufacturing.id },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      dossier_id: dossier.id,
      title: "Internal QA Escalation — Chu Memo to Wei and Harrington",
      description:
        "VP of QA Raymond Chu formally escalated data integrity concerns in writing to CSO Dr. Sandra Wei and CEO David Harrington, requesting a CAPA within 30 days.",
      event_date: new Date("2022-06-14"),
      precision: "day",
      confidence: 5,
      claim_id: claimKnowledge.id,
      highlights: {
        create: [{ highlight_id: hl4.id }, { highlight_id: hl5.id }],
      },
      entities: {
        create: [
          { entity_id: entityWei.id },
          { entity_id: entityChu.id },
        ],
      },
      tags: {
        create: [{ tag_id: tagManufacturing.id }],
      },
    },
  });

  // Suppress unused variable warnings — variables are kept for clarity
  void eventInspection;
  void eventWarningLetter;
  void claimExposure;

  // ─── Brief ────────────────────────────────────────────────────────────────────

  await prisma.brief.create({
    data: {
      dossier_id: dossier.id,
      title: "Northgate Pharma FDA Warning Letter — Research Summary",
      status: "draft",
      version: 1,
      body_markdown: `# Northgate Pharma — FDA Warning Letter Investigation

**Status:** Draft
**Prepared by:** Alex Mercer
**Last updated:** March 2024

---

## Summary of Findings

Northgate Pharmaceutical Inc. received FDA Warning Letter WL-2024-0108 on January 8, 2024, citing three CGMP violations at its Raleigh, NC sterile fill facility. The most significant finding — 47 instances of audit log backdating over 18 months — is not an isolated compliance lapse but evidence of a systemic data integrity failure.

Evidence suggests executive leadership was aware of data integrity risks at least 21 months before the FDA inspection, based on an internal QA escalation memo addressed directly to the CSO and CEO in June 2022.

---

## Key Claims

### 1. Violations Were Systemic (High Confidence — 85%)

The 47 backdating instances, sustained from March 2022 to September 2023, indicate organizational tolerance rather than isolated misconduct. Former FDA investigator Dr. Marcus Obi characterizes the pattern as a management failure. The company's prior Form 483 at the same facility in 2020 suggests the corrective action was inadequate.

**Supporting evidence:** FDA Warning Letter WL-2024-0108; Reuters (2024-01-11); Obi interview (2024-02-15)

### 2. Executive Knowledge Pre-Dated Inspection by 21+ Months (High Confidence — 90%)

A June 2022 internal QA memo from VP Raymond Chu to CSO Dr. Sandra Wei and CEO David Harrington explicitly names data integrity concerns on Sterile Fill Line 3 and requests a CAPA. An earlier escalation to the site Quality Director was made in March 2022 with no corrective action issued.

**Supporting evidence:** Internal QA escalation memo (2022-06-14)

### 3. Financial Exposure Likely Exceeds $40M Floor (Open — 65%)

Analyst estimates range from $40M to $120M. Dr. Obi advises against anchoring to the lower estimate given the data integrity findings, the prior 483, and the likelihood of a consent decree. **Further research needed:** comparable consent decree financials.

---

## Entities of Interest

| Entity | Role |
|---|---|
| Northgate Pharmaceutical Inc. | Subject of investigation |
| Dr. Sandra Wei | CSO; named recipient of June 2022 escalation memo |
| Raymond Chu | VP QA; author of escalation memo; key witness |

---

## Open Questions

- Was the 30-day CAPA requested in the June 2022 memo ever issued?
- What were the findings of the 2020 Form 483 and what corrective actions were documented?
- Has Raymond Chu retained separate legal counsel?

---

*This brief is a working document. Claims marked Open require additional source verification.*`,
    },
  });

  console.log(`Seed complete.`);
  console.log(`  User:      ${user.email}`);
  console.log(`  Dossier:   ${dossier.title}`);
  console.log(`  Sources:   4`);
  console.log(`  Highlights: 7`);
  console.log(`  Claims:    3`);
  console.log(`  Entities:  3`);
  console.log(`  Events:    3`);
  console.log(`  Brief:     1 (draft)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
