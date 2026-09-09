const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const WORKFLOW_PATH = path.join(PROJECT_ROOT, 'workflow.md');
const START_MARKER = '<!-- PROJECT_STRUCTURE:START -->';
const END_MARKER = '<!-- PROJECT_STRUCTURE:END -->';

const SCAN_ROOTS = [
  '.agents',
  '.bundle',
  '__tests__',
  'android',
  'assets',
  'ios',
  'scripts',
  'src',
];

const IGNORED_DIRECTORIES = new Set([
  '.cxx',
  '.git',
  '.gradle',
  '.kotlin',
  'DerivedData',
  'Pods',
  'build',
  'node_modules',
]);

const FEATURE_PURPOSES = {
  auth: 'Authentication, onboarding, OTP verification, and vendor registration.',
  customers: 'Customer onboarding, listing, profiles, history, and delivery history.',
  dashboard: 'Vendor home dashboard, summaries, quick actions, and today-delivery overview.',
  deliveries: 'Today, past, and unbilled delivery operations and status handling.',
  'delivery-subscriptions': 'Customer recurring-delivery subscription creation, editing, and detail management.',
  invoices: 'Invoice generation, invoice listing, invoice detail, preview, and PDF workflows.',
  'one-time-orders': 'One-time order creation, listing, and fulfilment workflows.',
  payments: 'Customer payment collection and ledger-facing payment UI.',
  'plan-billing': 'Vendor SaaS plan selection, Razorpay checkout, activation polling, billing history, and cancellation.',
  products: 'Product catalog, product creation/editing, details, and product selection UI.',
  reports: 'Financial, inventory, operations, and outstanding analytics.',
  routes: 'Delivery route creation, details, staff assignment, and customer sequencing.',
  settings: 'Vendor profile, language, account settings, and logout/account actions.',
  staff: 'Staff creation, management, assignment visibility, and staff operations.',
};

const DIRECTORY_PURPOSES = {
  src: 'All JavaScript application source organized by ownership.',
  'src/app': 'Application composition layer; startup, navigation, and global providers.',
  'src/app/navigation': 'Navigation containers, stacks, drawer, tabs, and drawer content.',
  'src/app/providers': 'Global authentication, alert, and subscription-entitlement state.',
  'src/app/screens': 'Screens owned by application startup rather than a business feature.',
  'src/features': 'Business modules with feature-owned screens, components, and public barrels.',
  'src/shared': 'Reusable code with no single-feature ownership.',
  'src/shared/assets': 'Assets imported directly by source modules.',
  'src/shared/components': 'Reusable visual and interaction components.',
  'src/shared/constants': 'Shared design tokens and subscription-entitlement keys.',
  'src/shared/i18n': 'i18next initialization and language resources.',
  'src/shared/i18n/locales': 'Per-language translation dictionaries.',
  'src/shared/services': 'Central authenticated HTTP/API client.',
  'src/shared/utils': 'Cross-feature utility and seed helpers.',
  assets: 'Root React Native images, branding files, and linked fonts.',
  'assets/fonts': 'Source font files linked into native applications.',
  android: 'Android Gradle project and native application configuration.',
  'android/app': 'Android application module.',
  'android/app/src/main': 'Android production manifest, Kotlin bootstrap, assets, and resources.',
  ios: 'iOS CocoaPods/Xcode project and native application configuration.',
  scripts: 'Repository validation and documentation automation.',
  __tests__: 'Automated application tests.',
  '.agents': 'Repository-specific agent maintenance instructions.',
  '.bundle': 'Ruby Bundler configuration used by native iOS tooling.',
};

