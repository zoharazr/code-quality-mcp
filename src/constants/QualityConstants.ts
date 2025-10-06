export const FORBIDDEN_PATTERNS = {
  console: ['console.log', 'console.debug', 'console.warn'],
  imports: ['../../', '../../../'],
  comments: ['TODO', 'FIXME', 'HACK', 'XXX'],
  debugCode: ['debugger', 'alert('],
  hardcodedValues: ['localhost:', '127.0.0.1', 'password:', 'secret:']
} as const;

export const PATH_ALIASES = {
  '@/': 'src/',
  '@/assets/': 'assets/',
  '@/components/': 'src/components/',
  '@/screens/': 'src/screens/',
  '@/services/': 'src/services/',
  '@/utils/': 'src/utils/',
  '@/constants/': 'src/constants/',
  '@/types/': 'src/types/',
  '@/hooks/': 'src/hooks/',
  '@/data/': 'src/data/',
  '@/locales/': 'src/locales/'
} as const;

export const ADVANCED_COMPONENT_STRUCTURE = {
  files: ['index.tsx', 'types.ts', 'styles.ts', 'const.ts'],
  folders: ['hooks/', 'components/', 'services/', 'handlers/'],
  limits: {
    'index.tsx': 100,
    'hooks/': 50,
    'services/': 100,
    'handlers/': 30,
    'components/': 80
  }
} as const;