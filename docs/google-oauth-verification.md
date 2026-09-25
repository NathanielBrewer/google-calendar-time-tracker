# Google OAuth verification handoff

Prepared September 23, 2026. Local preparation is complete; publication and Google approval are not complete. This is a standalone Apps Script web app, not a Workspace Marketplace add-on. Marketplace registration is not needed for this workflow.

## Prepared files

- `/home/nathaniel/dev/website/src/routes/time-tracker/privacy/+page.svelte`
- `/home/nathaniel/dev/website/src/routes/time-tracker/terms/+page.svelte`
- The website's existing Time Tracker homepage now has a persistent app description, developer identity, policy links, and support contact before the iframe loads.
- This repository's `src/index.html` links to those pages. Its existing invoice-filename correction was preserved.
- The manifest already explicitly limits access to `calendar.readonly` and executes as the visiting user. No broader scopes or execution-identity changes were introduced.

## 1. Review and publish the website

Review the policies, particularly the support address `nathaniel@ncbrewer.ca`, support-data handling, Google Analytics disclosure, and operational-log retention. The address is taken from the existing site's public contact information. Actual Cloud Logging and Analytics retention settings were not accessible from this environment: inspect them before publication and make the published policy more specific if appropriate. The terms describe responsibility for reviewing invoices and service availability.

Deploy the website changes through its normal Netlify release process. The bare domain currently redirects to `www.ncbrewer.ca`, so use the final canonical URLs below in Google's console. Check all three pages in a signed-out/private browser: HTTP 200, readable without login, and links present even when the app cannot authorize. Confirm the privacy/terms routes do not embed the tracker or ask for Calendar access.

Publish the app link changes only after the policy pages are live. Build with `npm run build:prod`, review `dist/prod`, then use the existing Apps Script release process. Update the existing production deployment to a new version to preserve its `/exec` URL; creating a separate deployment requires updating the website's `GCTT_WEB_APP_URL`. Do not deploy development code by mistake. This local build incorporates the pre-existing invoice filename fix as well.

## 2. Inspect the production Apps Script project's Cloud association

**Status, September 25, 2026:** The owner confirmed that production currently uses a default GCP project. Linking a standard project is therefore still required; no Cloud changes have been made by this local preparation.