const SPECIAL_FILE_ROLES = {
  'App.jsx': 'Root React Native component; providers, global visual shell, status bar, navigation, and in-app updates.',
  'index.js': 'React Native application registration entry point.',
  'src/app/navigation/RootNavigator.jsx': 'Top-level authentication gate, splash transition, entitlement-limit handling, and app stack registration.',
  'src/app/navigation/AuthStack.jsx': 'Public onboarding and authentication stack registration.',
  'src/app/navigation/MainDrawer.jsx': 'Authenticated drawer navigator and drawer-level screens.',
  'src/app/navigation/MainTabs.jsx': 'Authenticated bottom-tab navigation and tab entitlement guards.',
  'src/app/navigation/CustomDrawerContent.jsx': 'Role-aware drawer menu, entitlement lock display, profile header, and logout action.',
  'src/app/providers/AlertContext.jsx': 'Global styled alert/modal API used instead of generic native alerts.',
  'src/app/providers/AuthContext.js': 'Authentication session, persisted tokens, profile state, refresh callbacks, and logout.',
  'src/app/providers/EntitlementContext.jsx': 'Subscription entitlement state, proactive checks, and guarded navigation/actions.',
  'src/app/screens/SplashScreen.jsx': 'Animated application splash experience and startup completion callback.',
  'src/shared/services/api.js': 'Central API base URL, authenticated request handling, refresh queue, logging, and domain API methods.',
  'src/shared/i18n/index.js': 'i18next initialization, locale registration, fallback, and saved-language restoration.',
  'src/shared/constants/colors.js': 'Shared application color tokens.',
  'src/shared/constants/subscriptionEntitlements.js': 'Entitlement identifiers and localized feature-name mappings.',
  'src/shared/components/CurvedHeader.jsx': 'Reusable gradient curved header used across application screens.',
  'src/shared/components/DeliveryStatusSlider.jsx': 'Reusable interactive delivery-status control.',
  'src/shared/components/ImageWithSkeleton.jsx': 'Image wrapper that displays a loading skeleton until the asset is ready.',
  'src/shared/components/LanguageSelector.jsx': 'Reusable multi-language selector used by authentication and settings UI.',
  'src/shared/utils/seedDatabase.js': 'Local seed/helper data utility.',
  'scripts/verifyRelativeImports.cjs': 'Validates every relative import, export-from, dynamic import, and require path.',
  'scripts/updateProjectStructure.cjs': 'Regenerates the Excel-ready current-project structure in workflow.md.',
  '__tests__/App.test.tsx': 'Application render smoke test.',
  'package.json': 'Node package manifest, dependency versions, and developer commands.',
  'package-lock.json': 'Exact npm dependency resolution lockfile.',
  'workflow.md': 'Task history plus generated current-project architecture source for Excel exports.',
  'src/README.md': 'Concise source ownership and validation guide.',
};

const LOCALES = {
  bn: 'Bengali',
  en: 'English',
  gu: 'Gujarati',
  hi: 'Hindi',
  mr: 'Marathi',
  pa: 'Punjabi',
  ta: 'Tamil',
  te: 'Telugu',
};

const toPosix = value => value.split(path.sep).join('/');
const escapeCell = value => String(value ?? '')
  .replace(/\|/g, '\\|')
  .replace(/\r?\n/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const code = value => `\`${String(value).replace(/`/g, '\\`')}\``;

