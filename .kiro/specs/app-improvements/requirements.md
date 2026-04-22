# Requirements Document

## Introduction

This document defines the requirements for the next sprint of improvements to HabitFlow, a Next.js habit tracking application backed by PocketBase. The improvements span nine feature areas: AI-powered insights (Pro), social sharing and friend challenges, advanced analytics visualizations, custom habit categories, dark mode theming, data export (CSV/JSON), habit completion notes, dashboard widgets, and a PWA install prompt on the landing page.

The application already has: habit tracking with streaks, an analytics page, Pro subscription via Stripe/Razorpay, push notifications, an admin panel, PWA service worker, a journal page, and an onboarding flow.

---

## Glossary

- **HabitFlow**: The Next.js habit tracking application being improved.
- **AI_Insights_Engine**: The server-side module responsible for generating and caching habit insights (currently at `/api/insights`).
- **Analytics_Page**: The existing `/analytics` page displaying charts, heatmaps, and streak data.
- **Dashboard**: The existing `/dashboard` page showing today's habits and progress.
- **Export_Service**: The new server-side module responsible for generating CSV and JSON exports of user data.
- **Category_Manager**: The new client-side and server-side module for managing user-defined habit categories.
- **Theme_Manager**: The client-side module responsible for applying and persisting light/dark/system themes.
- **Note**: A free-text annotation attached to a single habit log entry for a specific date.
- **Widget**: A compact, interactive UI card on the Dashboard providing quick access to a specific feature or metric.
- **PWA_Install_Prompt**: The browser's native `BeforeInstallPromptEvent` used to trigger the Add to Home Screen flow.
- **Social_Share**: A generated image or URL that a user can share externally to showcase their streak or challenge a friend.
- **Challenge**: A time-boxed habit goal shared between two or more users.
- **Pro_User**: A user with an active Pro subscription (`plan === "pro"` or `plan === "admin"`).
- **Free_User**: A user without an active Pro subscription (`plan === "free"`).
- **Streak**: The consecutive number of days a habit has been completed without a break.
- **PocketBase**: The backend database and auth service used by HabitFlow.

---

## Requirements

### Requirement 1: AI-Powered Habit Insights (Pro Feature)

**User Story:** As a Pro user, I want AI-powered insights about my habit patterns, so that I receive personalised, actionable recommendations beyond basic statistics.

#### Acceptance Criteria

1. WHILE a user's `plan` is `"pro"` or `"admin"`, THE AI_Insights_Engine SHALL generate a weekly insight report containing at least 3 and at most 7 insight items derived from the user's habit logs from the past 30 days.
2. WHEN a Pro user navigates to the Analytics page, THE Analytics_Page SHALL display the AI insight report for the current week within 3 seconds of page load.
3. WHEN the AI insight report for the current week already exists in the cache, THE AI_Insights_Engine SHALL return the cached report without re-computing it.
4. WHEN the AI insight report for the current week does not exist in the cache, THE AI_Insights_Engine SHALL compute and cache the new report before returning it.
5. WHEN a Free user navigates to the Analytics page, THE Analytics_Page SHALL display a Pro upgrade prompt in place of the AI insights panel.
6. THE AI_Insights_Engine SHALL include at least one insight of type `"achievement"` when the user has completed all habits on 5 or more days in the past 7 days.
7. THE AI_Insights_Engine SHALL include at least one insight of type `"warning"` when any habit has a completion rate below 40% over the past 14 days with at least 5 logged days.
8. IF the AI_Insights_Engine encounters an error during insight generation, THEN THE AI_Insights_Engine SHALL return the most recently cached insight report for that user, or an empty insights array if no cache exists.
9. WHERE the `OPENAI_API_KEY` environment variable is set, THE AI_Insights_Engine SHALL enhance insight descriptions using the configured language model to produce natural-language summaries.
10. THE AI_Insights_Engine SHALL NOT expose raw habit log data or personally identifiable information in the API response beyond what is required to render the insight items.

---

### Requirement 2: Social Features — Streak Sharing and Friend Challenges

**User Story:** As a user, I want to share my streaks and challenge friends to habit goals, so that I can stay motivated through social accountability.

#### Acceptance Criteria

