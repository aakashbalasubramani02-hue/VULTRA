# VULTRA — Personalised Vulnerability Decision Intelligence

> **Turn public cyber vulnerability data into five actions a small organisation can understand and defend.**

---

## 1. Executive Summary & Challenge Problem

Small organisations are overwhelmed by public vulnerability disclosures. Traditional CVSS dashboards sort vulnerabilities strictly by generic technical severity, generating hundreds of "Critical" false alarms on technologies the organisation does not even use.

**VULTRA** transforms public cyber threat signals into **five defensible actions** tailored to an organisation's specific technology stack, asset exposures, and business service criticalities.

### Core Challenge Questions Answered:
1. **What should this organisation pay attention to?** → An organisation-specific Top 5 decision list.
2. **Why is it relevant to this organisation?** → Direct mapping to deployed assets, perimeter reachability, active threat signals (CISA KEV, FIRST EPSS), and service criticality.
3. **What should the organisation do next?** → Conservative, safe defensive guidance.

---

## 2. End-to-End Decision Architecture

```
┌────────────────────────────────────────────────────────┐
│               Organisation Profile Context             │
│   (Technologies, Versions, Exposure, Business Service) │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│          Canonical Normalisation & Matcher             │
│     (Alias Registry, Exact & Substring Resolution)     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Candidate Filtering & Classification         │
│   ├── MATCH (Affected version confirmed)               │
│   ├── NEEDS_VERIFICATION (Version unconstrained)       │
│   ├── NOT_AFFECTED (Version outside boundary)          │
│   └── EXCLUDE (Product not in organisation inventory)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│      Deterministic 5-Signal Scoring Engine (0-100 pts) │
│   ├── CISA KEV Exploitation (35%)                      │
│   ├── FIRST EPSS Probability (25%)                     │
│   ├── CVSS Technical Base Score (15%)                  │
│   ├── Asset Exposure: Internet vs Internal (15%)       │
│   └── Service Criticality Weight (10%)                 │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Official Top 5 Decisions (Locked)            │
│       (Rank, Priority, Score Factors, Provenance)      │
└─────────────┬────────────────────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐┌───────────────────────────┐
│     FastAPI Backend       ││    Optional Local AI      │
│   REST Endpoints (/api)   ││ (Ollama Instruct Model)   │
└─────────────┬─────────────┘└─────────────┬─────────────┘
              │                            │
              ▼                            ▼
┌───────────────────────────┐┌───────────────────────────┐
│   React Decision Center   ││   Source-Bound Fact Guard │
│  (Tailwind + Motion + UI) ││  (Deterministic Auditing) │
└───────────────────────────┘└───────────────────────────┘
```

---

## 3. Technology Stack

* **Core Intelligence Engine**: Python 3.10+, Dataclasses, Deterministic Multi-Factor Scoring
* **Backend API**: FastAPI, Uvicorn, Pydantic v2
* **Frontend Web Application**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React
* **Local AI Explanation Layer**: Ollama (`codellama:7b-instruct`, `llama3.2`, `mistral`, `deepseek-r1:8b`)
* **Verification & Testing**: Pytest, HTTPX TestClient

---

## 4. Quick Start & Installation

### Prerequisites
* Python 3.10 or higher
* Node.js 18 or higher & npm
* *(Optional)* Ollama for local AI copilot explanations

---

### Step 1: Clone & Setup Backend

```bash
# Navigate to project root
cd vulnerability-triage

# Install Python backend dependencies
pip install -r requirements.txt

# Start FastAPI backend (Port 8001)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8001 --reload
```

* API Root: `http://127.0.0.1:8001`
* Interactive OpenAPI Swagger Docs: `http://127.0.0.1:8001/docs`
* Health Check: `http://127.0.0.1:8001/api/health`

---

### Step 2: Setup & Start Frontend

Open a second terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```

* Frontend Command Center: `http://127.0.0.1:5173`

---

### Step 3: (Optional) Local AI Copilot with Ollama

VULTRA includes an optional source-bound AI explanation assistant that runs 100% locally and offline:

