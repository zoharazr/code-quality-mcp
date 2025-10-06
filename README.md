# Code Quality MCP Server (2025 Standards)

MCP server for automated code quality analysis with support for various frameworks and languages, updated with 2025 coding standards and best practices.

## Features

- 🔍 **Automatic Project Type Detection**
  - React / React Native
  - Node.js / Express / Fastify / Koa / Hapi
  - Next.js (Pages Router & App Router)
  - Nest.js (Including Microservices)
  - Vue.js / Nuxt
  - Svelte / SvelteKit
  - Remix
  - Astro
  - Java / Spring Boot
  - .NET Core / C#
  - Angular (17+)
  - Firebase Functions
  - AWS Amplify

- 📊 **Framework-Specific Quality Checks (2025 Standards)**
  - File size limits (Updated for modern frameworks)
  - Function/Method length limits
  - Line width limits (80-120 chars)
  - Code complexity analysis
  - Component structure validation
  - Dead code and duplication detection
  - Import and dependency analysis
  - Methods per class limits

- 📁 **Code Organization Checks**
  - **React/React Native**: Feature-based structure with components, hooks, services
  - **Node.js/Express**: MVC pattern with routes, controllers, services
  - **Next.js**: App Router/Pages Router structure
  - **Nest.js**: Module-based architecture with DTOs, guards, interceptors
  - **Java Spring Boot**: Layer-based or Feature-based organization
  - **.NET Core**: Clean Architecture (Domain, Application, Infrastructure, Presentation)
  - **Angular**: Feature modules with core, shared, and feature folders
  - **Firebase Functions**: Domain-based organization (constants, function, functions)

- 🏗️ **Complex Project Support**
  - Multi-project detection (project within project)
  - Shared dependency analysis
  - Structure organization recommendations

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd code-quality-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

## Claude Desktop Configuration

Add the following settings to the `claude_desktop_config.json` file:

```json
{
  "mcpServers": {
    "code-quality": {
      "command": "node",
      "args": ["/path/to/code-quality-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

## Usage

### Project Analysis

```typescript
// Automatic project type analysis
analyze_project({
  projectPath: "/path/to/project",
  deep: true
})
```

### Quality Check

```typescript
// Quality check with automatic detection
check_quality({
  projectPath: "/path/to/project"
})