1. WHEN a user taps the "Share Streak" action on a habit with a streak of 3 or more days, THE Dashboard SHALL generate a shareable image card displaying the habit name, streak count, and the HabitFlow branding.
2. WHEN the shareable image card is generated, THE Dashboard SHALL invoke the Web Share API if available, or fall back to copying a share URL to the clipboard.
3. IF the Web Share API is not available and clipboard write fails, THEN THE Dashboard SHALL display the share URL in a modal so the user can copy it manually.
4. WHEN a user creates a Challenge, THE Challenge SHALL require a habit name, a duration in days (between 7 and 90 inclusive), and at least one invited participant email address.
5. WHEN a Challenge is created, THE HabitFlow SHALL send an email invitation to each invited participant using the existing email service.
6. WHEN an invited participant accepts a Challenge, THE HabitFlow SHALL create a corresponding habit in the participant's habit list with the challenge name and duration.
7. WHILE a Challenge is active, THE Dashboard SHALL display a Challenge progress card showing each participant's current streak for the challenge habit.
8. WHEN a Challenge's duration expires, THE HabitFlow SHALL mark the Challenge as completed and notify all participants via push notification.
9. IF a user attempts to create more than 3 simultaneous active Challenges, THEN THE HabitFlow SHALL reject the request and return a descriptive error message.
10. THE HabitFlow SHALL store Challenge data in PocketBase with participant references, start date, end date, and per-participant completion status.

---

### Requirement 3: Advanced Analytics — Enhanced Insights and Visualisations

**User Story:** As a Pro user, I want richer analytics visualisations and deeper insights, so that I can understand my habit patterns at a granular level.

#### Acceptance Criteria

1. WHILE a user's `plan` is `"pro"` or `"admin"`, THE Analytics_Page SHALL display a 90-day completion heatmap with per-cell tooltips showing the date and number of habits completed.
2. WHILE a user's `plan` is `"pro"` or `"admin"`, THE Analytics_Page SHALL display a habit correlation matrix showing pairs of habits completed together on the same day with a correlation coefficient of 0.7 or higher, computed over the past 30 days.
3. WHEN a user selects a specific habit from the habit list on the Analytics page, THE Analytics_Page SHALL display a detail view showing that habit's 30-day completion trend, current streak, longest streak, and best day of the week.
4. WHILE a user's `plan` is `"pro"` or `"admin"`, THE Analytics_Page SHALL display a time-of-day completion distribution chart showing the hours at which habits are most frequently completed, derived from log timestamps.
5. WHEN a Free user views the Analytics page, THE Analytics_Page SHALL display the 7-day weekly bar chart and current/longest streak cards, and SHALL display a Pro upgrade prompt for all advanced visualisation sections.
6. THE Analytics_Page SHALL render all charts using the existing Recharts library without introducing additional charting dependencies.
7. WHEN the user has fewer than 7 days of habit log data, THE Analytics_Page SHALL display a "Not enough data yet" placeholder in place of charts that require a minimum data window.
8. THE Analytics_Page SHALL load all analytics data in a single parallel fetch call to minimise waterfall requests.

---

### Requirement 4: Habit Categories — Custom User-Defined Categories

**User Story:** As a user, I want to create and assign custom categories to my habits, so that I can organise my habits in a way that reflects my personal goals.

#### Acceptance Criteria

1. THE Category_Manager SHALL allow a user to create a custom category with a name (1–30 characters) and an icon selected from the existing Material Symbols icon set.
2. WHEN a user creates a category with a name that already exists for that user (case-insensitive), THE Category_Manager SHALL reject the request and return a descriptive error message.
3. THE Category_Manager SHALL allow a user to rename an existing custom category, and THE HabitFlow SHALL update all habits assigned to that category to reflect the new name.
4. WHEN a user deletes a custom category, THE HabitFlow SHALL reassign all habits in that category to the default category `"General"`.
5. WHEN a user creates or edits a habit, THE Dashboard SHALL display a category selector showing all system-defined categories and the user's custom categories.
6. THE Analytics_Page SHALL display a category breakdown chart showing the number of habits and average completion rate per category.
7. THE Dashboard SHALL allow a user to filter the habit list by category using a horizontal chip row above the habit list.
8. A Free_User SHALL be limited to 5 custom categories. A Pro_User SHALL be limited to 50 custom categories.
9. IF a user attempts to create a category beyond their plan limit, THEN THE Category_Manager SHALL reject the request and display a plan upgrade prompt.
10. THE HabitFlow SHALL persist custom categories in PocketBase in a `habit_categories` collection linked to the user's ID.