```bash
# Start Ollama service (if not already running)
ollama serve

# Pull preferred local model (e.g. CodeLlama or Llama3)
ollama pull codellama:7b-instruct
```

> **Note**: If Ollama is offline or unavailable, VULTRA automatically uses its validated deterministic explanation system without any error banners or degradation.

---

### 1-Click Startup (Windows & Linux)

* **Windows**: Double-click `start_vultra.bat`
* **Linux / macOS**: Run `./start_vultra.sh`

---

## 5. API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and API version |
| `GET` | `/api/profiles` | List all available organisation profiles |
| `GET` | `/api/profiles/{id}` | Detailed asset inventory and risk appetite for an organisation |
| `GET` | `/api/triage/{id}?limit=5` | Personalised Top 5 vulnerability decisions with point breakdowns |
| `GET` | `/api/evidence/{id}/{cve}` | Full forensic evidence, raw source facts, and NVD advisory link |
| `GET` | `/api/why-not/{id}` | Negative test analysis demonstrating *Severity ≠ Priority* |
| `GET` | `/api/compare/{a}/{b}` | Cross-organisation comparison and divergence driver analysis |
| `POST` | `/api/what-if/{id}` | Interactive weight modifier simulation |
| `POST` | `/api/ai/explain/{id}/{cve}` | Source-bound AI Copilot explanation with Fact Guard audit |

---

## 6. Official Golden Demo Walkthrough

### Demo Profiles
* **Profile A (`ORG-001`)**: **Global Retail Bank** (Financial Services, Low Risk Appetite, 6 Technologies)
* **Profile B (`ORG-002`)**: **Agile Cloud Tech Startup** (Technology SaaS, High Risk Appetite, 5 Technologies)

---

### Actual Engine Outputs (Verified & Deterministic)

#### Profile A: Global Retail Bank (`ORG-001`) Top 5
1. **`CVE-2023-1262`** | Score: **91.9 / 100** | **URGENT** | Identity Provider SaaS (`internet-facing`, `critical`)
2. **`CVE-2024-1699`** | Score: **87.0 / 100** | **URGENT** | Identity Provider SaaS (`internet-facing`, `critical`)
3. **`CVE-2023-8330`** | Score: **81.8 / 100** | **URGENT** | Core Banking Framework (`internal`, `critical`)
4. **`CVE-2026-1698`** | Score: **80.3 / 100** | **URGENT** | Identity Provider SaaS (`internet-facing`, `critical`)
5. **`CVE-2025-1728`** | Score: **78.5 / 100** | **URGENT** | Core Banking Framework (`internal`, `critical`)

#### Profile B: Agile Cloud Tech Startup (`ORG-002`) Top 5
1. **`CVE-2023-9945`** | Score: **94.7 / 100** | **URGENT** | Web Application Firewall (`internet-facing`, `critical`)
2. **`CVE-2026-1769`** | Score: **90.7 / 100** | **URGENT** | Web Application Firewall (`internet-facing`, `critical`)
3. **`CVE-2026-2707`** | Score: **83.5 / 100** | **URGENT** | Web Application Firewall (`internet-facing`, `critical`)
4. **`CVE-2026-7873`** | Score: **81.8 / 100** | **URGENT** | Web Application Firewall (`internet-facing`, `critical`)
5. **`CVE-2026-6801`** | Score: **81.5 / 100** | **URGENT** | Web Application Firewall (`internet-facing`, `critical`)

**Divergence Result**: **0% overlap** between the two organisations demonstrating genuine asset-specific prioritisation.

---

### Mandatory Negative Test ("Severity ≠ Priority")
* **Vulnerability**: `CVE-2024-1851`
* **CVSS Base Score**: **10.0 (Maximum Technical Severity)**
* **Product**: `E-Commerce Cart`
* **Target Profile**: `ORG-001` (Global Retail Bank)
* **Decision**: **`EXCLUDE`** (`PRODUCT_NOT_USED`)
* **Key Insight**: Generic CVSS dashboards create false panic by flagging this as a Critical emergency. VULTRA excludes it because the bank does not operate an E-Commerce Cart.

---