// Quality check with specific project type
check_quality({
  projectPath: "/path/to/project",
  projectType: "firebase"
})
```

### Get Recommendations

```typescript
get_recommendations({
  projectPath: "/path/to/project",
  language: "en"
})
```

## Quality Limits by Project Type (2025 Standards)

### React / React Native

| Metric | Limit | Updated |
|--------|-------|---------|
| Lines per file | 300 | ✅ 2025 |
| Lines per component | 200 | ✅ 2025 |
| Lines per function | 30 | ✅ New |
| Line width (chars) | 120 | ✅ New |
| Complexity | 10 | - |
| Parameters | 4 | - |

### Firebase Functions

| Metric | Limit | Updated |
|--------|-------|---------|
| Functions per file | 5 | - |
| Lines per file | 300 | - |
| Lines per function | 50 | ✅ 2025 |
| Complexity | 10 | - |
| Parameters | 4 | - |

### Node.js / Next.js / Nest.js

| Metric | Limit | Updated |
|--------|-------|---------|
| Lines per file | 500 | ✅ 2025 |
| Line width (chars) | 120 | ✅ New |
| Methods per class | 30 | ✅ New |
| Complexity | 15 | - |
| Parameters | 5 | - |

### Java / Spring Boot

| Metric | Limit | Updated |
|--------|-------|---------|
| Lines per file | 1000 | ✅ 2025 |
| Line width (chars) | 100 | ✅ Google |
| Methods per class | 30 | ✅ New |
| Complexity | 15 | ✅ 2025 |
| Parameters | 6 | - |

### .NET Core / C#

| Metric | Limit | Updated |
|--------|-------|---------|
| Lines per file | 500 | ✅ 2025 |
| Line width (chars) | 120 | ✅ New |
| Methods per class | 30 | ✅ New |
| Complexity | 15 | - |
| Parameters | 5 | - |

### Angular

| Metric | Limit | Updated |
|--------|-------|---------|
| Lines per file | 350 | ✅ 2025 |
| Line width (chars) | 120 | ✅ New |
| Methods per component | 20 | ✅ New |
| Complexity | 12 | - |
| Parameters | 4 | - |

## Check Examples

### Common Checks (2025)

- ❌ **console.log** - Use logger instead
- ❌ **Deep relative imports** - Use path aliases
- ❌ **TODO/FIXME** - Old comments
- ❌ **Line length > 120 chars** - Keep lines readable
- ❌ **Functions > 30 lines** - Split into smaller functions
- ❌ **Dead code** - Unused code
- ❌ **Duplications** - Duplicate code

### Firebase Checks (2025)

- ✅ Maximum 5 functions per file
- ✅ Maximum 50 lines per function (Updated from 100)
- ✅ Use logger.info/error
- ✅ Correct folder structure (constants/, function/, functions/)
- ✅ Feature-based organization
- ✅ Complete error handling

### React/React Native Checks (2025)

- ✅ Component structure (index.tsx, types.ts, styles.ts, const.ts)
- ✅ Hooks organization (useComponentState, useComponentLogic, useComponentEffects)
- ✅ Maximum 200 lines per component
- ✅ Maximum 30 lines per function
- ✅ Services and handlers separation

### Multi-Project Checks

- 📦 Duplicate dependency detection
- 🔗 Version compatibility check
- 📁 Folder structure organization

## What Gets Checked?

### Folder Structure Validation

The tool validates that your project follows the recommended folder structure for each framework:

#### React/React Native
- ✅ Required: `src/components`, `src/hooks`, `src/services`, `src/utils`, `src/types`, `src/assets`
- ✅ Component structure: `index.tsx`, `types.ts`, `styles.ts`, `const.ts`, `hooks/`, `components/`
- ✅ Hook organization: `useComponentState`, `useComponentLogic`, `useComponentEffects`

#### Node.js/Express
- ✅ Required: `src/routes`, `src/controllers`, `src/services`, `src/models`, `src/middleware`
- ✅ Separation of concerns: No database operations in routes
- ✅ Proper layering: Routes → Controllers → Services → Models

#### Java Spring Boot
- ✅ Layer-based: `controller`, `service`, `repository`, `model`, `dto`, `config`
- ✅ Feature-based: Each feature contains its own controllers and services
- ✅ Maven/Gradle structure compliance

#### .NET Core
- ✅ Clean Architecture: `Domain`, `Application`, `Infrastructure`, `Presentation`
- ✅ Standard MVC: `Controllers`, `Models`, `Services`, `Data`
- ✅ Dependency direction validation

#### Angular
- ✅ Core module: `services`, `guards`, `interceptors`
- ✅ Shared module: `components`, `directives`, `pipes`
- ✅ Feature modules: Each feature with its own components and services

#### Firebase Functions
- ✅ Required: `functions/src/constants`, `functions/src/function`, `functions/src/functions`
- ✅ Feature organization: Functions grouped by domain (e.g., `family/`, `auth/`)
- ✅ Function naming conventions and file structure

## Code Examples

### ✅ Good React Component Structure

```typescript
// src/components/AuthModal/
AuthModal/
├── index.tsx           // Main component (< 100 lines)
├── types.ts           // TypeScript interfaces
├── styles.ts          // Styled components
├── const.ts           // Constants
├── hooks/
│   ├── useAuthModalState.ts    // State management
│   ├── useAuthModalLogic.ts    // Business logic
│   └── useAuthModalEffects.ts  // Side effects
├── components/
│   ├── LoginForm/
│   │   ├── index.tsx
│   │   ├── types.ts
│   │   └── styles.ts
│   └── RegisterForm/
│       ├── index.tsx
│       ├── types.ts
│       └── styles.ts
├── services/
│   ├── authService.ts
│   └── types.ts
└── handlers/
    └── authHandlers.ts