---

### Requirement 5: Dark Mode — Theme Switching

**User Story:** As a user, I want to switch between light, dark, and system themes, so that I can use HabitFlow comfortably in any lighting condition.

#### Acceptance Criteria

1. THE Theme_Manager SHALL support three theme modes: `"light"`, `"dark"`, and `"system"`.
2. WHEN a user selects a theme mode, THE Theme_Manager SHALL apply the selected theme to the entire application immediately without requiring a page reload.
3. WHEN the theme mode is `"system"`, THE Theme_Manager SHALL apply the dark theme when the OS-level `prefers-color-scheme` media query resolves to `"dark"`, and the light theme otherwise.
4. WHEN the OS-level colour scheme changes while the theme mode is `"system"`, THE Theme_Manager SHALL update the applied theme within 500ms without requiring user interaction.
5. THE Theme_Manager SHALL persist the user's selected theme mode in `localStorage` under the key `"habitflow-theme"`.
6. WHEN a user loads the application, THE Theme_Manager SHALL read the persisted theme mode from `localStorage` and apply it before the first paint to prevent a flash of incorrect theme.
7. THE Theme_Manager SHALL implement dark mode by toggling a `"dark"` class on the `<html>` element, compatible with Tailwind CSS's `darkMode: "class"` configuration.
8. THE Settings page SHALL display a theme selector with three clearly labelled options: Light, Dark, and System.
9. WHEN dark mode is active, THE HabitFlow SHALL maintain a contrast ratio of at least 4.5:1 for all body text against its background, in compliance with WCAG 2.1 AA.
10. THE Theme_Manager SHALL apply the correct theme before hydration to prevent a flash of unstyled content on initial page load.

---

### Requirement 6: Export Data — CSV and JSON Export

**User Story:** As a user, I want to export my habit and log data as CSV or JSON, so that I can back up my data or analyse it in external tools.

#### Acceptance Criteria

1. THE Export_Service SHALL support two export formats: `"csv"` and `"json"`.
2. WHEN a user requests a CSV export, THE Export_Service SHALL generate a file containing one row per habit log entry with columns: `date`, `habit_name`, `habit_type`, `category`, `status`, `count`, `note`.
3. WHEN a user requests a JSON export, THE Export_Service SHALL generate a file containing a JSON object with two top-level keys: `habits` (array of habit objects) and `logs` (array of log objects including any notes).
4. WHEN a user requests an export, THE Export_Service SHALL include all data from the user's account creation date up to and including the current date.
5. WHEN the export file is ready, THE Export_Service SHALL respond with the appropriate `Content-Disposition: attachment` header so the browser triggers a file download.
6. THE Export_Service SHALL set the exported filename to `habitflow-export-{YYYY-MM-DD}.csv` or `habitflow-export-{YYYY-MM-DD}.json` using the current date.
7. IF the user has no habit log data, THEN THE Export_Service SHALL return an empty CSV with only the header row, or an empty JSON object with `habits: []` and `logs: []`.
8. THE Export_Service SHALL be accessible from the Settings page via clearly labelled "Export as CSV" and "Export as JSON" buttons.
9. THE Export_Service SHALL authenticate the request using the existing session mechanism and SHALL reject unauthenticated requests with a 401 response.
10. THE Export_Service SHALL complete the export generation within 10 seconds for accounts with up to 10,000 log entries.

---

### Requirement 7: Habit Notes — Annotations on Daily Completions

**User Story:** As a user, I want to add a short note when I complete a habit, so that I can record context or reflections alongside my daily log.

#### Acceptance Criteria

