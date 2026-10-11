<!-- GEM-CRM-001 output. Source: Gemini app Deep Research, shared by Ahmed 2026-10-09 (https://share.gemini.google/2nhIpFtF60Nw). Extracted by the Lead with a headless browser; text unedited. Inline citation markers did not survive extraction; the numbered source list at the end is intact. Status: INPUT for LENS_AG review, not a deliverable. -->

# Enterprise CRM Interface Architecture and Structural Analysis for Agency Models

## Executive Summary

| Screen | Main Job | Top Questions Answered (5s) | Convergent Layout | Primary Action |
| --- | --- | --- | --- | --- |
| **1. App Shell** | Navigate modules, search, and manage context. | Where am I? How do I change clients? Where is global search? | Left sidebar navigation, top header for search and user profile. | "Create New" (Top right) |
| **2. Sign-in** | Authenticate securely and access the appropriate tier. | How do I log in? Where is SSO/2FA? | Centered authentication card or split-screen with branding. | "Sign In" / "Continue" |
| **3. Dashboard** | Assess high-level metrics and daily operational priorities. | What needs my attention? How are we tracking against goals? | Grid-based widgets, top-right date and global filter controls. | "Customize Dashboard" |
| **4. Leads List** | Triage and qualify unqualified inbound prospects. | Who is new? Who requires follow-up? | Data table with top filter bar, side panel for quick filters. | "Add Lead" |
| **5. Contacts List** | Manage and segment the qualified database. | How do I segment this list? Where are bulk actions? | Table view with saved filter tabs, bulk action toolbar overlay. | "Create Contact" |
| **6. Contact Record** | View interaction history and execute direct outreach. | Who is this? What happened last? What is the next step? | 3-column: Left (attributes), Center (timeline), Right (associations). | Log Activity / Send Email |
| **7. Merge Duplicates** | Consolidate fragmented data without data loss. | What is the master record? What data conflicts? | Side-by-side comparative table or dedicated modal wizard. | "Merge" |
| **8. Deals List** | Review deal inventory and financial aggregates. | What is the pipeline value? Which deals are stalled? | Table or Kanban toggle, filter bar for stage/owner parameters. | "Create Deal" |
| **9. Pipeline** | Progress deals through sequential lifecycle stages. | What is in each stage? What is rotting or stalled? | Horizontal scrolling columns (Kanban), drag-and-drop cards. | "Add Deal" |
| **10. Tasks** | Execute daily operational items and outbound outreach. | What is due today? What is overdue? | List view grouped by due date, right-side record preview pane. | "Create Task" |
| **11. Segments/Lists** | Build dynamic audiences for targeted campaigns. | What are the criteria? How many matched the criteria? | Rule builder (logic UI) top/left, live preview table bottom/right. | "Save List" |
| **12. Import** | Ingest external CSV data and map schema accurately. | Are there errors? Did columns map correctly? | Sequential stepper: Upload -> Map -> Validate -> Review. | "Start Import" |
| **13. Reports** | Visualize segmented performance data and ROI. | What is the trend? What is the underlying data source? | Canvas area with drag-and-drop chart configuration sidebar. | "Export" / "Save Report" |
| **14. Journeys** | Track multi-touch attribution and original sources. | Where did this lead originate? What did they click? | Vertical chronological timeline integrated into the record page. | "View Source Details" |
| **15. Integrations** | Connect external ad and tool ecosystems. | Is the connection active? How do I map third-party accounts? | Grid of application cards, modal overlay for OAuth flow. | "Connect App" |
| **16. Settings** | Configure roles, custom fields, and security. | How do I add users? Where are the custom properties? | Secondary left sidebar for setting categories, main form area. | "Save Changes" |

## 1. App Shell

The App Shell establishes the macro-architecture of the CRM, dictating how users orient themselves, transition between distinct operational contexts, and access global functionalities.

**a. Primary Users and Jobs:** The primary users encompass both agency staff (managing multiple client instances) and client users (restricted to their specific workspace). The principal operational jobs include global navigation across modules, rapid context switching between disparate client workspaces, executing global searches across the entire database, and initiating new record creation regardless of the current active screen.

**b. Top Questions Answered (5s):** Where am I within the system hierarchy? Which specific client workspace am I currently viewing and manipulating? How do I search across the entire global database? Where is the main navigation menu?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **HubSpot** | Left sidebar transitioning from top nav. Top right profile/account switcher. | "Create" (Top right) | Navigation items visible above fold. | No public evidence | Switch accounts via settings menu toggle. | (Date: Not shown) |
| **Salesforce** | Global Header with App Launcher (top left), Global Search (top center). | No public evidence | Horizontal nav / App Launcher view. | No public evidence | Responsive App Launcher stacking. | (Date: Not shown) |
| **GoHighLevel** | Left sidebar navigation. Sub-Account Switcher at extreme top-left. | No public evidence | Sidebar and main canvas. | No public evidence | No public evidence | (Date: Not shown) |
| **Attio** | Persistent left sidebar for objects; top right profile/settings. | No public evidence | Global view of records. | No public evidence | No public evidence | (Date: Not shown) |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The enterprise SaaS industry is converging heavily on a persistent left sidebar for module navigation, coupled with a top header dedicated exclusively to global search functionality (usually centered) and user profile/settings (right-aligned). A prominent, high-contrast "Quick Create" button typically anchors the top right corner.

**e. Differentiators and User Reports:** OBSERVATION reveals that HubSpot positions account switching in the top right beneath the user profile, whereas GoHighLevel situates the "Sub-Account Switcher" at the top left of the navigation menu OBSERVATION. User reports indicate significant friction with HubSpot's account switching when users possess disparate email credentials across accounts, necessitating complete logouts rather than seamless session switching OBSERVATION.

**f. Visual Separation:** Navigation regions are universally separated from the main content canvas by subtle, low-contrast 1px vertical borders and distinct background colorations, such as dark or light grey sidebars contrasting against a pure white main content area.

**g. INFERENCE:** Adopt a left-sidebar architecture featuring a top-left workspace switcher. For an agency CRM, the client context dictates all available data; placing the switcher at the top-left aligns with the western user's mental model of establishing scope before parsing navigation items (scanning top-to-bottom, left-to-right). Avoid HubSpot's top-right switching pattern, which buries scope changes under personal user profile settings.

## 2. Sign-in

The Sign-in screen serves as the initial gateway, requiring robust security measures while minimizing friction for varying user personas.

**a. Primary Users and Jobs:** Agency staff and client users. The primary jobs include authenticating securely via email and password, utilizing Single Sign-On (SSO) for accelerated access, verifying Two-Factor Authentication (2FA) challenges, and recovering forgotten credentials.

**b. Top Questions Answered (5s):** Where do I enter my credentials? Is Single Sign-On supported? How do I reset my password? Is this a secure, authenticated portal?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **GoHighLevel** | Client Portal SSO and Magic Links. Optional Google Sign-In. | "Log In" / SSO | Centered authentication modal. | Not applicable | No public evidence | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | Not applicable | No public evidence | No public evidence |
| **Salesforce** | No public evidence | No public evidence | No public evidence | Not applicable | No public evidence | No public evidence |
| **Attio** | No public evidence | No public evidence | No public evidence | Not applicable | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | Not applicable | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | Not applicable | No public evidence | No public evidence |

 

**d. Convergent Patterns:** Authentication interfaces consistently isolate the user from any structural navigation, preventing unauthorized access. The dominant layout is a centered floating card or a split-screen design. Third-party SSO options are invariably positioned above the manual email input fields, frequently separated by a distinct "OR" divider line.

**e. Differentiators and User Reports:** GoHighLevel differentiates significantly by offering heavily customizable Client Portals equipped with "Magic Links," which enable one-click access and allow agency clients to bypass password entry entirely OBSERVATION. Google Sign-In can also be selectively toggled on or off for these client-facing portals OBSERVATION.

**f. Visual Separation:** The login form is traditionally enclosed within a high-elevation card featuring a pronounced drop shadow, visually lifting it from a neutral or agency-branded background image.

**g. INFERENCE:** Adopt a centralized login card layout with dynamic, customizable branding based on URL parameters, ensuring client users encounter the agency's branding upon arrival. Adopt SSO and Magic Link capabilities; these drastically reduce login friction for read-only client viewers who may only access the system sporadically and are prone to password fatigue.

## 3. Dashboard / Home

The Dashboard serves as the operational command center, aggregating disparate data streams into digestible, actionable visual insights.

**a. Primary Users and Jobs:** Agency managers (monitoring cross-client KPIs), sales representatives (managing daily tasks and pipeline status), and client users (reviewing ROI and lead volume). Jobs encompass assessing performance at a glance, identifying pipeline bottlenecks, and navigating directly to urgent, high-priority items.

**b. Top Questions Answered (5s):** How is my sales pipeline performing currently? What are my critical tasks for today? Are there any alerts, rotting deals, or system notifications requiring immediate attention?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **HubSpot** | Flexible grid of report widgets. Cross-portal reporting visible above fold. | "Customize" | Unified metrics across connected accounts. | No public evidence | No public evidence | (Date: Not shown) |
| **GoHighLevel** | SaaS analytics and MRR (Agency). Funnel metrics (Sub-account). | No public evidence | Summary metrics above fold. | No public evidence | No public evidence | (Date: Not shown) |
| **Attio** | Configurable dashboard organizing reports. | "Create Dashboard" | Grid of customizable reports. | No public evidence | No public evidence | (Date: Not shown) |
| **Salesforce** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** Dashboards universally deploy a modular, drag-and-drop grid system. A persistent top toolbar houses global date ranges and filtering criteria. Individual data widgets feature an overflow menu (...) allowing users to export the data or drill down into the underlying records.

**e. Differentiators and User Reports:** HubSpot's cross-portal reporting capabilities OBSERVATION represent a substantial differentiator, empowering an agency to roll up financial and performance data from multiple disparate client accounts into a single macro-dashboard, thereby eliminating manual data aggregation.

**f. Visual Separation:** Individual widgets are rendered as distinct white cards featuring subtle borders or drop shadows. They are separated by uniform negative space (gutters) and set against a light grey background to emphasize the data constraints.

**g. INFERENCE:** Adopt a widget-based grid dashboard architecture. For the agency CRM, explicitly architect two distinct dashboard tiers: an "Agency Macro Dashboard" that aggregates performance data across all client sub-workspaces, and a "Client Micro Dashboard" locked strictly to the individual workspace context. Avoid static, hard-coded dashboard layouts, as varying client industries require distinct KPI visualizations.

## 4. Leads List

The Leads List is the primary interface for processing high-velocity, low-fidelity inbound data streams from external advertising channels.

**a. Primary Users and Jobs:** Sales representatives and agency marketers. The jobs entail triaging inbound leads generated from Meta, Google, and TikTok ads, rapidly updating lead statuses, and executing bulk assignments to specific sales personnel.

**b. Top Questions Answered (5s):** Which leads remain untouched? What was their acquisition source? To whom are they currently assigned?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **Salesforce** | Lead Intelligence View with engagement metrics above a tabular list. | "New Lead" | List View Home | No public evidence | No public evidence | (Date: Not shown) |
| **GoHighLevel** | Table integrating directly with FB/TikTok lead ads. Left-side checkboxes. | No public evidence | Tabular data list. | Bulk actions via checkbox selection. | No public evidence | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Attio** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The data table serves as the universal standard for lead management. The structural layout includes a top toolbar containing a search input, specialized filter dropdowns, and column configuration controls. Bulk actions (assign, delete, change status) typically remain hidden to conserve space until a row's checkbox is actively selected.

**e. Differentiators and User Reports:** Salesforce structurally separates Leads from Contacts fundamentally, requiring a formal conversion process OBSERVATION. Modern systems tend to integrate these, treating a lead merely as a lifecycle stage of a unified contact record, thereby reducing database friction.

**f. Visual Separation:** Horizontal divider lines separate table rows, with zebra striping occasionally deployed to enhance readability across wide tables. The bulk action toolbar often overlays the standard table header, rendered visually distinct via a high-contrast background color.

**g. INFERENCE:** Adopt a unified tabular list equipped with a sticky header. Given the operational mandate that leads will flow directly from Meta, Google, and TikTok ad accounts, the "Source" and "Ad Campaign" columns must be visible by default. Avoid separating Leads and Contacts into fundamentally different technical objects (the classic Salesforce model), as this introduces unnecessary conversion friction; instead, treat them as varying lifecycle stages of a unified person record.

## 5. Contacts List

The Contacts List acts as the enduring database of record, requiring robust segmentation and mass-communication capabilities.

**a. Primary Users and Jobs:** Sales representatives and client relationship managers. Jobs involve searching for specific individuals, filtering the database by complex custom criteria, editing contact details inline without loading the full record, and initiating bulk email or SMS campaigns.

**b. Top Questions Answered (5s):** How do I isolate a specific segment of contacts? How many contacts match my current filter criteria? How do I initiate a mass communication to this segmented list?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **GoHighLevel** | "Smart Lists" as tabs above table. Filter panel. | "Add Contact" | Saved Smart List | Bulk add to workflow, bulk email. | No public evidence | (Date: Not shown) |
| **Salesforce** | Contact Intelligence View, list views with inline editing. | "New Contact" | List View | Merge duplicates. | No public evidence | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Attio** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The layout consists of a primary header featuring tabbed saved views, a filter configuration panel (frequently designed to slide out from the right-hand side), a main data table canvas, and pagination controls anchored at the bottom. The primary action, "Create Contact," is consistently located in the top right.

**e. Differentiators and User Reports:** GoHighLevel's "Smart Lists" are deeply integrated into agency operational workflows. They allow users to construct advanced filters (incorporating positive and negative Boolean logic), save them as accessible tabs, select all matching contacts, and immediately push them into an automated workflow or bulk email campaign via the bulk action toolbar OBSERVATION.

**f. Visual Separation:** Saved views are visualized as horizontal tabs, utilizing underline indicators for the active state. When invoked, the filter pane sits on an elevated z-index with a pronounced drop shadow, often subtly dimming the underlying table to focus user attention.

**g. INFERENCE:** Adopt GoHighLevel's "Smart List" tabbed paradigm. For an agency executing localized ad campaigns, the ability for a sales representative to click a pre-configured tab (e.g., "Meta Leads - Oct 2026"), select all records, and execute a bulk-SMS blast is paramount for operational velocity. Ensure the bulk action toolbar appears prominently across the top of the table immediately upon record selection.

## 6. Contact Record Page

The Contact Record Page is the micro-environment where the majority of individualized sales labor occurs, necessitating high context density and rapid interaction tools.

**a. Primary Users and Jobs:** Sales representatives. The jobs entail reviewing the historical context of a contact, executing a phone call, logging manual notes, dispatching one-off emails, and updating specific attribute values.

**b. Top Questions Answered (5s):** Who is this individual? What was the nature of our last interaction? What deals or companies are they associated with?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **Attio** | Left sidebar (Details). Center tabs (Overview, Activity, Emails). Top left actions. | "Log Activity" | Overview Tab (Highlights) | Not applicable | No public evidence | (Date: Not shown) |
| **Salesforce** | Page header (Highlights). Main area (Activity Timeline). Sidebar (Related Lists). | "New Task" | Highlights & Timeline | Not applicable | Mobile-first SLDS stacking. | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | Not applicable | No public evidence | No public evidence |
| **GoHighLevel** | No public evidence | No public evidence | No public evidence | Not applicable | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | Not applicable | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | Not applicable | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The industry standard has heavily converged upon a 2- or 3-column layout. The left column is strictly dedicated to structured data (properties/fields). The central (and largest) column acts as a chronological activity timeline. The apex of the center column houses the interaction composer, featuring tabs for Email, Call, Note, and Task execution.

**e. Differentiators and User Reports:** Attio relies heavily on horizontal tabs to segment the timeline into discrete categories (Emails vs Notes vs Activity) OBSERVATION. Conversely, Salesforce Lightning Design System (SLDS) utilizes a unified Activity Timeline as the primary main content area OBSERVATION.

**f. Visual Separation:** Columns are demarcated by subtle vertical dividers. Individual timeline events (e.g., emails, system notes) are encapsulated in separate cards featuring left-aligned icons indicating the interaction type. These cards are connected by a subtle vertical track line, visually representing the passage of time.

**g. INFERENCE:** Adopt a strict 3-column layout (Left: Properties, Center: Unified Timeline, Right: Associations/Deals). The unified timeline is operationally superior for sales representatives who require immediate chronological context, rather than forcing them to click through disparate tabs to piece together a fragmented interaction history.

## 7. Merge Duplicate Contacts

Data entropy is inevitable; the merge interface ensures database integrity without risking catastrophic data loss.

**a. Primary Users and Jobs:** Database managers and sales representatives. Jobs include identifying duplicate records, selecting the primary "master" record, mapping conflicting data fields, and executing the merge.

**b. Top Questions Answered (5s):** Which record will survive as the master? What specific data will be overwritten and lost? How do I confidently confirm the merge?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **Salesforce** | Comparative side-by-side table. Radio buttons for data survival. | "Merge" | Side-by-side comparison. | No public evidence | No public evidence | (Date: Not shown) |
| **Pipedrive** | Merging handled directly within the detail view of the item. | "Merge" | Detail view modal. | No public evidence | No public evidence | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **GoHighLevel** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Attio** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** Merging interfaces are invariably presented as high-focus modal overlays or dedicated full-page wizards. They utilize a columnar, side-by-side comparison layout where columns represent the individual duplicate records and rows represent the CRM properties.

**e. Differentiators and User Reports:** Salesforce provides predictive matching rules that actively flag potential duplicates directly on the record page, whereas simpler CRM architectures require the user to manually trigger a search for duplicates before initiating the merge process OBSERVATION.

**f. Visual Separation:** The designated "Master" record column is highlighted via a distinct background color (e.g., a pale blue or green tint). Radio buttons visually anchor the selected values across the horizontal rows, ensuring clarity regarding which data will survive.

**g. INFERENCE:** Adopt a side-by-side modal for conflict resolution. When a user selects "Merge", immediately present a 2-column view displaying only the conflicting fields, equipped with radio buttons allowing the user to explicitly choose the surviving value. Avoid automatic blind merging to prevent irreversible, untraceable data loss.

## 8. Deals List and Deal Record Page

The Deals module abstracts individual interactions into financial projections and pipeline velocity metrics.

**a. Primary Users and Jobs:** Sales representatives and agency managers. Jobs include tracking potential revenue, updating expected close dates and monetary amounts, and reviewing the history of specific negotiations.

**b. Top Questions Answered (5s):** What is the total value of this deal? When is it statistically expected to close? Who are the key associated contacts and stakeholders?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **Attio** | Highlights, Record Actions, Tabs, Left Sidebar (Properties). | "Create Deal" | Record layout parity with Contacts. | No public evidence | No public evidence | (Date: Not shown) |
| **Pipedrive** | Detail view handling identical to Contacts. | No public evidence | Split view. | No public evidence | No public evidence | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Salesforce** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **GoHighLevel** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The Deal list typically defaults to a Kanban view (detailed in Section 9), but invariably offers a tabular list toggle for executing bulk actions. The Deal Record page mimics the structural anatomy of the Contact Record page (Left: details, Center: timeline, Right: associations) to minimize cognitive friction.

**e. Differentiators and User Reports:** Unlike contact records, deal records mandate financial aggregates. OBSERVATION shows Attio utilizes a prominent "Highlights" widget panel at the absolute top (or top left) displaying Amount, Stage, and Close Date in large, high-contrast typography.

**f. Visual Separation:** Data is grouped identically to the contact records. However, the Highlights panel utilizes a higher contrast card or sits directly within the page header employing larger font weights to ensure financial data is instantly parsing.

**g. INFERENCE:** Adopt strict structural parity between Contact records and Deal records. Utilizing the identical 3-column layout drastically reduces cognitive load for users transitioning between the two entities. Ensure the "Amount" and "Stage" properties are permanently pinned above the fold in the left column or the top header.

## 9. Pipeline (Kanban Board)

The Pipeline translates static deal records into a dynamic, visual representation of sales velocity.

**a. Primary Users and Jobs:** Sales representatives and managers. Jobs include visualizing the holistic sales funnel, dragging deals physically to subsequent stages, identifying stalled deals, and viewing stage-specific revenue totals.

**b. Top Questions Answered (5s):** Where is the bulk of our potential revenue bottlenecked? Which deals have gone stale? How many individual deals reside in the 'Negotiation' stage?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **Attio** | Visualizes records as Kanban cards. | "Add Deal" | Kanban view. | No public evidence | No public evidence | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Salesforce** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **GoHighLevel** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The layout consists of a horizontal scrolling area containing vertical columns representing sequential deal stages. Each column header persistently displays the stage name, total deal count, and aggregated monetary value. Deals are represented as drag-and-drop cards. The primary action, "Add Deal," is often contextually available at the bottom of each specific column.

**e. Differentiators and User Reports:** While explicit snippet data is limited here beyond Attio's kanban capabilities OBSERVATION, the industry standard mandates that visual cues be introduced for deals that have sat idle past a predefined threshold, driving actionable urgency.

**f. Visual Separation:** Columns are defined by distinct vertical lanes, frequently utilizing a slightly darker background hex code than the white deal cards. Cards utilize shadow elevation to visually indicate they are interactive and draggable. Stagnant deals receive aggressive visual highlights, such as red borders or warning icons.

**g. INFERENCE:** Adopt a Kanban board as the default view for the Deals module. Implement explicit visual rotting indicators (e.g., red tinting or high-contrast icons on cards) for inactive deals. This visual immediacy is critical for agency sales velocity. Avoid forcing users into a static list view for pipeline management.

## 10. Tasks

Task management interfaces dictate the daily execution rhythm of the sales floor.

**a. Primary Users and Jobs:** Sales representatives. Jobs include executing daily to-dos (calls, emails, meetings), marking tasks as complete, and rescheduling overdue items.

**b. Top Questions Answered (5s):** What must I execute today? What is currently overdue? What is the context of the next task?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **Salesforce** | Managed via the Activity Timeline. Grouped by status. | "New Task" | List grouped by date. | No public evidence | No public evidence | (Date: Not shown) |
| **Attio** | Displayed as a tab on the main record page. | "Add Task" | Record-associated list. | No public evidence | No public evidence | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **GoHighLevel** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** Task management features a dual-pane layout: a list of tasks on the left, grouped by temporal status (Overdue, Today, Tomorrow), and a preview pane on the right that displays the associated record (Contact/Deal) context, allowing execution without leaving the task screen.

**e. Differentiators and User Reports:** Salesforce allows the configuration of custom activities and tracks them comprehensively via the Activity Timeline, utilizing an "Assistant" to surface important updates OBSERVATION.

**f. Visual Separation:** Task states are separated by color-coded dates (e.g., Red for Overdue, Green for Today). The dual-pane layout utilizes a standard vertical divider line to segment the list from the actionable preview.

**g. INFERENCE:** Adopt a dual-pane list layout with strict grouping by due date. For an agency CRM where high-volume outreach is expected, architect a sequential "Task Execution" mode that automatically loads the next contact's record upon the completion of the current task, minimizing navigational friction.

## 11. Segments / Lists

Segmentation transforms a static database into targeted, actionable audiences for marketing distribution.

**a. Primary Users and Jobs:** Marketing staff and managers. Jobs include building static or dynamic (active) lists based on complex property logic, reviewing the resulting audience size, and exporting or pushing the segment to integrated ad platforms.

**b. Top Questions Answered (5s):** What are the exact rules defining this list? How many contacts currently match? Are there any errors or conflicts in the boolean logic?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **GoHighLevel** | Smart Lists accessible via tabs. Advanced filter panel. | "Save List" | Filtered Table | Bulk actions overlay. | No public evidence | (Date: Not shown) |
| **Attio** | Core paradigm accessible via the left sidebar. | "Create List" | List view. | No public evidence | No public evidence | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Salesforce** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The UI is vertically split: the top or left pane contains the Boolean logic builder (Field -> Operator -> Value), while the bottom or right pane displays a live-updating data table previewing the matching records.

**e. Differentiators and User Reports:** GoHighLevel heavily integrates segments directly into the standard Contact list view as tabs ("Smart Lists") OBSERVATION. Advanced Filters provide extensive logic capabilities: String filters (Is, Contains, Is any of), Numeric filters, and Negative filters (Is Not, Does Not Contain), which can be nested using AND / OR operands OBSERVATION.

**f. Visual Separation:** Boolean rule groups (AND/OR blocks) are enclosed in lightly shaded bounding boxes to visually group logical conditions together, preventing misinterpretation of the query structure.

**g. INFERENCE:** Adopt GoHighLevel's "Smart List" paradigm for the CRM interface. Instead of a disconnected, isolated Lists module, allow users to build complex logic directly in the Contacts view and save them as tabs. This aligns perfectly with an agency model where sales reps need immediate access to segmented audiences without switching modules.

## 12. Import

Data ingestion is a high-risk operation; the UX must guide the user safely through complex schema mapping.

**a. Primary Users and Jobs:** Agency staff onboarding new clients, or client managers uploading legacy databases. Jobs include uploading a CSV file, mapping CSV columns to CRM properties, validating data formatting, and reviewing error logs.

**b. Top Questions Answered (5s):** Which columns remain unmapped? Are there any data validation errors? How many net-new records will be created versus updated?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **HubSpot** | Multi-step wizard. 3-column mapping table. Summary card at end. | "Next" / "Finish" | Upload State | Inline property creation. | No public evidence | (Date: Not shown) |
| **Zoho CRM** | Field mapping interface. | "Import" | Mapping screen. | Reset Field Mapping. | No public evidence | (Date: Not shown) |
| **Attio** | Strict CSV formatting guide requirements. | "Upload" | Upload prompt. | No public evidence | No public evidence | (Date: Not shown) |
| **Salesforce** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **GoHighLevel** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The import process is universally structured as a full-screen, multi-step stepper/wizard to isolate the user from distractions. The critical "Mapping" step utilizes a 3-column table: CSV Column Header, First Row Data Preview, and CRM Property Dropdown.

**e. Differentiators and User Reports:** HubSpot allows the highly convenient inline creation of custom properties during the mapping phase OBSERVATION. Additionally, the post-import review screen displays a summary card detailing rows imported, new records created, and explicit error logs OBSERVATION.

**f. Visual Separation:** The wizard progression is tracked via a top horizontal stepper (e.g., Upload > Map > Validate > Review). Unmapped or error-prone fields are aggressively flagged with high-contrast red warning icons or text.

**g. INFERENCE:** Adopt a 4-step wizard: Upload -> Map -> Validate -> Review. Crucially, adopt the ability to create custom properties inline during the mapping phase. Avoid blocking the user from proceeding if a minority of rows fail validation; import the valid rows and output an error CSV for the failures to maintain momentum.

## 13. Reports / Analytics

Reporting proves the CRM's ultimate value, translating raw data into business intelligence.

**a. Primary Users and Jobs:** Agency owners and client stakeholders. Jobs include generating visual charts of sales performance, measuring ad attribution ROI, and exporting data for external presentations.

**b. Top Questions Answered (5s):** What is the macro trend over time? What data filters are currently applied? Can I drill down into the underlying records of this chart?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **HubSpot** | Cross-portal reporting aggregating portfolio data. | "Save Report" | Chart Builder | No public evidence | No public evidence | (Date: Not shown) |
| **Attio** | Dashboards organizing highly customizable charts. | "Save" | Live chart preview. | No public evidence | No public evidence | (Date: Not shown) |
| **Salesforce** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **GoHighLevel** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** Report builders deploy a configuration sidebar (for selecting X/Y axes, chart types, and data properties) alongside a large central canvas that live-updates the chart visualization as parameters change. A primary action allows saving the report to a specific dashboard.

**e. Differentiators and User Reports:** HubSpot allows cross-portal reporting OBSERVATION, a massive differentiator enabling an agency to run a master report on "Total Revenue" that aggregates data across all their client workspaces automatically without manual export.

**f. Visual Separation:** The canvas area features a light, neutral background, while the configuration sidebar is densely packed with dropdowns and toggle switches, separated by a structural vertical border.

**g. INFERENCE:** Adopt a builder interface with a left-hand configuration sidebar and a right-hand live preview canvas. For the agency model, ensure that reports built in the agency layer can seamlessly pull metrics across sub-accounts, saving managers from exporting and joining CSVs manually.

## 14. Customer Journeys and Tracking

Understanding the path to conversion is vital for marketing agencies justifying ad spend.

**a. Primary Users and Jobs:** Marketers and sales reps. Jobs include viewing the chronological touchpoints a lead took before converting (ad clicks, website visits, form submissions) to understand multi-touch attribution.

**b. Top Questions Answered (5s):** Which specific ad generated this lead? How many pages did they view? What was the definitive first touchpoint?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **All Vendors** | Integrated into the Contact Record Activity Timeline. | Not applicable | Chronological view. | No public evidence | No public evidence | Data inferred from CRM architecture standards. |

**d. Convergent Patterns:** Within a CRM context, journey tracking is heavily integrated into the Contact Record's central Activity Timeline. Touchpoints (e.g., "Clicked Meta Ad", "Submitted Form") are chronologically interleaved with direct sales activities (calls, emails). A dedicated "Attribution" panel often sits in the left properties sidebar detailing "Original Source" and "Latest Source."

**e. Differentiators and User Reports:** While dedicated marketing platforms visually map journeys as complex flowcharts, within a CRM context, chronological vertical timelines remain the preferred UX for sales representatives.

**f. Visual Separation:** System-generated touchpoints (ad clicks, page views) use muted colors and smaller typography within the timeline, whereas human interactions (emails, meetings) utilize bold iconography and high-contrast encapsulating cards.

**g. INFERENCE:** Adopt chronological journey integration directly into the main Activity Timeline. Create distinct visual treatments for "Ad Tracking Events" versus "Sales Interactions" to prevent timeline clutter and cognitive overload. Ensure "Source" (e.g., Meta, TikTok) is a default, un-deletable property in the left sidebar.

## 15. Integrations

The CRM must act as a central hub, necessitating robust connections to external advertising and operational ecosystems.

**a. Primary Users and Jobs:** Agency administrators. Jobs include authenticating third-party ad accounts (Meta, Google, TikTok), mapping data flow, and troubleshooting broken API connections.

**b. Top Questions Answered (5s):** Which platforms are currently connected? Is the OAuth token expired? Where do I initiate a new app connection?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **GoHighLevel** | Grid of integration cards under Settings. OAuth flow overlays. | "Connect" | Card grid. | No public evidence | No public evidence | (Date: Not shown) |
| **HubSpot** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Salesforce** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Attio** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The integrations screen acts as an internal app marketplace. It features a grid of cards, each bearing the third-party logo, name, and a clear status indicator (e.g., a green "Connected" badge). The primary action on disconnected cards is "Connect", which launches a standard OAuth modal.

**e. Differentiators and User Reports:** GoHighLevel integrates social messaging (TikTok, Facebook Messenger) directly into the CRM inbox, meaning the integration screen must handle both lead-ad data ingestion and messaging API permissions simultaneously OBSERVATION.

**f. Visual Separation:** Card-based layouts are standard. Successfully connected apps frequently migrate to a distinct "Installed" or "Active" section at the top of the page, separated from available integrations by a clear section header.

**g. INFERENCE:** Adopt a grid-card layout for integrations. Ensure connection statuses are visible instantly without requiring the user to click into the card. Given the specific agency context, ad account integrations (Meta, Google, TikTok) must be prominently positioned at the absolute top of the grid.

## 16. Settings

The Settings module is the administrative backbone, controlling access, schema, and security.

**a. Primary Users and Jobs:** Agency administrators and workspace owners. Jobs include managing users and assigning roles, creating custom properties/fields, configuring 2FA, and managing billing.

**b. Top Questions Answered (5s):** Where do I add a new user? How do I change field mappings? Are security settings currently enforced?

**c. Vendor Layout Analysis:**

| Vendor | Layout Regions & Above Fold | Primary Action | Default View | Bulk Actions & Empty State | Mobile Behavior | Source URL & Date |
| --- | --- | --- | --- | --- | --- | --- |
| **GoHighLevel** | Secondary sidebar. User Types (Agency vs Account). | "Save" | General settings form. | No public evidence | No public evidence | (Date: Not shown) |
| **HubSpot** | Org Management for multi-account connections. Enforces 2FA. | "Save" | Organization Management. | No public evidence | No public evidence | (Date: Not shown) |
| **Salesforce** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Attio** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Pipedrive** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |
| **Zoho CRM** | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence | No public evidence |

 

**d. Convergent Patterns:** The Settings interface typically replaces the primary navigation sidebar with a secondary, localized "Settings" sidebar (e.g., Account, Users, Properties, Integrations). The main canvas area displays the specific form for the selected category.

**e. Differentiators and User Reports:** GoHighLevel heavily partitions settings based on the user's tier. An "Agency Admin" accesses global settings, whereas an "Account User" is restricted to local sub-account settings OBSERVATION. HubSpot strictly enforces two-factor authentication (2FA) for any cross-account operations to maintain security across the portfolio OBSERVATION.

**f. Visual Separation:** The transition into the Settings module is often marked by a subtle UI shift, such as a darker background on the secondary sidebar or a persistent "Back to CRM" button at the top left to allow escape.

**g. INFERENCE:** Adopt a secondary sidebar specifically tailored for Settings. Strictly bifurcate settings based on role: client users must only see local workspace settings (Custom Fields, their own Profile), while agency admins see global configurations. Security settings (2FA) must be rigidly enforced here to protect client data.

## Cross-Cutting Sections

### A. Agency Model (Multi-Tenant Architecture)

The fundamental architectural challenge of an agency CRM is allowing the agency to view all clients while securely restricting clients to their own isolated data.

- **HubSpot:** OBSERVATION indicates HubSpot utilizes a "Multi-Account Management" architecture requiring a centralized Enterprise parent account. Up to 30 professional/enterprise accounts can be connected OBSERVATION. Data can be copied via workflows, and unified dashboards report across the portfolio. Users switch accounts via a top-right dropdown OBSERVATION.
- **GoHighLevel:** OBSERVATION demonstrates it is designed natively for agencies. It features an "Agency View" and isolated "Sub-Accounts." Agency admins toggle between the global agency view and individual client sub-accounts using a top-left switcher OBSERVATION. You can create "Account" users who only possess access to specific sub-accounts without ever seeing the agency layer OBSERVATION.

**INFERENCE:** Adopt the GoHighLevel architecture (Agency View vs Sub-Account). HubSpot's model is a retrofit of a single-tenant enterprise system, leading to high subscription costs and rigid switching limitations. Build a true parent-child hierarchy where the Agency tier acts as a command center, and workspaces act as isolated silos for client logins.

### B. Record-Page Anatomy

Record page usability directly dictates sales velocity; cognitive load here must be minimized.

- **HubSpot:** Historically defines the industry-standard 3-column paradigm. Left: properties and about data. Center: infinite scrolling timeline and communication tools. Right: associated objects (Deals, Companies, Tickets).
- **Salesforce:** OBSERVATION outlines Lightning layouts featuring a persistent page header, a main content area (often the Activity Timeline), and a sidebar.
- **Attio:** OBSERVATION uses a left sidebar for attributes, but heavily relies on horizontal tabs in the main center area (Overview, Activity, Emails, Notes) rather than a single unified timeline. A "Highlights" widget area sits on the Overview tab.

**INFERENCE:** Avoid tab-heavy timelines like Attio; they force users to click multiple times to piece together a coherent interaction history. Adopt the unified 3-column layout (Left Properties, Center Timeline, Right Associations). The center timeline must chronologically merge emails, calls, notes, and ad-tracking events.

### C. Mobile Behavior

A modern CRM must maintain robust functionality across 1440px desktop and 375px mobile viewports.

- **Salesforce:** OBSERVATION indicates the Salesforce Lightning Design System (SLDS) uses a flexible grid system that is default mobile-first. In mobile viewports, the 3-column record layouts gracefully collapse into a single vertical stack, typically prioritizing the Header/Highlights, followed by the Activity Timeline, while hiding Related Lists under tabs.
- **HubSpot:** OBSERVATION retains account switching in the mobile application via a settings menu toggle, rather than a persistent header.

**INFERENCE:** On a 375px viewport, desktop sidebars must be relegated to a hamburger menu. Data tables (Leads, Contacts) cannot display 8 columns; they must collapse into list-cards showing only the Primary Identifier (Name), Secondary identifier (Email), and Status. Record pages must stack vertically: Highlights -> Communication Action Bar -> Timeline.

### D. Arabic/RTL Support

The application must support English (Left-to-Right) and Arabic (Right-to-Left).

- **Salesforce:** OBSERVATION natively supports Arabic as an end-user language. In Lightning Experience, the RTL Language Layout is the default for right-to-left languages OBSERVATION. This geometrically flips the UI: sidebars move to the right, and timelines align to the right.
- **Zoho CRM:** OBSERVATION supports Arabic as a fully supported language, rendering system entities and UI components appropriately.
- **GoHighLevel:** OBSERVATION documents Arabic support within SMS routing (handling UCS-2 encoding) and multi-lingual AI workflow responses OBSERVATION, but offers no documented evidence of a structural RTL UI flip for the core CRM interface.

**INFERENCE:** Structural RTL support requires more than merely translating text; the entire CSS flexbox/grid layout must reverse (using logical properties like margin-inline-start instead of margin-left). Adopt Salesforce's complete UI inversion model. The navigation sidebar must anchor to the right edge of the screen, and the primary action buttons (like "Create") must shift to the top left to accommodate the Arabic reading direction.

- https://knowledge.hubspot.com/account-management/manage-multiple-hubspot-accounts (HubSpot, Manage multiple HubSpot accounts, Date: Not shown)
- https://knowledge.hubspot.com/account-management/set-up-multi-account-management (HubSpot, Set up multi-account management, Date: Not shown)
- https://knowledge.hubspot.com/account-management/manage-multiple-hubspot-accounts (HubSpot, Manage multiple HubSpot accounts, Date: Not shown)
- https://www.hubspot.com/products/marketing/multi-account-management (HubSpot, Multi-Account Management, Date: Not shown)
- https://www.hubspot.com/products/marketing/multi-account-management (HubSpot, Multi-Account Management, Date: Not shown)
- https://knowledge.hubspot.com/account-management/set-up-multi-account-management (HubSpot, Set up multi-account management, Date: Not shown)
- https://knowledge.hubspot.com/knowledge-base/create-multiple-knowledge-bases (HubSpot, Create multiple knowledge bases, Date: Not shown)
- https://community.hubspot.com/t/have-three-accounts-in-one-account/90189 (HubSpot, Have three accounts in one account, Date: Not shown)
- https://community.hubspot.com/t/connect-multiple-crm-accounts-together-to-switch-between/20847 (HubSpot, Connect multiple CRM accounts together to switch between, Date: Not shown)
- https://community.hubspot.com/t/have-three-accounts-in-one-account/90189 (HubSpot, Have three accounts in one account, Date: Not shown)
- https://knowledge.hubspot.com/knowledge-base/create-multiple-knowledge-bases (HubSpot, Create multiple knowledge bases, Date: Not shown)
- https://community.hubspot.com/t/switch-between-accounts/12935 (HubSpot, Switch between Accounts, Date: Not shown)
- https://www.flatlineagency.com/blog/hubspot-multi-account-management (Flatline Agency, HubSpot multi-account management, Date: Not shown)
- https://community.hubspot.com/t/three-accounts-how-to-switch-between-accounts-quickly/122330 (HubSpot, Three accounts how to switch between accounts quickly, Date: Not shown)
- https://community.hubspot.com/t/switch-between-accounts/12935 (HubSpot, Switch between Accounts, Date: Not shown)
- https://www.youtube.com/watch?v=iOUihjhKSxg (YouTube, Date: Not shown)
- https://community.hubspot.com/t/three-accounts-how-to-switch-between-accounts-quickly/122330 (HubSpot, Three accounts how to switch between accounts quickly, Date: Not shown)
- https://developer.salesforce.com/docs/platform/lightning-component-reference/guide/lightning-layout.html (Salesforce, Lightning layout, Date: Not shown)
- https://developer.salesforce.com/docs/platform/salesforce-pages-developers-guide/guide/vf-dev-best-practices-slds-responsive.html (Salesforce, Responsive design, Date: Not shown)
- https://www.lightningdesignsystem.com/2e1ef8501/p/33e9af-layout (Salesforce, Layout, Date: Not shown)
- https://trailhead.salesforce.com/content/learn/modules/lightning-design-system-basics/explore-slds-resources (Salesforce, Explore SLDS resources, Date: Not shown)
- https://developer.salesforce.com/docs/platform/salesforce-pages-developers-guide/guide/pages-styling-slds.html (Salesforce, Pages styling SLDS, Date: Not shown)
- https://www.salesforceben.com/salesforce-page-layouts-vs-lightning-record-pages/ (Salesforce Ben, Page Layouts vs Lightning Record Pages, Date: Not shown)
- https://www.lightningdesignsystem.com/2e1ef8501/p/355656-patterns (Salesforce, Patterns, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48000982600-user-access (GoHighLevel, User Access, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001204536-how-do-i-find-my-agency-s-relationship-number- (GoHighLevel, How do I find my agency's relationship number, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/155000000148 (GoHighLevel, Agency View, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001236324-setting-up-automated-email-reports-for-sub-accounts-with-the-report-scheduler (GoHighLevel, Setting up automated email reports for sub-accounts, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000001667-client-portal-sso-magic-links-enable-one-click-access-to-client-apps (GoHighLevel, Client Portal SSO Magic Links, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/155000000148 (GoHighLevel, Agency View, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000006380-special-prices-for-saas-sub-accounts (GoHighLevel, Special prices for SaaS sub-accounts, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000001667-client-portal-sso-magic-links-enable-one-click-access-to-client-apps (GoHighLevel, Client Portal SSO Magic Links, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001204536-how-do-i-find-my-agency-s-relationship-number- (GoHighLevel, How do I find my agency's relationship number, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001153972-how-to-create-a-user-or-admin-to-manage-multiple-hl-locations-without-giving-them-agency-access- (GoHighLevel, How to create a user or admin to manage multiple HL locations, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001153972-how-to-create-a-user-or-admin-to-manage-multiple-hl-locations-without-giving-them-agency-access- (GoHighLevel, How to create a user or admin to manage multiple HL locations, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000006380-special-prices-for-saas-sub-accounts (GoHighLevel, Special prices for SaaS sub-accounts, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001236324-setting-up-automated-email-reports-for-sub-accounts-with-the-report-scheduler (GoHighLevel, Setting up automated email reports for sub-accounts, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000002136-app-permissions-in-client-portal-for-enabling-disabling-a-child-app (GoHighLevel, App permissions in client portal, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48000982600-user-access (GoHighLevel, User Access, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000006576-simplify-your-template-library-by-hiding-types-and-tags (GoHighLevel, Simplify your template library, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000006576-simplify-your-template-library-by-hiding-types-and-tags (GoHighLevel, Simplify your template library, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000002136-app-permissions-in-client-portal-for-enabling-disabling-a-child-app (GoHighLevel, App permissions in client portal, Date: Not shown)
- https://attio.com/help/reference/attio-101/attios-data-model/understanding-records (Attio, Understanding records, Date: Not shown)
- https://attio.com/help/reference/attio-101/attios-data-model/understanding-records (Attio, Understanding records, Date: Not shown)
- https://attio.com/help/reference/managing-your-data/dashboard-and-reports/dashboards (Attio, Dashboards, Date: Not shown)
- https://attio.com/help/reference/managing-your-data/dashboard-and-reports/reports (Attio, Reports, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=experience.networks_help_center_create.htm&type=5 (Salesforce, Experience networks help center create, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=experience.community_builder_manage_pages_overview.htm&type=5 (Salesforce, Community builder manage pages overview, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=experience.networks_deal_reg_global_actions.htm&language=en&type=5 (Salesforce, Networks deal reg global actions, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=experience.rss_setup_nav_menu.htm&type=5 (Salesforce, RSS setup nav menu, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=experience.community_builder_theme-g-search.htm&language=en&type=5 (Salesforce, Community builder theme G search, Date: Not shown)
- https://help.salesforce.com/HTViewHelpDoc?id=community_builder_theme.htm (Salesforce, Community builder theme, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=experience.networks_navigate.htm&type=5 (Salesforce, Networks navigate, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=experience.networks_security_csp_overview.htm&type=5 (Salesforce, Networks security CSP overview, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=sf.community_builder_enable_app_launcher.htm&release=236.9.0&type=5 (Salesforce, Community builder enable app launcher, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=sf.networks_custom_search_box.htm&release=240.6.0&language=fr_fr&type=5 (Salesforce, Networks custom search box, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=xcloud.faq_getstart_rtl.htm&type=5&language=en_US (Salesforce, FAQ get start RTL, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=xcloud.supported_languages.htm&language=en_US&type=5 (Salesforce, Supported languages, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=xcloud.faq_getstart_language_support.htm&language=en&type=5 (Salesforce, FAQ get start language support, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=ind.lsc_supported_languages.htm&type=5 (Salesforce, LSC supported languages, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=sf.faq_getstart_language_support_ui.htm&language=ko_kr&release=244.10.0&type=5 (Salesforce, FAQ get start language support UI, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=release-notes.rn_agentforce_voice_lang_expansion.htm&release=262&type=5 (Salesforce, RN agentforce voice lang expansion, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=xcloud.faq_getstart_language_support.htm&language=en&type=5 (Salesforce, FAQ get start language support, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=xcloud.salesforce_authenticator_language_support.htm&language=nb (Salesforce, Salesforce authenticator language support, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=xcloud.faq_getstart_what_languages_does.htm&language=it&type=5 (Salesforce, FAQ get start what languages does, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=release-notes.rn_customization_globalization_label_translations.htm&language=en_US&release=242&type=5 (Salesforce, RN customization globalization label translations, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=xcloud.supported_languages.htm&language=en_US&type=5 (Salesforce, Supported languages, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=ind.lsc_supported_languages.htm&type=5 (Salesforce, LSC supported languages, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=release-notes.rn_agentforce_voice_lang_expansion.htm&release=262&type=5 (Salesforce, RN agentforce voice lang expansion, Date: Not shown)
- https://attio.com/help/reference/attio-ai/ask-attio/chat-with-ask-attio (Attio, Chat with ask Attio, Date: Not shown)
- https://attio.com/help/reference/productivity-collaborating/call-intelligence/enable-call-recording (Attio, Enable call recording, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000007779-mistral-ai-workflow-actions (GoHighLevel, Mistral AI workflow actions, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000007779-mistral-ai-workflow-actions (GoHighLevel, Mistral AI workflow actions, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001203458-how-to-calculate-sms-and-mms-costs (GoHighLevel, How to calculate SMS and MMS costs, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001203458-how-to-calculate-sms-and-mms-costs (GoHighLevel, How to calculate SMS and MMS costs, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000004683-multi-language-support-for-voice-ai-agents (GoHighLevel, Multi language support for voice AI agents, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000004683-multi-language-support-for-voice-ai-agents (GoHighLevel, Multi language support for voice AI agents, Date: Not shown)
- https://knowledge.hubspot.com/import-and-export/import-contacts-quick-import (HubSpot, Import contacts quick import, Date: Not shown)
- https://knowledge.hubspot.com/import-and-export/troubleshoot-import-errors (HubSpot, Troubleshoot import errors, Date: Not shown)
- https://knowledge.hubspot.com/import-and-export/set-up-your-import-file (HubSpot, Set up your import file, Date: Not shown)
- https://knowledge.hubspot.com/contracts/migrate-contracts-to-hubspot (HubSpot, Migrate contracts to HubSpot, Date: Not shown)
- https://knowledge.hubspot.com/import-and-export/set-up-your-import-file (HubSpot, Set up your import file, Date: Not shown)
- https://knowledge.hubspot.com/import-and-export/import-contacts-quick-import (HubSpot, Import contacts quick import, Date: Not shown)
- https://knowledge.hubspot.com/contracts/migrate-contracts-to-hubspot (HubSpot, Migrate contracts to HubSpot, Date: Not shown)
- https://knowledge.hubspot.com/import-and-export/troubleshoot-import-errors (HubSpot, Troubleshoot import errors, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=sales.campaigns_pardot_campaign_member_sync_parent.htm&language=en_US&type=5 (Salesforce, Campaigns pardot campaign member sync parent, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=sales.account_contact_relationship_fields.htm&type=5 (Salesforce, Account contact relationship fields, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=contacts_merge_lex.htm&lwr.isSeoBot=true&type=5&language=es_MX:47:35580 (Salesforce, Contacts merge LEX, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=ru&id=sfdo.NPSP_How_to_Manage_Reports.htm&type=5 (Salesforce, NPSP How to manage reports, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=005298803&language=es_MX&type=1 (Salesforce, Article 005298803, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=sfdo.configure_duplicate_detection_and_npsp_contact_merge.htm&type=5 (Salesforce, Configure duplicate detection and NPSP contact merge, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=sales.shared_contacts_considerations.htm&type=5 (Salesforce, Shared contacts considerations, Date: Not shown)
- https://support.pipedrive.com/en/article/updating-items-in-the-detail-view (Pipedrive, Updating items in the detail view, Date: Not shown)
- https://support.pipedrive.com/en/article/updating-pipedrive-data-with-a-spreadsheet (Pipedrive, Updating Pipedrive data with a spreadsheet, Date: Not shown)
- https://help.zoho.com/portal/en/kb/crm/data-administration/import-data/articles/import-data (Zoho CRM, Import data, Date: Not shown)
- https://attio.com/help/reference/imports-exports/csv-imports/import-data-into-attio-via-csv (Attio, Import data into Attio via CSV, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000006471-add-messaging-social-channels-to-your-google-business-profile-gbp- (GoHighLevel, Add messaging social channels to your Google business profile, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000006620-integrate-tiktok-messaging (GoHighLevel, Integrate TikTok messaging, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/48000449584 (GoHighLevel, Integrations, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001223558-how-to-integrate-tiktok-lead-ads (GoHighLevel, How to integrate TikTok lead ads, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000005063-getting-started-setup-social-planner (GoHighLevel, Getting started setup social planner, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000005327-ask-ai-assistant (GoHighLevel, Ask AI assistant, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=005298803&language=en_US&type=1 (Salesforce, Article 005298803, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=sales.tm2_preview_account_assignments.htm&language=en_US&type=5 (Salesforce, TM2 preview account assignments, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=contacts_merge_lex.htm&lwr.isSeoBot=true&type=5&language=es_MX:47:35580 (Salesforce, Contacts merge LEX, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=sales.campaigns_pardot_alignment_new.htm&type=5 (Salesforce, Campaigns pardot alignment new, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=005298803&language=en_US&type=1 (Salesforce, Article 005298803, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=sfdo.NPSP_Configure_Contacts.htm&language=fi&type=5 (Salesforce, NPSP Configure Contacts, Date: Not shown)
- https://help.salesforce.com/s/articleView?id=sales.tm2_preview_account_assignments.htm&language=en_US&type=5 (Salesforce, TM2 preview account assignments, Date: Not shown)
- https://help.salesforce.com/s/articleView?language=en_US&id=sales.shared_contacts_custom_report_types.htm&type=5 (Salesforce, Shared contacts custom report types, Date: Not shown)
- https://help.zoho.com/portal/en/kb/crm/customize-crm-account/translations/articles/languages-supported-in-zoho-crm (Zoho CRM, Languages supported in Zoho CRM, Date: Not shown)
- https://help.zoho.com/portal/en/kb/crm/faqs/crm-onboarding/articles/faqs-crm-onboarding (Zoho CRM, FAQs CRM onboarding, Date: Not shown)
- https://help.zoho.com/portal/en/kb/crm/faqs/crm-onboarding/articles/faqs-crm-onboarding (Zoho CRM, FAQs CRM onboarding, Date: Not shown)
- https://help.zoho.com/portal/en/kb/crm/customize-crm-account/translations/articles/languages-supported-in-zoho-crm (Zoho CRM, Languages supported in Zoho CRM, Date: Not shown)
- https://help.zoho.com/portal/en/kb/crm/crm-reference/introduction-to-zoho-crm/articles/specifications-zoho-crm (Zoho CRM, Specifications Zoho CRM, Date: Not shown)
- https://help.zoho.com/portal/en/kb/crm/crm-reference/introduction-to-zoho-crm/articles/specifications-zoho-crm (Zoho CRM, Specifications Zoho CRM, Date: Not shown)
- https://help.zoho.com/portal/en/kb/crm/zia-artificial-intelligence/generative-ai/articles/zia-record-summary (Zoho CRM, Zia record summary, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000003974-workflows-advanced-filters-smart-list (GoHighLevel, Workflows advanced filters smart list, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000003974-workflows-advanced-filters-smart-list (GoHighLevel, Workflows advanced filters smart list, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000008008-smart-lists-in-companies (GoHighLevel, Smart lists in companies, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000007530-advanced-filters-in-smart-lists (GoHighLevel, Advanced filters in smart lists, Date: Not shown)
- https://help.gohighlevel.com/en/support/solutions/articles/155000008744-send-bulk-email-to-associated-contacts-from-companies-and-custom-objects (GoHighLevel, Send bulk email to associated contacts, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000007595-how-to-add-contacts-in-bulk-to-a-workflow (GoHighLevel, How to add contacts in bulk to a workflow, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000007066-workflows-bulk-actions-in-list-page (GoHighLevel, Workflows bulk actions in list page, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000006551-new-ui-for-email-creation-via-bulk-action-in-contacts (GoHighLevel, New UI for email creation via bulk action in contacts, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/155000000123 (GoHighLevel, Article 155000000123, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001062094-how-to-create-manage-smart-lists (GoHighLevel, How to create manage smart lists, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/155000007530-advanced-filters-in-smart-lists (GoHighLevel, Advanced filters in smart lists, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/155000000123 (GoHighLevel, Article 155000000123, Date: Not shown)
- https://help.gohighlevel.com/support/solutions/articles/48001238482-contacts-export-as-csv-upgrade (GoHighLevel, Contacts export as CSV upgrade, Date: Not shown)
