# Industrial Test Data Analyzer (PATD)

Modern web-based system for efficient analysis of electric motor testing data. Designed to replace legacy Excel/VBA solutions with real-time monitoring, interactive visualizations, and intelligent alerts.

## Problem Statement

Traditional approach using Excel/VBA for industrial test data analysis presents several critical limitations:
- Manual data extraction requiring 2+ hours daily
- Error-prone human data entry
- Delayed recognition of test failures
- Limited visualization capabilities
- File version control challenges
- No real-time monitoring capabilities

## Solution Overview

PATD provides a comprehensive web application that automates data collection, visualizes results in real-time, and immediately alerts engineers to testing issues - drastically reducing response time and increasing production efficiency.

## Key Features

- **Real-time Monitoring Dashboard** - Instant visibility of production status and test failures
- **Statistical Process Control (SPC)** - Interactive SPC charts for trend analysis and quality control
- **Device Tracking** - Complete visibility of individual devices through the manufacturing process
- **Automated Alerts** - Immediate notification when failures occur
- **Testing Limits Management** - GUI for managing test parameters and limits
- **Responsive Design** - Accessible from any device or workstation
- **Historical Analysis** - Powerful tools for reviewing past test data

## Tech Stack

### Frontend
- **Next.js** - React framework with SSR capabilities
- **React** - UI component library
- **TypeScript** - Type-safe JavaScript
- **Shadcn/UI** - Component library for consistent design
- **Recharts & uPlot** - Data visualization libraries

### Backend
- **PocketBase** - Backend solution with integrated database and real-time API
- **SQLite** - Embedded database for data storage
- **Server-Sent Events (SSE)** - For real-time updates

### Infrastructure
- **Docker** - Containerization for consistent deployment
- **Caddy** - Web server and reverse proxy
- **Git/GitHub** - Version control

## Architecture

The application follows a client-server architecture with clear separation of concerns:

```
- components/
  - dashboard/
    - DashboardOverview.client.tsx  # Client component for interactivity
    - DashboardOverview.server.tsx  # Server component for data fetching
    - index.ts                      # Export component
    - types.ts                      # Type definitions
```

Data flow is optimized using:
- Server components for data fetching
- Client components for interactivity and visualization
- Server-Sent Events for real-time updates
- Selective revalidation for efficient cache management

## Performance Metrics

| Metric | Before PATD | After PATD | Improvement |
|--------|-------------|------------|-------------|
| Failure detection time | 15 minutes | <5 seconds | >99% |
| Average response time | 8-10 minutes | ~2 minutes | 75-80% |
| SPC graph creation | ~2 hours | <5 seconds | 99% |
| Test failure analysis | ~15 minutes | ~5 minutes | 67% |
| Overall test success rate | 82% | 91% | +9% |
| Monthly production | Baseline | 112% | +12% |

## Getting Started

### Prerequisites
- Node.js 18+
- Docker and Docker Compose
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/LControl-code/PATD_Maturita_2025.git
cd PATD_Maturita_2025

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

### Production Deployment

The application is designed for deployment in a local industrial network:

```bash
# Build and start containers
docker-compose up -d

# Access the application at http://localhost:3000
```

## Development

### Project Structure
```
├── components/         # React components
│   ├── dashboard/      # Dashboard components
│   ├── device/         # Device tracking components
│   └── spc/            # SPC visualization components
├── pages/              # Next.js pages
├── public/             # Static assets
├── styles/             # CSS styles
├── utils/              # Utility functions
└── docker/             # Docker configuration
```

### Key Components

- **LiveErrors** - Real-time monitor for test failures
- **SPC Graph** - Statistical Process Control visualization
- **DeviceTracking** - Individual device monitoring
- **LimitsEditor** - Testing limit management interface

## Future Development

Planned enhancements:
- Predictive analytics for failure prevention
- Machine learning for anomaly detection
- Mobile application for alerts
- Advanced notification system with priority levels
- Extended API for integration with MES systems

## Contact

For questions or support, contact the development team at lcontrol2326social@gmail.com