1. WHEN a user marks a habit as complete, THE Dashboard SHALL display an optional note input field accepting up to 280 characters.
2. THE HabitFlow SHALL store the note text in the `habit_logs` collection in PocketBase as a `note` field on the log entry.
3. WHEN a user saves a note, THE Dashboard SHALL display a note indicator icon on the habit item for that day.
4. WHEN a user taps the note indicator icon on a completed habit, THE Dashboard SHALL display the saved note text in a read-only tooltip or bottom sheet.
5. WHEN a user edits a note on an existing log entry, THE HabitFlow SHALL update the `note` field on that log entry and preserve all other log fields unchanged.
6. IF a user submits a note exceeding 280 characters, THEN THE Dashboard SHALL reject the input and display an inline validation message before the form is submitted.
7. THE Analytics_Page SHALL display a "Notes" section listing the 5 most recent habit notes with the habit name, date, and note text.
8. THE Export_Service SHALL include the `note` field in both CSV and JSON exports as specified in Requirement 6.
9. A Free_User SHALL be able to add notes to all habit completions without restriction.
10. WHEN a habit log entry has no note, THE HabitFlow SHALL store a `null` value for the `note` field rather than an empty string.

---

### Requirement 8: Dashboard Widgets — Quick-Action Cards

**User Story:** As a user, I want configurable widgets on my dashboard, so that I can access key metrics and actions without navigating away from the main screen.

#### Acceptance Criteria

1. THE Dashboard SHALL display a widget row above the habit list containing at least the following default widgets: Today's Progress, Current Streak, and Quick Add Habit.
2. WHEN a user taps the "Quick Add Habit" widget, THE Dashboard SHALL open the Add Habit modal directly without requiring navigation.
3. THE Dashboard SHALL support a "Weekly Summary" widget displaying the completion percentage for each of the past 7 days as a compact sparkline.
4. THE Dashboard SHALL support a "Upcoming Reminder" widget displaying the next scheduled habit reminder time and habit name.
5. WHEN a user long-presses or activates the widget edit mode, THE Dashboard SHALL allow the user to reorder widgets by drag-and-drop.
6. WHEN a user removes a widget, THE Dashboard SHALL hide it from the widget row and persist the preference in `localStorage` under the key `"habitflow-widgets"`.
7. WHEN a user adds a widget back, THE Dashboard SHALL restore it to the widget row in the last saved position.
8. THE Dashboard SHALL persist widget order and visibility in `localStorage` under the key `"habitflow-widgets"`.
9. WHERE a Pro subscription is active, THE Dashboard SHALL display an additional "AI Insight of the Day" widget showing the top insight from the current week's AI report.
10. WHEN the widget row contains more widgets than fit in the viewport width, THE Dashboard SHALL allow horizontal scrolling of the widget row without affecting the rest of the page layout.

---

### Requirement 9: PWA — Install Prompt on Landing Page

**User Story:** As a visitor to the landing page, I want to see an option to install HabitFlow as a PWA, so that I can add it to my home screen directly from the marketing page.

#### Acceptance Criteria

1. WHEN the browser fires the `beforeinstallprompt` event on the landing page, THE Landing_Page SHALL capture and defer the event for later use.
2. WHEN the `beforeinstallprompt` event has been captured, THE Landing_Page SHALL display a visible "Install App" button or banner in the hero section.
3. WHEN a user clicks the "Install App" button, THE Landing_Page SHALL invoke the deferred `beforeinstallprompt` event to trigger the browser's native install dialog.
4. WHEN the user accepts the install dialog, THE Landing_Page SHALL hide the "Install App" button and display a confirmation message: "HabitFlow has been added to your home screen."
5. WHEN the user dismisses the install dialog without installing, THE Landing_Page SHALL keep the "Install App" button visible.
6. WHEN the application is already installed (detected via `display-mode: standalone` media query), THE Landing_Page SHALL NOT display the "Install App" button.
7. THE Landing_Page SHALL display the "Install App" button only on browsers that support the `beforeinstallprompt` event; on unsupported browsers, THE Landing_Page SHALL display a "Add to Home Screen" instructional link pointing to platform-specific guidance.
8. THE Landing_Page SHALL include the existing PWA manifest link and theme-color meta tag to ensure the install criteria are met.
9. WHEN a user installs the PWA from the landing page, THE PWA SHALL open to `/dashboard` as defined in the existing `manifest.json` `start_url`.
10. THE Landing_Page SHALL track install prompt shown and install accepted events using a client-side analytics call to the existing `/api/health` endpoint pattern for future instrumentation.
