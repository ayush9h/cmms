<div align="center">

# OMR Bagla CMMS

**A maintenance and production platform for OMR Bagla Automotive Systems: breakdown logging, rejection tracking, OEE measurement, and reliability analytics.**

[![Status](https://img.shields.io/badge/Status-Work%20in%20Progress-orange)](#project-status)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.162-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

[Report an Issue](https://github.com/ayush9h/cmms/issues)

</div>

> [!WARNING]
> **Work in progress.** This platform is under active development and is not yet ready for production use. Calculations, data models, and screens are still changing, and database migrations may reshape existing records.

## Overview

OMR Bagla CMMS is a computerised maintenance management system for a die-casting and machining plant. Shop-floor teams log machine stoppages and shift production against the asset register; managers see downtime, repair-time breakdown, rejection causes, and Overall Equipment Effectiveness without maintaining spreadsheets.

The platform pairs a Next.js App Router interface with a FastAPI service. Records live in PostgreSQL; the API keeps them in pandas frames so dashboards, filters, and exports are served without repeated round trips to the database.

## Key Features

- **Reliability dashboard** showing downtime, breakdown count, MTTR, and MTBF with month-on-month movement.
- **Breakdown logging** capturing shift, category, problem, action taken, and time split across diagnosis, spares wait, and wrench time.
- **Production and rejection logging** with quantities attributed to six rejection causes, defect type, and scrap or rework disposition.
- **OEE measurement** per logged shift, with Day, Month, and Shift views and a drill-down from any bar.
- **PPC entry** defining shift length, breaks, running calendar, and ideal run rate for each machine.
- **Asset register** holding installation date, class, application, OEM, and ideal run rate, restricted to managers.
- **Editable records** so a logged breakdown or production entry can be corrected after the fact.
- **Excel and PowerPoint exports** for breakdown logs, production logs, and the reliability review deck.
- **Multi-value filtering** across shop, machine, category, month, and shift, with server-side pagination.
- **Session authentication** with signed cookies, per-account lockout after repeated failures, and manager-only routes.
- **Light and dark themes** driven by CSS custom properties, with a collapsible navigation rail.


## Technology Stack

| Layer | Technologies |
| --- | --- |
| Frontend | Next.js 16 App Router, React 19, Tailwind CSS 4, Recharts, Lucide |
| Authentication | Signed JWT session cookies, role-based access |
| Backend | FastAPI, Uvicorn, Pydantic |
| Analytics | pandas in-memory frames |
| Relational database | PostgreSQL (Aiven), SQLModel, SQLAlchemy async, Alembic |
| Exports | openpyxl, python-pptx |
| Tooling | npm, pip, Playwright |
| Deployment | Vercel (client), Render (API) |

## OEE Calculation

OEE follows the standard definition, measured for each shift that has production or a breakdown logged against a machine with a PPC entry covering that date.

| Factor | Calculation |
| --- | --- |
| Planned production time | Shift length − (short breaks + meal breaks) |
| Availability | (Planned production time − breakdown minutes) ÷ planned production time |
| Performance | Pieces produced ÷ (planned production time × ideal run rate) |
| Quality | (Pieces produced − rejected pieces) ÷ pieces produced |
| OEE | Availability × Performance × Quality |

Day, month, and shift figures aggregate the shifts logged within them. Shifts with nothing logged are excluded, so an unused planned shift does not depress the result.

## Project Status

Work in progress. Breakdown logging, production and rejection logging, the asset register, the reliability dashboard, OEE, and the export features are implemented and in internal testing. Known gaps:

- No automated test suite; verification is manual and browser-driven.
- No delete action for logged entries, and no screen for editing an existing asset.
- Asset classes and breakdown categories are fixed lists in code.
- Any signed-in user can edit any logged entry.

## License

Proprietary. Copyright © 2026 OMR Bagla Automotive Systems India Ltd. All rights reserved. See [`LICENSE`](LICENSE) for terms.
