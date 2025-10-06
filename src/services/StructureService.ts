import { LimitsService } from './LimitsService.js';

export class StructureService {
  private limitsService: LimitsService;

  constructor() {
    this.limitsService = new LimitsService();
  }

  public getRecommendedStructure(projectType: string): any {
    switch (projectType) {
      case 'firebase-functions':
        return {
          structure: `
functions/src/
├── constants/
│   ├── index.ts
│   └── security.ts
├── function/
│   ├── index.ts
│   └── securityUtils.ts
├── functions/
│   ├── example/
│   │   ├── create.ts
│   │   ├── join.ts
│   │   └── update.ts
│   ├── members/
│   │   ├── approve.ts
│   │   └── regenerate.ts
│   └── index.ts
└── index.ts`,
          rules: this.limitsService.getFirebaseLimits()
        };

      case 'react':
      case 'react-native':
        return {
          structure: `
src/
├── components/
│   └── ComponentName/
│       ├── index.tsx
│       ├── types.ts
│       ├── styles.ts
│       ├── const.ts
│       ├── hooks/
│       ├── components/
│       └── handlers/
├── screens/
├── services/
├── utils/
├── constants/
└── types/`,
          rules: this.limitsService.getReactLimits(projectType)
        };

      default:
        return null;
    }
  }
}
