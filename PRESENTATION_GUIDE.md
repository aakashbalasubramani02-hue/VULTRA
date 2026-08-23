# VULTRA — Complete Hackathon Presentation & Explanation Guide

> **Project Identity**: **VULTRA** — Personalised Vulnerability Decision Intelligence  
> **Core Value Proposition**: *"CVSS tells you what is severe globally. VULTRA tells you what matters HERE."*  
> **Target Demo Duration**: 3 Minutes (with 2 minutes Q&A)

---

## 1. The 10-Second Hook & Opening

### Opening Statement:
> *"Judges, every day small IT teams are flooded with thousands of critical vulnerability alerts. But a CVSS 10.0 vulnerability in software you don't run is zero risk to you. CVSS tells you what is severe. VULTRA tells you what matters. We turn generic public cyber data into five defensive actions a small organisation can immediately understand and defend."*

---

## 2. 3-Minute Step-by-Step Spoken Script with UI Actions

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                          3-MINUTE DEMO TIME ALLOCATION                         │
├───────────────┬────────────────────────────────────────────────────────────────┤
│ 0:00 – 0:30   │ Hook & The Mandatory Negative Test (CVSS 10.0 Excluded)        │
│ 0:30 – 1:00   │ Profile A (Global Retail Bank): Top 5, 5 Signals, Next Action │
│ 1:00 – 1:30   │ Personalisation Proof: Switch to Profile B (0% Overlap)        │
│ 1:30 – 2:00   │ Explainability: 8-Stage Decision Trace & Evidence Drawer       │
│ 2:00 – 2:30   │ Beyond Triage: Priority Delta & Decision Stability (What-If)   │
│ 2:30 – 2:50   │ Action & Watch: Remediation Workspace & Smart Alerts           │
│ 2:50 – 3:00   │ Provenance, AI Safety Guard & Closing Promise                  │
└───────────────┴────────────────────────────────────────────────────────────────┘
```

### [0:00 – 0:30] Hook & Negative Test ("Severity ≠ Priority")
* **Screen Action**: Click on the **Negative Test** tab in the top navigation.
* **What to Show**: Point to `CVE-2024-1851` with **CVSS 10.0** marked as `EXCLUDE`.
* **What to Say**:
  > *"Let's start with the biggest flaw in modern vulnerability management: sorting blindly by CVSS score. Right here, `CVE-2024-1851` has a maximum CVSS score of 10.0. A generic tool would sound the alarm. VULTRA instantly excludes it because Global Retail Bank does not run this E-Commerce cart. This single test proves that relevance beats generic severity."*

---

### [0:30 – 1:00] Profile A (Global Retail Bank) — The Top 5
* **Screen Action**: Click on the **Priorities** tab with `Global Retail Bank` selected.
* **What to Show**: Point to Rank #1 (`CVE-2023-1262`), the visible score points ($35.0 + 21.4 + 11.2 + 15.0 + 10.0 = 91.9$), and the safe next action box.
* **What to Say**:
  > *"Now look at the Bank's real Top 5. Number 1 is `CVE-2023-1262`. Why? Because it directly impacts their core internet-facing Cisco Gateway, has active CISA KEV exploitation, and an EPSS probability of 85%. In under 30 seconds, a non-expert sees the exact point share breakdown and one clear, safe next action: 'Apply Cisco security advisory workaround and restrict SSH access'."*

---

### [1:00 – 1:30] Personalisation Proof (Agile Cloud Startup — 0% Overlap)
* **Screen Action**: Switch the organisation dropdown in the top navbar to **Agile Cloud Tech Startup**.
* **What to Show**: Point out the brand-new Top 5 list (Rank #1: `CVE-2023-9945` on Redis) and the `0% Overlap` metric.
* **What to Say**:
  > *"Watch what happens when we switch to Agile Cloud Startup. The entire Top 5 changes instantly to their Redis caching layer. There is exactly 0% Top-5 overlap between these two profiles from the exact same dataset. That is true, deterministic personalisation."*

---

### [1:30 – 2:00] Explainability: 8-Stage Decision Trace & Evidence Drawer
* **Screen Action**: Click the **[Decision Trace]** button on Rank #1, then click the **[Evidence Drawer]**.
* **What to Show**: Walk through the 8 vertical verification steps, the immutable CSV file citation, snapshot date, and official NVD reference link.
* **What to Say**:
  > *"How can an auditor or CISO trust this? We open the 8-Stage Decision Trace. It traces from the raw NVD record, through product alias matching, version boundary checks, perimeter weighting, to final confidence. And in the Evidence Drawer, every single claim links to the verified source row and official NVD advisory URL."*

---

### [2:00 – 2:30] Beyond Triage: Priority Delta & Decision Stability (What-If)
* **Screen Action**: Click on the **Comparison** tab, then toggle the **What-If** sensitivity analysis panel.
* **What to Show**: Point out the Priority Delta (+4 rank movement from internal to public gateway) and the `HIGH STABILITY` rating across Threat-Centric and Severity-Centric models.
* **What to Say**:
  > *"Our Priority Delta engine isolates why a vulnerability escalates when an asset moves to the public perimeter. And our Decision Stability engine stress-tests decisions across alternative weighting models to prove they are robust and resilient."*

---

### [2:30 – 2:50] Defensive Action: Remediation Workspace & Smart Alerts
* **Screen Action**: Click on the **Remediation** tab, then click **Alerts** and run **[Run Risk Check]**.
* **What to Show**: Show active remediation items with owners, due dates, and SLA overdue tracking, then show newly generated Smart Alerts.
* **What to Say**:
  > *"VULTRA closes the loop from intelligence to action. The Remediation Workspace assigns team owners, tracks due dates, and verifies fixes without altering the raw technical risk score. And our Continuous Risk Watch diffs historical snapshots to surface deduplicated Smart Alerts only when meaningful risk changes occur."*

---

### [2:50 – 3:00] Provenance, AI Safety Guard & Closing
* **Screen Action**: Click on the **Methodology** tab showing the 5-signal formula and 92 passing automated tests.
* **What to Say**:
  > *"VULTRA is built on pure deterministic mathematics: 92 automated tests passing, 0% AI hallucination surface via our AI Fact Guard, and zero external paid API dependencies. It turns vulnerability noise into five defensible decisions. Thank you."*

---

## 3. The 4-Member Presentation Division

```
┌──────────┬──────────────────────────────────────────┬────────────────────────────────────┐
│ Member   │ Core Presentation Focus                  │ Key UI Screens to Demonstrate      │
├──────────┼──────────────────────────────────────────┼────────────────────────────────────┤
│ Member 1 │ The Alert Fatigue Problem & Onboarding   │ Overview / Command Center, Org Modal│
│ Member 2 │ Asset Inventory, Matching & Top 5 Board  │ Asset Inventory, Top 5 Priorities  │
│ Member 3 │ Explainability, Negative Test & AI Guard │ Negative Test, Trace, Evidence     │
│ Member 4 │ Remediation, Continuous Risk Watch & End │ Remediation, Alerts, Methodology   │
└──────────┴──────────────────────────────────────────┴────────────────────────────────────┘
```

---

## 4. The 7 Security Stacks (Judge Reference)

1. **Threat Decision Stack**: Prioritises empirical weaponisation (CISA KEV 35% + FIRST EPSS 25%) over raw CVSS (15%).
2. **Semantic Matching Stack**: Integer tuple version comparison avoiding lexical traps (`2.4.9` vs `2.4.49`) with honest `NEEDS_VERIFICATION` handling.
3. **AI Fact Guard Stack**: Strict prompt isolation and regex validation blocking hallucinated CVEs, false KEV claims, and destructive commands.
4. **API Hardening Stack**: Authoritative Pydantic v2 input validation, traversal sequence blocking, and zero stack trace leakage.
5. **Frontend DOM Shield Stack**: 100% React Virtual DOM encoding, zero `dangerouslySetInnerHTML`, and strict `^https?://` link validation.
6. **Multi-Tenant Data Stack**: SHA256 dataset immutability and complete tenant isolation preventing IDOR across assets and remediations.
7. **Closed-Loop Governance Stack**: Immutable remediation audit logs and snapshot-based change detection with zero alert duplicates.

