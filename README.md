# Gemma Study Sphere

**Gemma Study Sphere** is a high-fidelity, premium online learning dashboard designed to eliminate cognitive friction and the "paradox of choice" for modern students. It unifies scattered workflows—AI idea generation, focus timers, study roadmaps, and resources—into one cohesive, flow-state-inducing workspace.

### 1. Premium Design Architecture
- **Bespoke Design System**: Replaced default setups with a custom Vanilla CSS (CSS Modules) architecture ensuring pixel-perfect control and premium aesthetics.
- **Dynamic Theming**: Implemented a seamless Light/Dark mode toggle that instantly overrides CSS variables across the entire application without page reloads.
- **"Free" & Spacious UI**: Replaced rigid borders with soft drop shadows, utilized glassmorphism (`backdrop-filter`), and increased padding to create an airy, uncluttered environment that reduces cognitive load.
- **Fluid Animations**: Added `@keyframes` for floating background blobs, bouncy scroll indicators, and smooth modal scaling to make the interface feel alive.

### 2. Immersive Entry Experience
- **Cinematic Landing Page**: A striking hero section with gradient typography centered perfectly on the screen.
- **Smooth Discovery**: A scroll-revealed description section explaining the "Paradox of Choice" in modern learning.
- **Glassmorphic Login**: Instead of jumping to a new page, clicking "Login" summons a frosted-glass modal overlay for credential input, leading to a seamless transition into the workspace.

### 3. Unified Workspace Modules
We built a state-driven navigation architecture (`page.tsx`) that acts as a lightning-fast SPA, containing four distinct modules:

*   **Dashboard View**: The central hub featuring an active "hero" focus session, quick toolkit shortcuts, weekly progress tracking, and a persistently docked AI Guider widget.
*   **Course Generator View**: A drag-and-drop and URL-input interface allowing users to upload PDFs or paste YouTube links to instantly generate structured study roadmaps.
*   **Focus Room View**: A deeply immersive, minimalist Pomodoro timer (25:00) featuring integrated ambient noise controls (e.g., Binaural Beats / Gamma Waves) to maintain flow state.
*   **AI Guider View**: A dedicated, full-screen chat interface for "Gemma Coach," designed to maintain long-term contextual memory of the student's struggles and progress.

### 4. UX Enhancements
- **Collapsible Sidebar**: Added a toggle button to shrink the sidebar down to just its icons, reclaiming massive horizontal screen real estate for deep work.
- **Environment & Build Stability**: Bypassed local NVM/Node pathing issues, removed broken native PostCSS dependencies, and resolved strict TypeScript type errors regarding Lucide React icons.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS Modules and CSS Custom Variables
- **Icons**: `lucide-react`

## 🏃‍♂️ How to Run Locally

1. Ensure you have Node.js 22+ installed.
2. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---
*Designed with an obsessive focus on reducing friction and maximizing the student flow state.*
