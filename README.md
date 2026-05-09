# PMST US-Nepal - Angular UI

Angular 17+ frontend for PMST US-Nepal premium model showcase and talent platform.

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | Angular 17+ LTS |
| Language | TypeScript 5.4+ |
| Styling | Tailwind CSS 3.4+, Angular Material |
| Build | Angular CLI 17+ |
| SSR | Angular Universal |
| Icons | Inline SVG |

## Project Structure

```
src/app/
├── core/
│   ├── components/       # Header, Footer, Navigation
│   ├── services/         # Auth, API, SEO, Error Handler
│   └── guards/           # Auth Guard, Admin Guard
├── features/
│   ├── home/             # Hero, News, Gallery Spotlight, Video
│   ├── news/             # Article List, Article Detail
│   ├── showcase/         # Gallery Grid, Gallery Detail
│   ├── auth/             # Login, Register, Social Login
│   ├── user/             # Profile, Dashboard, Settings
│   ├── comments/         # Comment Section, Thread, Form
│   └── admin/            # User Management, Moderation
└── shared/
    ├── components/       # Pagination, Breadcrumbs, SEO Meta
    └── directives/       # GTM Tracker, Lazy Load
```

## Prerequisites

- Node.js 18.13.0 or higher
- npm 9.0.0 or higher
- Angular CLI 17+ (optional, can use `npx`)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Server

```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any source files.

### 3. Build for Production

```bash
npm run build:prod
# or
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

### 4. Run Tests

```bash
npm test
# or
ng test
```

### 5. Run with SSR (Server-Side Rendering)

```bash
npm run build:prod
npm run serve:ssr
```

## Environment Configuration

Update the environment files in `src/environments/`:

- `environment.ts` - Development settings
- `environment.prod.ts` - Production settings

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://api.pmstusnepal.com/v1',
  appName: 'PMST US-Nepal'
};
```

## Code Generation

Generate new components using Angular CLI:

```bash
# Generate a component
ng generate component features/my-feature

# Generate a service
ng generate service core/services/my-service

# Generate a guard
ng generate guard core/guards/my-guard
```

## Linting

```bash
npm run lint
# or
ng lint
```

## Key Features Implemented

- **Standalone Components** - No NgModule boilerplate
- **Signals** - Modern state management
- **SSR/Hydration** - Server-side rendering for SEO
- **New Control Flow** - Using `@if`, `@for`, `@switch`
- **Lazy Loading** - Route-based code splitting
- **Responsive Design** - Mobile-first with Tailwind CSS

## API Integration

The application expects a REST API at the configured `apiUrl` with these endpoints:

| Endpoint | Description |
|----------|-------------|
| `POST /auth/login` | User login |
| `POST /auth/register` | User registration |
| `GET /auth/me` | Current user profile |
| `GET /articles` | News articles list |
| `GET /articles/:slug` | Single article |
| `GET /models` | Models showcase |
| `GET /models/:id` | Model profile |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Create a Pull Request

## License

Proprietary - PMST US-Nepal