Open [the production script's settings](https://script.google.com/home/projects/1-n20wIm5xcJuWcTAHmHBMyWotAZxCUS-hC-0yKcsM7U5Lz9sgvVZL8zI/settings). Confirm the actual live deployment belongs to this project before changing anything.

Verification requires a standard project. Reuse an appropriate existing standard production project; otherwise create one you control, configure its consent screen, and link its **project number** in Apps Script settings. Keep development separate. Record the Cloud project ID and number for future maintenance.

Changing the associated Cloud project is consequential: prior grants do not simply transfer, users may need to authorize again, and the default project cannot be restored. Read Google's [Cloud project switching instructions](https://developers.google.com/apps-script/guides/cloud-platform-projects) first. Confirm required APIs in the linked project; this code uses the built-in Calendar service, not an advanced Calendar service or a custom OAuth callback. Do not invent redirect URIs or add unrelated scopes. Apps Script manages the authorization flow; the unused OAuth2 library reference in the manifest is not the verification configuration.

## 3. Prove domain ownership

In [Google Search Console](https://search.google.com/search-console), verify `ncbrewer.ca`, preferably as a domain property using the DNS TXT record Google provides. Use an account that is also an owner or editor of the Cloud project. If already verified with that account, reuse that verification. Add `ncbrewer.ca` as the authorized domain; paths and protocols do not belong in that field.

## 4. Configure Google Auth Platform

Select the production Cloud project in [Google Auth Platform](https://console.cloud.google.com/auth/overview). Exact labels may change; use Branding, Audience, Data Access, and Verification Center.

| Field | Value |
| --- | --- |
| App name | NCBrewer Calendar Event Tracker |
| App homepage | `https://www.ncbrewer.ca/time-tracker` |
| Privacy policy | `https://www.ncbrewer.ca/time-tracker/privacy` |
| Terms of service | `https://www.ncbrewer.ca/time-tracker/terms` |
| Authorized domain | `ncbrewer.ca` |
| User support email | `nathaniel@ncbrewer.ca`, if eligible/selectable for the account; otherwise use a monitored eligible address and align the public contact if needed |
| Developer contact | A monitored address you control |
| Audience | External, for public Google-account users |
| Data access | `https://www.googleapis.com/auth/calendar.readonly` only |

Check the scope classification in the console. Read-only Calendar access is sensitive; no restricted Gmail or Drive scopes are requested by this code. Keep testing users configured while preparing. Set the public release to In production when ready; this setting alone does not remove the unverified warning.

Verify and publish branding as directed by the console, then submit data access for review through Verification Center. Current Google guidance requires published branding before submitting data access. Keep the app name consistent across the homepage, app, and consent screen; if Google requests a branding adjustment, update all three.

### Scope justification to paste

> NCBrewer Calendar Event Tracker lets a signed-in user choose a calendar they own or subscribe to, select a reporting period, and calculate total hours with event detail for invoicing. The app uses Apps Script CalendarApp.getAllCalendars() for the calendar picker and getCalendarById()/getEvents() to read the selected calendar's events. It reads names and identifiers to populate the picker, titles and start/end times for reports and invoices, and descriptions to exclude events marked not billable or don't track. The app does not create, update, or delete events. calendar.readonly is the read-only scope documented for the built-in CalendarApp methods used here. Free/busy access cannot provide event titles or exclusion descriptions. Event-only access does not supply the subscribed-calendar picker through these built-in methods. Invoice fields and PDF/SVG generation are processed in the browser. We do not request write access, Gmail, Drive, or standalone identity scopes.

This justification describes the current implementation, not a claim that no alternative API architecture could use different scopes. If Google asks for narrower REST API scopes, that would require a separately tested API migration.

## 5. Record the demo and submit

Use a test account and synthetic calendar/client data. Make an unlisted YouTube recording in English that shows:

1. The public homepage, privacy/terms links, and how to open the app in a separate tab if the iframe cannot authorize.
2. The actual production OAuth flow, app name, browser address bar/client ID, and read-only Calendar permission. Avoid exposing passwords, recovery codes, or real client data.
3. Selecting a calendar, running a date range, and seeing event details and hour totals. Include a test event excluded by its description.
4. Generating an invoice and downloading it, plus the optional Remember controls and how to clear them.

Supply the recording URL and scope justification in Verification Center. Respond to Google's follow-up emails. Only Google can approve the request; no local code change grants verification.

## 6. Acceptance checks after approval

- Confirm the console reports approved branding and Calendar data access, and public production audience.
- In a fresh account that has never granted access, open the production `/exec` app via the homepage and complete consent. The unverified-app warning should be absent; ordinary Calendar consent is expected.
- Check calendar selection, results, invoice export, Remember controls, policy links, and the embedded/direct-tab flows.
- Google Workspace administrators can still restrict third-party apps. OAuth verification does not remove iframe/cookie issues or a normal Google authorization prompt.

## Data-flow audit behind the policy

| Information | Processing/storage in current source |
| --- | --- |
| Calendar list names and IDs | CalendarApp on Google infrastructure; returned to browser picker |
| Selected calendar events | CalendarApp; descriptions checked for exclusions; titles and times returned with summary |
| Remembered calendar and dates | Browser localStorage, removed by disabling Remember calendar information |
| Invoice/business/client inputs | Browser processing; optional localStorage; files downloaded by user |
| App diagnostics | Structured console.info activity/boolean fields; Google execution metadata and exception logging |
| Website analytics | Existing Google Analytics tag in website `src/routes/__layout.svelte`; no Calendar/invoice payload in iframe messages |
| Parent-frame messages | Readiness, size, and click signals, not event or invoice contents |

Policies describe this working tree. The deployed Apps Script version, Cloud association, scope verification status, provider retention settings, and fresh-account authorization were not inspectable locally. Confirm the deployed source matches this data flow before submission.

## Official references

- [Apps Script OAuth client verification](https://developers.google.com/apps-script/guides/client-verification): standard project and public verified-domain prerequisites.
- [Apps Script Cloud projects](https://developers.google.com/apps-script/guides/cloud-platform-projects): linking and switching projects.
- [OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies): homepage, privacy, production, and least-privilege requirements.
- [Sensitive-scope verification](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification): current branding/data-access submission and demo requirements.
- [CalendarApp reference](https://developers.google.com/apps-script/reference/calendar/calendar-app#getAllCalendars()): supported authorization scopes.
- [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy): disclosures and Limited Use obligations.

## Local validation completed

- Apps Script production build passed (`npm run build:prod`). Node reported the existing missing package module-type warning; it did not fail the build.
- Website `npm run check`: 0 errors and 0 warnings.
- Website production build passed, including Netlify adapter output.
- Headless Chromium checked the homepage, privacy, and terms routes at 390px and 1280px widths: HTTP 200, expected headings, visible policy links, no document horizontal overflow, and no tracker iframe on either policy page. External requests were blocked to verify that the public information remains available without Google authorization. These were local development-server checks, not deployed or authenticated OAuth tests.
- Whitespace checks passed. Changes remain uncommitted in the two local checkouts; no site or Apps Script deployment, Cloud project change, or verification submission was performed.