### Version Uncertainty Handling
* **Vulnerability**: `CVE-2023-1262`
* **Inventory State**: Installed version is unconstrained in profile.
* **Match Outcome**: **`NEEDS_VERIFICATION`** (Flagged with warning badge rather than unsafely discarded).

---

## 7. Hackathon Challenge Feature Matrix

| Challenge Requirement | VULTRA Feature | Verification Status |
| :--- | :--- | :--- |
| **Personalisation** | Profile-driven matching & 5-signal contextual formula | Verified (0% overlap across distinct profiles) |
| **Explainability** | Decision Trace Modal ("Why is this #1?") + Point Breakdown | Verified (Score factor shares sum to 100%) |
| **Provenance** | Forensic Evidence Drawer with NVD reference URLs | Verified (Immutable source linkage) |
| **Negative Test** | "Why Not?" screen highlighting *Severity ≠ Priority* | Verified (CVSS 10.0 excluded for non-used assets) |
| **Version Handling** | Explicit `NEEDS_VERIFICATION` classification | Verified (No false safety claims) |
| **Usability** | Enterprise Command Center + 60-Second Briefing Mode | Verified (Fast executive scanning for non-specialists) |
| **Local AI Layer** | Source-Bound Copilot with Deterministic Fact Guard | Verified (Ollama offline fallback tested) |

---

## 8. Core Design Principles

1. **"Severity is one signal — not the decision."** A vulnerability with CVSS 10.0 on software you do not run is irrelevant; a CVSS 7.5 on an actively weaponised authentication gateway on your internet perimeter is urgent.
2. **"AI explains decisions; it does not make them."** The deterministic scoring engine retains 100% authority over rankings. Local LLMs translate evidence into plain English.
3. **"Unknown is not safe."** Unconstrained versions are surfaced as `NEEDS_VERIFICATION` rather than discarded.
4. **"Zero external dependency."** Bundled snapshot data and offline capabilities guarantee reliable defense in isolated environments.

---

## 9. Automated Testing & Verification

Run the full automated test suite (52 tests across matching, scoring, ranking, provenance, API, and AI Fact Guard):

```bash
# Run backend pytest suite
python -m pytest

# Run API smoke test script
python tests/smoke_test.py

# Run frontend production build
cd frontend && npm run build
```

---

## 10. Project Structure

```
vulnerability-triage/
├── backend/                  # FastAPI backend application
│   ├── routes/               # API endpoint routers
│   ├── schemas/              # Pydantic v2 request/response models
│   ├── services/             # Triage, Fact Guard, and AI services
│   └── main.py               # FastAPI application entry point
├── frontend/                 # React 18 + TypeScript web client
│   ├── src/
│   │   ├── api/              # HTTP API client
│   │   ├── components/       # UI components (Cards, Drawers, Modals, Badges)
│   │   ├── views/            # Main application views
│   │   └── types/            # TypeScript interfaces
│   └── package.json
├── src/                      # Core Phase 1 deterministic decision engine
│   ├── models.py             # Domain dataclasses & enums
│   ├── matcher.py            # Technology & version matching engine
│   ├── normalizer.py         # Canonical text normalisation
│   ├── scorer.py             # Multi-signal scoring engine
│   ├── ranker.py             # Deterministic ranking pipeline
│   ├── explainer.py          # Plain-language justification generator
│   └── provenance.py         # Evidence tracking
├── data/                     # Offline snapshot datasets
│   ├── vulnerabilities.csv   # 540 vulnerability records
│   ├── profiles.json         # Organisation profile definitions
│   └── gold_set.csv          # Practitioner evaluation benchmark
├── tests/                    # 52 automated regression and API tests
├── start_vultra.bat          # 1-click Windows startup script
├── start_vultra.sh           # 1-click Linux/macOS startup script
├── requirements.txt          # Python runtime dependencies
└── README.md                 # Complete documentation
```

---

## 11. Known Limitations & Future Roadmap

* **Snapshot Scope**: Current prototype operates on a curated 540-record vulnerability snapshot.
* **Future Extension**: Integration of real-time local SBOM (Software Bill of Materials) ingestion for automated inventory synchronisation.
* **Future Extension**: Active network telemetry ingest for continuous perimeter exposure updates.
