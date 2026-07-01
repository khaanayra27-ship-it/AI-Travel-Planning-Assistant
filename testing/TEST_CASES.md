# Test Cases, Bug Report, & Testing Evidence
## Project: AI Travel Planning Assistant (Travito)

This document contains verification specifications for the Travito application.

---

### 1. Test Matrix & Test Cases

| Test Case ID | Test Group | Description | Input / Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-AUTH-01** | Authentication | User Registration | Submit email `scarlett@test.com`, name `Scarlett Cavil`, password `password123`. | User account created; JWT token issued; user redirected. | **PASSED** |
| **TC-AUTH-02** | Authentication | Duplicate User Registration | Attempt registering `scarlett@test.com` again. | Returns `400 Bad Request` with "Email already registered." message. | **PASSED** |
| **TC-AUTH-03** | Authentication | Unauthorized Route Access | Fetch `/api/trips` without bearer header. | Returns `401 Unauthorized` with "Access token required" message. | **PASSED** |
| **TC-PLAN-01** | AI Planning | AI Itinerary generation (API Online) | Trigger itinerary for `Paris` with valid `GROQ_API_KEY`. | Returns custom JSON with days, hotels, and packing items. | **PASSED** |
| **TC-PLAN-02** | AI Planning | Itinerary generation (Fallback Trigger) | Trigger itinerary with invalid or missing API key. | Gracefully defaults to mock generation templates under 150ms. | **PASSED** |
| **TC-TRIP-01** | Trip CRUD | Save Generated Itinerary | Click "Save Trip" on generated draft preview. | Trip committed to SQLite; visible on Dashboard. | **PASSED** |
| **TC-TRIP-02** | Trip CRUD | Cascaded Deletion | Click delete on a saved trip card. | SQLite deletes trip, itineraries, hotels, and packing rows. | **PASSED** |
| **TC-PACK-01** | Packing | Toggle Packing Checkbox | Check item "Passport" in packing tab. | DB updates packed state to `1`; state persists on refresh. | **PASSED** |
| **TC-BUDG-01** | Budget Tracker | Log Custom Expense | Add `$200` category `Accommodation` on `2026-06-25`. | Expense saved; gauge updates exhausted percentage correctly. | **PASSED** |
| **TC-CHAT-01** | AI Chatbot | In-Context Consultation | Prompt: "Is tap water safe to drink?" in Paris trip. | Bot recognizes trip destination context and returns safety tips. | **PASSED** |
| **TC-EDGE-01** | Edge Cases | Past Start Date | Enter start date `2020-01-01`. | Frontend blocks: "Start date cannot be in the past." | **PASSED** |
| **TC-EDGE-02** | Edge Cases | End Before Start Date | Enter start `2026-10-10`, end `2026-10-05`. | Frontend blocks: "End date must be after the start date." | **PASSED** |
| **TC-EDGE-03** | Edge Cases | Trip Exceeds 30 Days | Enter 45-day date range. | Frontend blocks: "Please limit trips to 30 days maximum." | **PASSED** |
| **TC-EDGE-04** | Edge Cases | Numeric-Only Destination | Enter destination `12345`. | Frontend + Backend blocks: "Destination cannot be purely numbers." | **PASSED** |
| **TC-EDGE-05** | Edge Cases | Budget Below $50 | Enter budget `$10`. | Frontend + Backend blocks: "Minimum trip budget is $50." | **PASSED** |
| **TC-EDGE-06** | Edge Cases | Negative Expense Amount | Enter amount `-50`. | Frontend blocks: "Please enter a valid positive amount." | **PASSED** |
| **TC-EDGE-07** | Edge Cases | Blank Expense Description | Leave description empty, submit expense. | Frontend blocks: "Please enter a brief description." | **PASSED** |
| **TC-EDGE-08** | Edge Cases | AI Returns Empty Array | Mock returns `{ itinerary: [] }`. | Frontend shows: "AI could not generate a valid itinerary." | **PASSED** |

---

### 2. Bug Report

#### Bug ID: B-001
- **Severity**: High
- **Description**: Frontend threw JSON parse error when Groq API returned Llama-3 output wrapped in markdown code ticks (\`\`\`json ... \`\`\`).
- **Fix Applied**: Set `response_format: { type: "json_object" }` in Groq API options and explicitly instructed the system prompt to output ONLY raw JSON data, avoiding ticks. Also added a try-catch block inside backend `/generate-itinerary` to fallback cleanly if JSON parsing still fails.

#### Bug ID: B-002
- **Severity**: Medium
- **Description**: SQLite database locked error occurred when adding multiple itinerary nodes sequentially.
- **Fix Applied**: Grouped all itinerary, hotel, and packing inserts into a single SQL transaction block (`db.transaction()`) in `routes/trips.js`. This guarantees atomic operations and prevents db file access locks.

#### Bug ID: B-003
- **Severity**: Low
- **Description**: Budget tracker exhausted percentage calculated as NaN if the user set budget limit to 0.
- **Fix Applied**: Added guard check in budget percentage formula: `const limit = selectedTrip.budget_limit || 1;` preventing division by zero.

---

### 3. Usability Verification Evidence
- **Desktop Layout (>= 1024px)**: Sidebar locks to left; main viewport renders grid panels.
- **Tablet Layout (768px - 1023px)**: Sidebar collapses to icons; metrics stack vertically.
- **Mobile Layout (< 768px)**: Navigation moves to icon toggles; cards layout sequentially.