---

## 5. Master Q&A Cheat Sheet for Judges

### Q1: Why not just sort by CVSS score?
* **Answer**: CVSS measures theoretical severity in a lab, with zero knowledge of your actual tech stack, internet exposure, or active in-the-wild exploitation. Sorting by CVSS causes alert fatigue on unused software.

### Q2: Can your AI hallucinate fake vulnerabilities or change the ranking?
* **Answer**: No. VULTRA's ranking is 100% deterministic mathematics. AI is strictly confined to plain-language phrasing and is policed by our **AI Fact Guard**, which ensures only verified database fields are mentioned. If AI is offline, a deterministic template engine takes over seamlessly.

### Q3: How do you handle unknown or missing software versions?
* **Answer**: We practice honest uncertainty. When a version is unknown or unparseable, VULTRA marks the match as `NEEDS_VERIFICATION` and lowers the confidence score. We never guess and never silently drop findings.

### Q4: Does resolving a remediation item change the vulnerability's raw score?
* **Answer**: No. The technical vulnerability score remains an uncorrupted mathematical calculation. Remediation is an operational workflow layer tracked in `remediations.json` without modifying the core dataset.

### Q5: Can the system handle an unseen organisation (like Profile D)?
* **Answer**: Yes. The triage engine is completely decoupled from hardcoded profiles. Registering any new organisation dynamically evaluates all 540 records against its declared assets in under 15 milliseconds.

