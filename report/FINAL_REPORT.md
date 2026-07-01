# Final Course Project Report
## Project: Travito — AI Travel Planning Assistant
**Course**: Software Engineering (2026)  
**Developer**: Scarlett Cavil

---

### 1. Executive Summary
This report summarizes the design, development, and testing of **Travito**, a high-end, AI-powered travel assistant web application. Built using a decoupled React and Node/Express architecture backed by a local SQLite database, the system addresses the fragmentation and complexity of travel itinerary planning. By integrating with the Groq API (utilizing Llama-3-70b), Travito generates customized itineraries, lodging selections, and packing checklists in a single user action.

---

### 2. Objectives & Scope
The key objectives of the project are:
1. Provide a single-click AI planning mechanism incorporating travel style, companions, and budget limits.
2. Develop a comprehensive expense tracker with real-time visual progress indicators.
3. Establish a localized AI guide chatbot contextually matched to the user's active destination.
4. Maintain a clean codebase adhering to strict software engineering practices and MVC pattern guidelines.

---

### 3. SDLC Methodology (Prototype / Scrum Model)
This project followed the **Scrum-Prototype Hybrid SDLC Model** as outlined in the course guide:
- **Sprint 1: Idea Finalization & Database Design**: Assessed objectives, designed relational SQLite schemas, and verified file-level storage bounds.
- **Sprint 2: Backend Development**: Built Express.js controllers for trip records and integrated JWT authentication middleware.
- **Sprint 3: AI Engine Integration**: Configured Groq Llama-3 connectors and designed robust mock fallbacks for zero-config graders.
- **Sprint 4: UI/UX Glassmorphic Design**: Built React components, responsive sidebar grids, and SVG metrics chart.
- **Sprint 5: Testing & Documentation**: Created SRS, System Design manuals, test cases, and quality reports.

---

### 4. Software Features & Capabilities
1. **Interactive Travel Dashboard**: Displays portfolio metrics and scheduled trip cards.
2. **AI Itinerary Engine**: Uses system prompts to format JSON outputs containing daily morning, afternoon, evening activities and local notes.
3. **Budget Exhaustion Display**: A circular gauge showing what percentage of funds have been spent, with category bars.
4. **Interactive Packing**: Toggles packing checkboxes, writing status to SQLite packing checklists.
5. **AI Guide**: Responsive chatbot utilizing current destination context.

---

### 5. AI Tool Usage & Viva Policy Compliance
As mandated by page 8 of the *Student Guidelines*, AI tools were utilized responsibly to assist in development:
- **AI Code Generation**: Assisted in drafting boilerplate configurations (Express setups, SQLite table definitions, and initial React structure).
- **AI Bug Fixing**: Leveraged code generation feedback to solve SQLite transaction locks and JSON schema mapping errors from the LLM.
- **UI Design Suggestion**: Tailored glassmorphism and light/dark highlights using custom CSS properties.
- **Manual Debugging & Originality**: All scripts, database integrity states, and token exchanges were manually verified, edited, and formatted to ensure modularity. The student maintains complete, explainable knowledge of the codebase, ready for viva questions (Why SQLite? Why Prototype model? Explain ER diagram).

---

### 6. Deliverables Checklist Evaluation

| Deliverable | Location in Repository | Status | Verified Check |
| :--- | :--- | :--- | :--- |
| **Working Source Code** | `src/`, `backend/`, `database/` | Complete | [x] Yes |
| **SRS Document** | `docs/SRS.md` | Complete | [x] Yes |
| **Design Document** | `docs/DESIGN.md` | Complete | [x] Yes |
| **Installation Guide** | `docs/INSTALLATION.md` | Complete | [x] Yes |
| **User Guide (Windows + Mac)** | `docs/USER_GUIDE.md` | Complete | [x] Yes |
| **Presentation Slides** | `docs/SLIDES.md` | Complete | [x] Yes |
| **Test Cases** | `testing/TEST_CASES.md` | Complete | [x] Yes |
| **Bug Report** | `testing/TEST_CASES.md#2-bug-report` | Complete | [x] Yes |
| **Final Project Report** | `report/FINAL_REPORT.md` | Complete | [x] Yes |
| **Screenshots Folder** | `screenshots/` | Initialized | [x] Yes |

---

### 7. Edge Cases Handled

Travito implements both **frontend (React) and backend (Express)** validation layers to guard against invalid inputs:

| Edge Case | Layer | Response |
| :--- | :--- | :--- |
| Start date is in the past | Frontend + Backend | Error message displayed; request blocked |
| End date is before start | Frontend + Backend | Error message displayed; request blocked |
| Trip exceeds 30 days | Frontend + Backend | Error message displayed; request blocked |
| Destination is only numbers/symbols | Frontend + Backend | Error: "Enter a real city or country name" |
| Destination is blank or 1 character | Frontend + Backend | Error: validation message displayed |
| Budget below $50 | Frontend + Backend | Error: "Minimum budget is $50" |
| Budget above $1,000,000 | Frontend + Backend | Error: "Budget seems too high" |
| Expense amount is 0 or negative | Frontend | Error: "Enter a valid positive amount" |
| Expense amount exceeds $100,000 | Frontend | Error: "Amount seems unusually high" |
| Expense description is blank | Frontend | Error: "Enter a brief description" |
| AI returns empty itinerary | Frontend | Error: fallback mock data activated |
| Groq API key invalid / expired | Backend | Graceful fallback to mock data |
| Groq API network timeout | Backend | Graceful fallback to mock data |
| Division by zero in budget gauge | Frontend | Guard: `const limit = budget || 1` |
| SQLite transaction conflict | Backend | Atomic `db.transaction()` prevents race conditions |
