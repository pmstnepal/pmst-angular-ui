# PMST Angular UI

Angular 17+ frontend for PMST US-Nepal platform.

## Technology Stack
- Angular 17+ LTS
- TypeScript
- Tailwind CSS
- AWS Amplify
- AWS Cognito (Authentication)

## Project Structure
```
src/app/
├── core/           # Header, Footer, Services
├── features/       # Home, News, Showcase, Auth
├── shared/         # Components, Directives
└── assets/         # Images, Fonts
```

## Development
```bash
npm install
ng serve
```

## Build
```bash
ng build --configuration production
```