const markdownTable = (headers, rows) => {
  const header = `| ${headers.map(escapeCell).join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(row => `| ${row.map(escapeCell).join(' | ')} |`);
  return [header, separator, ...body].join('\n');
};

const walk = (absoluteDirectory, files = []) => {
  if (!fs.existsSync(absoluteDirectory)) return files;

  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const absolutePath = path.join(absoluteDirectory, entry.name);
    if (entry.isDirectory()) walk(absolutePath, files);
    else if (entry.isFile() && entry.name !== '.DS_Store') files.push(absolutePath);
  }

  return files;
};

const splitPascalCase = value => value
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[-_]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const classifyFile = relativePath => {
  const extension = path.extname(relativePath).toLowerCase();
  const base = path.basename(relativePath, extension);

  if (/Screen\.(jsx?|tsx?)$/.test(relativePath)) return 'Screen';
  if (/Modal\.(jsx?|tsx?)$/.test(relativePath)) return 'Feature modal';
  if (relativePath.includes('/components/')) return 'Component';
  if (relativePath.includes('/navigation/')) return 'Navigation';
  if (relativePath.includes('/providers/')) return 'Provider/context';
  if (relativePath.includes('/services/')) return 'Service/API client';
  if (relativePath.includes('/i18n/locales/')) return 'Locale dictionary';
  if (relativePath.includes('/i18n/')) return 'Localization setup';
  if (relativePath.includes('/constants/')) return 'Constant/token map';
  if (relativePath.includes('/utils/')) return 'Utility';
  if (/src\/features\/[^/]+\/index\.js$/.test(relativePath)) return 'Feature public barrel';
  if (relativePath.startsWith('scripts/')) return 'Automation script';
  if (relativePath.startsWith('__tests__/')) return 'Automated test';
  if (['.png', '.jpg', '.jpeg', '.webp', '.gif'].includes(extension)) return 'Image asset';
  if (['.ttf', '.otf'].includes(extension)) return 'Font asset';
  if (['.zip', '.jar', '.aab', '.apk'].includes(extension)) return 'Binary/archive';
  if (['.md', '.txt'].includes(extension)) return 'Documentation';
  if (['.kt', '.swift', '.m', '.mm', '.h'].includes(extension)) return 'Native source';
  if (['.xml', '.plist', '.storyboard', '.xcprivacy', '.json'].includes(extension) && (relativePath.startsWith('android/') || relativePath.startsWith('ios/'))) return 'Native resource/config';
  if (relativePath.includes('.xcodeproj/')) return 'Xcode project configuration';
  if (['.gradle', '.properties'].includes(extension) || /(^|\/)gradlew(\.bat)?$/.test(relativePath) || relativePath === 'Gemfile' || relativePath === 'ios/Podfile') return 'Native build configuration';
  if (base === 'package-lock') return 'Dependency lockfile';
  if (extension === '.js' || extension === '.json' || extension === '.config') return 'Project configuration/source';
  return 'Project file';
};

const ownershipFor = relativePath => {
  const parts = relativePath.split('/');
  if (parts[0] === 'src' && parts[1] === 'features') return ['Feature', parts[2]];
  if (parts[0] === 'src' && parts[1] === 'app') return ['Application shell', parts[2] || 'app'];
  if (parts[0] === 'src' && parts[1] === 'shared') return ['Shared', parts[2] || 'shared'];
  if (parts[0] === 'android') return ['Native', 'android'];
  if (parts[0] === 'ios') return ['Native', 'ios'];
  if (parts[0] === 'assets') return ['Assets', parts[1] || 'images'];
  if (parts[0] === 'scripts') return ['Tooling', 'scripts'];
  if (parts[0] === '__tests__') return ['Quality', 'tests'];
  if (parts[0] === '.agents') return ['Governance', 'agent-rules'];
  if (parts[0] === '.bundle') return ['Tooling', 'ruby'];
  if (path.extname(relativePath).toLowerCase() === '.md') return ['Documentation', 'project-docs'];
  return ['Project root', 'configuration'];
};

const roleFor = (relativePath, type, moduleName) => {
  if (SPECIAL_FILE_ROLES[relativePath]) return SPECIAL_FILE_ROLES[relativePath];
  const extension = path.extname(relativePath);
  const base = path.basename(relativePath, extension);

  if (type === 'Screen') {
    const subject = splitPascalCase(base.replace(/Screen$/, ''));
    if (base.startsWith('Add')) return `Create/edit workflow for ${splitPascalCase(base.slice(3).replace(/Screen$/, ''))}.`;
    if (base.endsWith('ListScreen')) return `List and management UI for ${splitPascalCase(base.replace(/ListScreen$/, ''))}.`;
    if (base.endsWith('DetailScreen')) return `Detail and actions UI for ${splitPascalCase(base.replace(/DetailScreen$/, ''))}.`;
    if (base.includes('History')) return `History and timeline UI for ${subject.replace(/ history/i, '')}.`;
    return `${subject} user interface in the ${moduleName} module.`;
  }
  if (type === 'Feature modal') return `${splitPascalCase(base.replace(/Modal$/, ''))} modal owned by the ${moduleName} module.`;
  if (type === 'Component') return `Reusable ${splitPascalCase(base)} component.`;
  if (type === 'Feature public barrel') return `Public exports for the ${moduleName} feature boundary.`;
  if (type === 'Locale dictionary') return `${LOCALES[base] || base} translation dictionary.`;
  if (type === 'Image asset') return `${splitPascalCase(base)} image asset.`;
  if (type === 'Font asset') return `${splitPascalCase(base)} font resource.`;
  if (type === 'Documentation') return `${splitPascalCase(base)} project documentation.`;
  if (type === 'Native source') return `${splitPascalCase(base)} native bootstrap/source file.`;
  if (type.includes('configuration') || type.includes('config')) return `${splitPascalCase(base)} configuration.`;
  return `${splitPascalCase(base)} ${type.toLowerCase()}.`;
};

const readText = absolutePath => {
  const extension = path.extname(absolutePath).toLowerCase();
  const textExtensions = new Set(['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.xml', '.gradle', '.properties', '.kt', '.swift', '.plist', '.storyboard', '.cjs']);
  if (!textExtensions.has(extension) && !['Gemfile', 'Podfile', 'gradlew', '.gitignore', '.eslintrc.js', '.prettierrc.js', '.watchmanconfig'].includes(path.basename(absolutePath))) return '';
  return fs.readFileSync(absolutePath, 'utf8');
};

const sourceMetadata = absolutePath => {
  const extension = path.extname(absolutePath).toLowerCase();
  if (!['.js', '.jsx', '.ts', '.tsx', '.cjs', '.mjs'].includes(extension)) {
    return { exports: '', localImports: 0, externalImports: '' };
  }
  const source = readText(absolutePath);
  if (!source) return { exports: '', localImports: 0, externalImports: '' };

  const exports = new Set();
  for (const match of source.matchAll(/export\s+(?:default\s+)?(?:const|function|class)?\s*([A-Za-z_$][\w$]*)/g)) exports.add(match[1]);
  for (const match of source.matchAll(/export\s*\{([\s\S]*?)\}\s*from/g)) {
    for (const item of match[1].split(',')) {
      const symbol = item.trim().match(/(?:as\s+)?([A-Za-z_$][\w$]*)$/)?.[1];
      if (symbol) exports.add(symbol);
    }
  }

  const specifiers = [];
  const importPattern = /(?:from\s+|require\s*\(|import\s*\()\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(importPattern)) specifiers.push(match[1]);
  const localImports = specifiers.filter(value => value.startsWith('.')).length;
  const externalImports = [...new Set(specifiers
    .filter(value => !value.startsWith('.') && !value.startsWith('/'))
    .map(value => value.startsWith('@') ? value.split('/').slice(0, 2).join('/') : value.split('/')[0]))]
    .sort();

  return {
    exports: [...exports].sort().join(', '),
    localImports,
    externalImports: externalImports.join(', '),
  };
};

const collectMaintainedFiles = () => {
  const files = [];
  for (const entry of fs.readdirSync(PROJECT_ROOT, { withFileTypes: true })) {
    if (entry.isFile() && entry.name !== '.DS_Store') files.push(path.join(PROJECT_ROOT, entry.name));
  }
  for (const root of SCAN_ROOTS) walk(path.join(PROJECT_ROOT, root), files);
  return [...new Set(files.map(file => path.resolve(file)))]
    .sort((left, right) => toPosix(path.relative(PROJECT_ROOT, left)).localeCompare(toPosix(path.relative(PROJECT_ROOT, right))));
};

const extractRoutes = files => {
  const rows = [];
  const navigationFiles = files.filter(file => toPosix(path.relative(PROJECT_ROOT, file)).startsWith('src/app/navigation/'));
  const scopeByFile = {
    'AuthStack.jsx': 'Public authentication stack',
    'MainDrawer.jsx': 'Authenticated drawer',
    'MainTabs.jsx': 'Authenticated bottom tabs',
    'RootNavigator.jsx': 'Root authenticated/auth-gated stack',
  };

  for (const file of navigationFiles) {
    const source = readText(file);
    const relativePath = toPosix(path.relative(PROJECT_ROOT, file));
    for (const match of source.matchAll(/<(Stack|Drawer|Tab)\.Screen\b([\s\S]*?)\/>/g)) {
      const props = match[2];
      const routeName = props.match(/\bname=["']([^"']+)["']/)?.[1];
      if (!routeName) continue;
      const component = props.match(/\bcomponent=\{([^}]+)\}/)?.[1] || 'Inline/children';
      rows.push([scopeByFile[path.basename(file)] || match[1], routeName, component, code(relativePath)]);
    }
  }
  return rows.sort((left, right) => `${left[0]}:${left[1]}`.localeCompare(`${right[0]}:${right[1]}`));
};

const extractApiOperations = () => {
  const apiPath = path.join(PROJECT_ROOT, 'src', 'shared', 'services', 'api.js');
  if (!fs.existsSync(apiPath)) return [];
  const source = fs.readFileSync(apiPath, 'utf8');
  const objectStart = source.indexOf('export const api = {');
  if (objectStart < 0) return [];
  const apiSource = source.slice(objectStart);
  const propertyPattern = /^\s{2}([A-Za-z_$][\w$]*):/gm;
  const matches = [...apiSource.matchAll(propertyPattern)];
  const occurrence = new Map();
  const transportMap = {
    getRequest: 'GET',
    postRequest: 'POST',
    patchRequest: 'PATCH',
    putRequest: 'PUT',
    deleteRequest: 'DELETE',
    postMultipartRequest: 'POST multipart',
    patchMultipartRequest: 'PATCH multipart',
  };

  return matches.map((match, index) => {
    const operation = match[1];
    const block = apiSource.slice(match.index, matches[index + 1]?.index ?? apiSource.length);
    const requestMatch = block.match(/\b(getRequest|postRequest|patchRequest|putRequest|deleteRequest|postMultipartRequest|patchMultipartRequest)\s*\(\s*([`'"])([\s\S]*?)\2/);
    const declaredEndpoint = block.match(/\bconst\s+endpoint\s*=\s*([`'"])([\s\S]*?)\1/)?.[2];
    const customUrl = block.match(/([`'"])(\/(?:api\/)?[A-Za-z][^`'"]*)\1/)?.[2];
    const declaredMethod = block.match(/\bmethod:\s*['"]([^'"]+)['"]/)?.[1];
    const seen = (occurrence.get(operation) || 0) + 1;
    occurrence.set(operation, seen);
    return [
      operation,
      seen,
      requestMatch ? transportMap[requestMatch[1]] : declaredMethod || 'Custom request',
      code(declaredEndpoint || requestMatch?.[3] || customUrl || 'Computed at runtime'),
    ];
  });
};

const directoryRows = files => {
  const relativeFiles = files.map(file => toPosix(path.relative(PROJECT_ROOT, file)));
  const directories = new Set();
  for (const file of relativeFiles) {
    let directory = path.posix.dirname(file);
    while (directory && directory !== '.') {
      directories.add(directory);
      directory = path.posix.dirname(directory);
    }
  }

  return [...directories].sort().map(directory => {
    const direct = relativeFiles.filter(file => path.posix.dirname(file) === directory).length;
    const total = relativeFiles.filter(file => file.startsWith(`${directory}/`)).length;
    let purpose = DIRECTORY_PURPOSES[directory];
    if (!purpose && directory.startsWith('src/features/')) {
      const moduleName = directory.split('/')[2];
      const suffix = directory.split('/').slice(3).join('/');
      purpose = suffix
        ? `${splitPascalCase(suffix)} owned by the ${moduleName} feature.`
        : FEATURE_PURPOSES[moduleName];
    }
    if (!purpose) purpose = `${splitPascalCase(path.posix.basename(directory))} project resources.`;
    return [code(directory), direct, total, purpose];
  });
};

const featureRows = files => Object.entries(FEATURE_PURPOSES).map(([feature, purpose]) => {
  const prefix = `src/features/${feature}/`;
  const featureFiles = files.filter(file => toPosix(path.relative(PROJECT_ROOT, file)).startsWith(prefix));
  const relativeFeatureFiles = featureFiles.map(file => toPosix(path.relative(PROJECT_ROOT, file)));
  const screens = relativeFeatureFiles.filter(file => file.includes('/screens/')).map(file => path.posix.basename(file, path.posix.extname(file)));
  const components = relativeFeatureFiles.filter(file => file.includes('/components/')).map(file => path.posix.basename(file, path.posix.extname(file)));
  const barrel = featureFiles.find(file => path.basename(file) === 'index.js');
  const exported = barrel ? sourceMetadata(barrel).exports : '';
  return [feature, purpose, screens.length, screens.join(', ') || 'None', components.join(', ') || 'None', exported || 'None'];
});

const localizationRows = files => files
  .filter(file => toPosix(path.relative(PROJECT_ROOT, file)).startsWith('src/shared/i18n/locales/'))
  .map(file => {
    const relativePath = toPosix(path.relative(PROJECT_ROOT, file));
    const locale = path.basename(file, path.extname(file));
    return [locale, LOCALES[locale] || locale, code(relativePath), 'Registered through src/shared/i18n/index.js'];
  });

const dependencyRows = packageJson => [
  ...Object.entries(packageJson.dependencies || {}).map(([name, version]) => ['Runtime', name, version]),
  ...Object.entries(packageJson.devDependencies || {}).map(([name, version]) => ['Development', name, version]),
].sort((left, right) => `${left[0]}:${left[1]}`.localeCompare(`${right[0]}:${right[1]}`));

const fileRows = files => files.map((absolutePath, index) => {
  const relativePath = toPosix(path.relative(PROJECT_ROOT, absolutePath));
  const [layer, moduleName] = ownershipFor(relativePath);
  const type = classifyFile(relativePath);
  const metadata = sourceMetadata(absolutePath);
  return [
    `FILE-${String(index + 1).padStart(3, '0')}`,
    layer,
    moduleName,
    type,
    code(relativePath),
    roleFor(relativePath, type, moduleName),
    metadata.exports || '—',
    metadata.localImports,
    metadata.externalImports || '—',
  ];
});

const buildGeneratedSection = files => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'));
  const sourceFiles = files.filter(file => toPosix(path.relative(PROJECT_ROOT, file)).startsWith('src/'));
  const screens = sourceFiles.filter(file => /Screen\.(jsx?|tsx?)$/.test(file));
  const components = sourceFiles.filter(file => file.includes(`${path.sep}components${path.sep}`));
  const localeFiles = sourceFiles.filter(file => file.includes(`${path.sep}i18n${path.sep}locales${path.sep}`));
  const apiRows = extractApiOperations();
  const routes = extractRoutes(files);
  const dependencies = dependencyRows(packageJson);
  const featureData = featureRows(files);
  const directories = directoryRows(files);
  const inventory = fileRows(files);

  const lines = [
    START_MARKER,
    '## Section 12: Current Project Structure — Excel-Ready Source of Truth',
    '',
    '> This section is generated from the live workspace by `npm run docs:structure`. Do not manually edit content between the project-structure markers. `npm run check:imports` regenerates it before validating imports.',
    '',
    '### 12.1 Snapshot Summary',
    '',
    markdownTable(
      ['Metric', 'Current Value', 'Meaning'],
      [
        ['Application', packageJson.name, 'React Native package/application identifier'],
        ['Application version', packageJson.version, 'JavaScript package version'],
        ['React Native', packageJson.dependencies?.['react-native'] || 'Unknown', 'Runtime framework version'],
        ['React', packageJson.dependencies?.react || 'Unknown', 'React runtime version'],
        ['Node engine', packageJson.engines?.node || 'Not declared', 'Required Node.js version'],
        ['Feature modules', featureData.length, 'Business-owned modules under src/features'],
        ['Maintained source files', sourceFiles.length, 'Files under src excluding generated output'],
        ['Screens', screens.length, 'Application and feature screen components'],
        ['Component files', components.length, 'Shared and feature-owned components/modals'],
        ['Registered navigation routes', routes.length, 'Stack, drawer, and tab registrations'],
        ['API client operations', apiRows.length, 'Methods exposed by the central api object'],
        ['Supported locales', localeFiles.length, 'Per-language translation dictionaries'],
        ['Runtime dependencies', Object.keys(packageJson.dependencies || {}).length, 'Production npm packages'],
        ['Development dependencies', Object.keys(packageJson.devDependencies || {}).length, 'Build and test npm packages'],
        ['Maintained project files', files.length, 'All inventoried files excluding generated/vendor directories'],
      ],
    ),
    '',
    '### 12.2 Excel Workbook Mapping',
    '',
    markdownTable(
      ['Suggested Worksheet', 'Source Subsection', 'Primary Key', 'Purpose'],
      [
        ['Overview', '12.1 Snapshot Summary', 'Metric', 'Project totals and technology versions.'],
        ['Modules', '12.4 Feature Module Ownership', 'Feature Module', 'Business ownership and public feature surface.'],
        ['Directories', '12.5 Directory Inventory', 'Directory', 'Folder hierarchy, counts, and responsibilities.'],
        ['Routes', '12.6 Navigation Route Inventory', 'Scope + Route Name', 'Navigation registration and component mapping.'],
        ['API Operations', '12.7 API Client Operation Inventory', 'Operation + Occurrence', 'Central API method and HTTP endpoint mapping.'],
        ['Localization', '12.8 Localization Inventory', 'Locale Code', 'Supported languages and dictionary locations.'],
        ['Dependencies', '12.9 Dependency Inventory', 'Scope + Package', 'Runtime and development package versions.'],
        ['Files', '12.10 Complete Maintained File Inventory', 'File ID', 'One normalized row per maintained project file.'],
        ['Activity Log', 'Section 10', 'Date + Component/File', 'Chronological implementation and bug-fix history.'],
      ],
    ),
    '',
    '### 12.3 Architecture and Dependency Rules',
    '',
    markdownTable(
      ['Layer', 'Path', 'Owns', 'Allowed Dependency Direction'],
      [
        ['Application shell', code('src/app'), 'Startup, global providers, navigation composition', 'May import feature public barrels and shared modules.'],
        ['Feature modules', code('src/features/<module>'), 'Business screens and feature-only components', 'May import shared modules; cross-feature usage should go through feature index.js public exports.'],
        ['Shared layer', code('src/shared'), 'Reusable components, constants, i18n, API service, utilities, and shared assets', 'Must not depend on feature screens or app navigation.'],
        ['Native Android', code('android'), 'Gradle, manifest, Kotlin bootstrap, Android resources', 'Hosts the React Native Android runtime.'],
        ['Native iOS', code('ios'), 'Xcode, CocoaPods, Swift bootstrap, iOS resources/privacy metadata', 'Hosts the React Native iOS runtime.'],
        ['Root assets', code('assets'), 'Branding, general images, and linkable fonts', 'Consumed by JavaScript and native asset-linking configuration.'],
        ['Tooling/tests', code('scripts, __tests__'), 'Structure generation, import validation, and smoke tests', 'May inspect application files but does not ship as application functionality.'],
      ],
    ),
    '',
    '### 12.4 Feature Module Ownership',
    '',
    markdownTable(['Feature Module', 'Business Responsibility', 'Screen Count', 'Screens', 'Feature Components', 'Public Exports'], featureData),
    '',
    '### 12.5 Directory Inventory',
    '',
    markdownTable(['Directory', 'Direct Files', 'Total Descendant Files', 'Responsibility'], directories),
    '',
    '### 12.6 Navigation Route Inventory',
    '',
    markdownTable(['Navigator Scope', 'Route Name', 'Registered Component', 'Registration File'], routes),
    '',
    '### 12.7 API Client Operation Inventory',
    '',
    '> Endpoints are extracted from `src/shared/services/api.js`. `Computed at runtime` indicates a custom request or dynamically assembled URL.',
    '',
    markdownTable(['API Operation', 'Occurrence', 'HTTP Transport', 'Endpoint Template'], apiRows),
    '',
    '### 12.8 Localization Inventory',
    '',
    markdownTable(['Locale Code', 'Language', 'Dictionary File', 'Registration'], localizationRows(files)),
    '',
    '### 12.9 Dependency Inventory',
    '',
    markdownTable(['Dependency Scope', 'Package', 'Declared Version'], dependencies),
    '',
    '### 12.10 Complete Maintained File Inventory',
    '',
    '> Excluded from this inventory: `.git`, `node_modules`, CocoaPods, Gradle caches, CMake output, native build directories, and other reproducible generated output. The preserved release AAB is a deliverable, not maintained source.',
    '',
    markdownTable(
      ['File ID', 'Layer', 'Module/Area', 'Type', 'Relative Path', 'Responsibility', 'Public Symbols', 'Local Imports', 'External Packages'],
      inventory,
    ),
    '',
    '### 12.11 Automatic Maintenance Contract',
    '',
    markdownTable(
      ['Trigger', 'Required Action', 'Result'],
      [
        ['Any maintained project file is added, moved, renamed, or removed', code('npm run docs:structure'), 'Regenerates all Section 12 tables from the live filesystem.'],
        ['Any source import is changed', code('npm run check:imports'), 'Regenerates Section 12, then verifies every relative import path.'],
        ['Any functional or UI change is completed', 'Append a dated entry to Section 10 and run the structure generator.', 'Keeps history and current architecture synchronized.'],
        ['Before Excel generation', code('npm run docs:structure'), 'Ensures workbook input reflects the latest maintained project state.'],
      ],
    ),
    '',
    `Generated-section boundaries: ${code(START_MARKER)} to ${code(END_MARKER)}.`,
    END_MARKER,
  ];

  return lines.join('\n');
};

const updateWorkflow = () => {
  const files = collectMaintainedFiles();
  const generated = buildGeneratedSection(files);
  const existing = fs.readFileSync(WORKFLOW_PATH, 'utf8');
  const start = existing.indexOf(START_MARKER);
  const end = existing.lastIndexOf(END_MARKER);
  let next;

  if (start >= 0 && end > start) {
    next = `${existing.slice(0, start)}${generated}${existing.slice(end + END_MARKER.length)}`;
  } else {
    next = `${existing.trimEnd()}\n\n${generated}\n`;
  }

  const changed = next !== existing;
  if (changed) fs.writeFileSync(WORKFLOW_PATH, next, 'utf8');
  console.log(`${changed ? 'Updated' : 'Verified'} workflow.md project structure: ${files.length} maintained files inventoried.`);
};

updateWorkflow();