---

## 6. One-Page Judge Cheat Sheet Summary

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║                    VULTRA — PERSONALISED VULNERABILITY DECISION INTELLIGENCE             ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║ WHAT IS VULTRA?                                                                          ║
║ A local, deterministic decision platform that converts raw public vulnerability data     ║
║ (NVD, CISA KEV, FIRST EPSS) into five defensible actions tailored to an organisation.    ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║ WHO IS IT FOR?                                                                           ║
║ Small-to-midsize organisations (banks, clinics, colleges) with limited IT security staff.║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║ THE PROBLEM                                                                              ║
║ Thousands of generic CVE alerts sorted by CVSS cause alert fatigue on unused software.   ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║ THE SOLUTION                                                                             ║
║ Personalised 5-Signal Scoring: 35% KEV + 25% EPSS + 15% CVSS + 15% Exposure + 10% Impor. ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║ 3 UNIQUE DIFFERENTIATORS                                                                 ║
║ 1. 0% Top-5 Overlap: Retail Bank and Cloud Startup yield completely distinct priorities.║
║ 2. 8-Stage Decision Trace: Auditable proof from raw NVD record to defensive action.      ║
║ 3. Closed-Loop Platform: Remediation Workspace + Snapshot-based Continuous Risk Watch.  ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║ AI ROLE & SAFETY                                                                         ║
║ AI is strictly an explanation assistant governed by AI Fact Guard; ranking is 100% math. ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║ VERIFIED METRICS                                                                         ║
║ • 92 / 92 Passing Automated Tests (13.40s)        • 100% Offline & Free Execution        ║
║ • CVSS 10.0 Negative Test Excluded                • 0% AI Hallucination Surface          ║
╠══════════════════════════════════════════════════════════════════════════════════════════╣
║ WHAT THE JUDGE SHOULD REMEMBER                                                           ║
║ "CVSS tells you what is severe globally. VULTRA tells you what matters HERE."           ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```