```

**Example index.tsx:**
```typescript
// AuthModal/index.tsx
import React from 'react';
import { Container, Overlay } from './styles';
import { AuthModalProps } from './types';
import { useAuthModalState } from './hooks/useAuthModalState';
import { useAuthModalLogic } from './hooks/useAuthModalLogic';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { mode, setMode } = useAuthModalState();
  const { handleSubmit } = useAuthModalLogic();

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Container onClick={(e) => e.stopPropagation()}>
        {mode === 'login' ? (
          <LoginForm onSubmit={handleSubmit} onModeChange={setMode} />
        ) : (
          <RegisterForm onSubmit={handleSubmit} onModeChange={setMode} />
        )}
      </Container>
    </Overlay>
  );
};
```

### ❌ Bad React Component Structure

```typescript
// ❌ Everything in one file
// src/components/AuthModal.tsx (500+ lines)
import React, { useState, useEffect } from 'react';
import axios from 'axios'; // ❌ Direct API calls
import '../../styles/auth.css'; // ❌ Deep import

const AuthModal = () => {
  console.log('Rendering'); // ❌ Console.log

  // ❌ All logic in one file
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // TODO: Fix this later // ❌ TODO comment

  const handleSubmit = async () => {
    // ❌ 200+ lines of logic here
  };

  // ❌ Inline styles
  return (
    <div style={{ padding: 20 }}>
      {/* ❌ 300+ lines of JSX */}
    </div>
  );
};
```

### ✅ Good Firebase Functions Structure

```typescript
// functions/src/functions/family/create.ts
import * as functions from 'firebase-functions';
import { logger } from '../../function';
import { validateAuth } from '../../function/securityUtils';
import { FAMILY_LIMITS } from '../../constants';

/**
 * Creates a new family group
 * ✅ Under 100 lines
 * ✅ Single responsibility
 * ✅ Proper error handling
 */
export const createFamily = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    // Validate authentication
    const userId = validateAuth(context);

    // Validate input
    if (!data.familyName || data.familyName.length < 3) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Family name must be at least 3 characters'
      );
    }

    try {
      logger.info('Creating family', { userId, familyName: data.familyName });

      // Business logic here (< 100 lines total)
      const familyData = {
        name: data.familyName,
        createdBy: userId,
        createdAt: new Date(),
        members: [userId],
        settings: {
          maxMembers: FAMILY_LIMITS.MAX_MEMBERS,
          allowInvites: true
        }
      };

      // Create in database
      const familyRef = await admin.firestore()
        .collection('families')
        .add(familyData);

      logger.info('Family created successfully', { familyId: familyRef.id });

      return {
        success: true,
        familyId: familyRef.id
      };

    } catch (error) {
      logger.error('Failed to create family', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to create family'
      );
    }
  });
```

### ❌ Bad Firebase Functions Structure

```typescript
// ❌ functions/src/index.ts (1000+ lines)
import * as functions from 'firebase-functions';

// ❌ All functions in one file
export const createFamily = functions.https.onCall(async (data) => {
  console.log('Creating family'); // ❌ Console.log instead of logger
  // 200+ lines of code
});

export const joinFamily = functions.https.onCall(async (data) => {
  // 200+ lines of code
});

export const updateFamily = functions.https.onCall(async (data) => {
  // 200+ lines of code
});

export const deleteFamily = functions.https.onCall(async (data) => {
  // 200+ lines of code
});

export const inviteMembers = functions.https.onCall(async (data) => {
  // 200+ lines of code
});

// ❌ No folder structure
// ❌ No constants folder
// ❌ No utils folder
// ❌ Functions exceed 100 lines each
```

### ✅ Correct Folder Organization

```
functions/src/
├── constants/
│   ├── index.ts           // Export all constants
│   └── security.ts        // Security constants
├── function/
│   ├── index.ts           // Utility functions
│   └── securityUtils.ts   // Security utilities
├── functions/
│   ├── family/            // Family domain
│   │   ├── create.ts      // < 100 lines
│   │   ├── join.ts        // < 100 lines
│   │   └── update.ts      // < 100 lines
│   ├── members/           // Members domain
│   │   ├── approve.ts     // < 100 lines
│   │   └── regenerate.ts  // < 100 lines
│   └── index.ts           // Export all functions
└── index.ts               // Main entry point
```

## Development

```bash
# Development mode
npm run dev

# Build
npm run build

# Type checking
npx tsc --noEmit
```

## License

MIT