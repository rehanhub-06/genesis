# Genesis — AI App Generator Studio

Modern AI tools have made code generation increasingly accessible. However, one challenge remains largely unsolved: reliably translating high-level requirements into a consistent, implementation-ready application specification.

Genesis was built to address that problem. 

Rather than focusing on direct code generation, Genesis is a multi-stage AI pipeline that focuses on generating **reliable application specifications**—a foundational schema layer that can power future application generation platforms, development workflows, and AI-assisted software design systems. Built on **Next.js** and powered by the **Google Gemini API**, it converts natural language descriptions into structured JSON application schemas through a series of reasoning, validation, and self-healing recovery stages.

---

## Interface Tour

Here is a look at the Genesis Studio experience:

### 1. Dynamic Splash Screen
![Splash Screen](public/images/splash.png)

### 2. Architecture Synthesis & Pipeline Progress
![Synthesizing Architecture](public/images/processing.png)

### 3. Application Runtime & Studio Dashboard
![EcosystemConnect Studio Dashboard](public/images/dashboard.png)

---

## Generation Pipeline

Below is the workflow showing the multi-stage streaming process, the self-healing loops, and user interaction checkpoints:

```mermaid
graph TD
    A[User Input / Prompt] --> B(Stage 1: Intent Analysis)
    B --> C{Is Vague or Conflicting?}
    C -- Yes --> D[Render Inline Clarification Card]
    D --> |User Submits Answers| B
    C -- No --> E(Stage 2: Architecture Design)
    E --> F(Stage 3: Schema Generation)
    F --> G{Zod Validation Passes?}
    G -- No --> H[Stage 3.5: Targeted Zod Repair Agent]
    H --> |Max 2 Retries| F
    G -- Yes --> I(Stage 4: Validation Engine)
    I --> J{Validation Issues Found?}
    J -- Yes --> K[Stage 4.5: Auto-Repair Engine]
    K --> L[Generate Diff & Update Schema]
    J -- No --> M[Production Ready JSON, Live Preview, & Assumptions]
    L --> M
```

---

## Key Features

### 1. Mandatory Gemini API Key (User Provided) & Security Architecture
* To support user-provided credentials securely and protect server quota, **users must input their own Gemini API key** in the top navigation bar.
* **Security & Sandboxing Controls**:
  - **Zero Server Retention**: API keys are never stored, logged, or cached on the server. The key remains entirely within the client's local environment.
  - **Local Storage Isolation**: Keys are persisted locally in the user's browser using `localStorage`, meaning they never leave your device unless communicating with the generation APIs.
  - **Secure Cookie Transfer**: The key is synchronized to a browser cookie using strict security attributes (`SameSite=Strict`), protecting against Cross-Site Request Forgery (CSRF) and ensuring secure data transit.
  - **Strict API Rejection**: The server-side generation endpoints (`/api/generate`) strictly validate the presence of the key. If missing, a `400 Bad Request` is thrown immediately, bypassing the generation pipeline.

### 2. Structured Inline Clarification Workspace
* If a prompt is detected as highly vague or conflicting, Genesis displays a dedicated, high-contrast **Inline Clarification Card** directly above the main prompt input.
* The workspace embeds text areas for each clarification question, enabling users to enter their responses side-by-side with the original prompt and click **"Resubmit with Answers"** without any modal popups interrupting their workflow.

### 3. Human-Readable Error Modal & Recovery
* If any generation stage fails or the connection is lost, Genesis presents a polished, categorised pop-up modal showing exactly what went wrong.
* It dynamically extracts the actual failure message from the error log and offers clear resolution recommendations, coupled with a fully functional **"Retry Stage"** action to re-initialize execution immediately.

### 4. Fully Responsive Interface
* The entire Genesis Studio dashboard utilizes dynamic height layouts and responsive column wrapping classes (`grid-cols-1 lg:grid-cols-4`, `flex-col md:flex-row`).
* Accessible and usable on screens of any size, from desktop setups to mobile viewports, including horizontally scrollable navigation panels and reflowing telemetry charts.

### 5. Self-Healing Targeted Zod Repair Agent
* If the schema generated in Stage 3 fails Zod schema validations or is malformed JSON, a dedicated **Targeted Zod Repair Agent** takes only the error issues and the broken JSON payload to repair it.
* Features a built-in retry policy (up to 2 repair attempts) instead of restarting the entire pipeline from scratch, saving time, compute cycles, and API tokens.

### 6. Transparent AI Assumptions Auditing
* To bridge requirements gaps in brief prompts, the generation engine makes logical assumptions (e.g. default columns, page requirements) and documents them in the schema's `assumptions` array (`{ field, assumed, reason }`).
* Users can view these decisions at any time via the **Assumptions** button in the navbar. A glassmorphic popup displays what was assumed and why, ensuring that the AI's architecture design is transparent and auditable.

---

## Validation Engine & Auto-Repair

Genesis features a custom **Validation Engine** that performs deep, cross-layer semantic verification of the generated schema before it is mounted to the live preview. It runs 18 rules across 4 primary check categories:

1. **Role Enforcement (`MISSING_ROLE`)**: Verifies that every access permission role declared in page layouts or API configurations is explicitly defined in `auth.roles`.
2. **Component Mapping (`FIELD_MISMATCH`)**: Compares UI components (like Forms) with their corresponding API targets. It uses **Levenshtein Distance fuzzy-matching** to check that every form field maps to a valid column in the database, automatically suggesting corrections (e.g., matching `userEmail` to `user_email`).
3. **Table Integrity (`INVALID_TABLE_REF`)**: Inspects every API route to guarantee the referenced databases and tables exist within the schema.
4. **Endpoint Pruning (`ORPHAN_API`)**: Flags orphaned API routes that are never referenced by component actions, button forms, or data tables.

### The Auto-Repair workflow:
If any validations fail, Genesis redirects the schema into an **Auto-Repair Engine**. The engine performs corrections (e.g., adding missing roles to the authentication database, rewriting mismatched field names, or removing orphaned endpoints), generates a visual JSON structural diff, and renders a detailed repair log directly on the Studio Telemetry dashboard.

---

## Tech Stack

* **Framework**: Next.js (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS
* **Validation**: Zod (cross-layer schema verification)
* **LLM Engine**: Google GenAI SDK (`@google/genai`)

---

## Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### 2. Enter API Key in the UI
Start the application and paste your Gemini API Key in the **Gemini API Key (Required)** input box in the top-right corner of the navbar. This key is securely stored in your browser's local cache (`SameSite=Strict` cookie protection) and is required to run any prompt generations.

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start generating apps.

---

## Project Structure

```
├── app/                  # Next.js App Router (pages & API endpoints)
│   ├── api/              # SSE Streaming generator, metrics, and validation endpoints
│   ├── globals.css       # Global styles, animations, and custom scrollbars
│   └── page.tsx          # Genesis Studio home page layout
├── components/           # React Components
│   ├── runtime/          # AppRuntime layout preview renderer
│   └── ui/               # Prompt inputs, inline clarifications, metrics, and error dialogs
├── hooks/                # Custom React Hooks (SSE streams, prompt history)
├── lib/                  # Backend pipeline logic
│   ├── pipeline/         # Intent (S1), Design (S2), Schema (S3), and Repair (S3.5/S4) scripts
│   ├── validation/       # Custom validator schemas and recovery repair logic
│   └── metrics.ts        # Performance and token efficiency metrics tracker
└── types/                # TypeScript type definitions for application schemas
```

---

## License
This project is proprietary and for educational and utility development purposes.
