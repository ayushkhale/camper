const fs = require('fs');
const os = require('os');
const path = require('path');

const translatorPath = path.join(
  os.tmpdir(),
  'camper-translation-tool',
  'node_modules',
  'bing-translate-api',
);
const { translate } = require(translatorPath);

const ROOT = path.resolve(__dirname, '..');
const ENGLISH_FILE = path.join(ROOT, 'src', 'i18n', 'locales', 'en.js');
const LOCALES_DIR = path.join(ROOT, 'src', 'i18n', 'locales');
const LANGUAGES = [
  ['mr', 'Marathi'],
  ['bn', 'Bengali'],
  ['ta', 'Tamil'],
  ['te', 'Telugu'],
  ['gu', 'Gujarati'],
  ['pa', 'Punjabi'],
];
const DELIMITER = '\uE000';
const MAX_BATCH_LENGTH = 1400;

const loadDictionary = (file, variableName) => {
  let source = fs.readFileSync(file, 'utf8');
  source = source.replace(`export default ${variableName};`, `return ${variableName};`);
  return Function(source)();
};

const clone = value => JSON.parse(JSON.stringify(value));

const collectStrings = (value, currentPath = [], result = []) => {
  Object.entries(value).forEach(([key, item]) => {
    const nextPath = [...currentPath, key];
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      collectStrings(item, nextPath, result);
    } else if (typeof item === 'string' && item.trim()) {
      result.push({ path: nextPath, text: item });
    }
  });
  return result;
};

const setAtPath = (target, keys, value) => {
  const parent = keys.slice(0, -1).reduce((current, key) => current[key], target);
  parent[keys[keys.length - 1]] = value;
};

const protectPlaceholders = (text) => {
  const placeholders = [];
  const protectedText = text.replace(/{{[^}]+}}/g, (placeholder) => {
    const token = `__PH_${placeholders.length}__`;
    placeholders.push({ token, placeholder });
    return token;
  });
  return { protectedText, placeholders };
};

const restorePlaceholders = (text, placeholders) => placeholders.reduce(
  (current, { token, placeholder }) => current.replaceAll(token, placeholder),
  text,
);

const buildBatches = entries => {
  const batches = [];
  let current = [];
  let currentLength = 0;

  entries.forEach((entry) => {
    const protectedEntry = { ...entry, ...protectPlaceholders(entry.text) };
    const addedLength = protectedEntry.protectedText.length + (current.length ? 1 : 0);
    if (current.length && currentLength + addedLength > MAX_BATCH_LENGTH) {
      batches.push(current);
      current = [];
      currentLength = 0;
    }
    current.push(protectedEntry);
    currentLength += protectedEntry.protectedText.length + (current.length > 1 ? 1 : 0);
  });

  if (current.length) batches.push(current);
  return batches;
};

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

const translateText = async (text, languageCode) => {
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await translate(text, 'en', languageCode);
      if (response?.translation) return response.translation;
      throw new Error('Translation service returned an empty response.');
    } catch (error) {
      lastError = error;
      await wait(attempt * 900);
    }
  }
  throw lastError;
};

const translateBatch = async (batch, languageCode) => {
  const source = batch.map(entry => entry.protectedText).join(DELIMITER);
  const translated = await translateText(source, languageCode);
  const parts = translated.split(DELIMITER);

  if (parts.length !== batch.length) {
    const individualResults = [];
    for (const entry of batch) {
      individualResults.push(await translateText(entry.protectedText, languageCode));
      await wait(120);
    }
    return individualResults;
  }

  return parts;
};

const writeLocale = (languageCode, languageName, dictionary) => {
  const source = [
    `// ${languageName} translation dictionary.`,
    `const ${languageCode} = ${JSON.stringify(dictionary, null, 2)};`,
    '',
    `export default ${languageCode};`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(LOCALES_DIR, `${languageCode}.js`), source, 'utf8');
};

const run = async () => {
  const english = loadDictionary(ENGLISH_FILE, 'en');
  const entries = collectStrings(english);
  const batches = buildBatches(entries);

  for (const [languageCode, languageName] of LANGUAGES) {
    const dictionary = clone(english);
    console.log(`[${languageName}] Translating ${entries.length} strings in ${batches.length} batches...`);

    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];
      console.log(`[${languageName}] Starting batch ${index + 1}/${batches.length}...`);
      const translations = await translateBatch(batch, languageCode);
      translations.forEach((translation, translationIndex) => {
        const entry = batch[translationIndex];
        setAtPath(
          dictionary,
          entry.path,
          restorePlaceholders(translation.trim(), entry.placeholders),
        );
      });
      console.log(`[${languageName}] Batch ${index + 1}/${batches.length} complete.`);
      await wait(180);
    }

    writeLocale(languageCode, languageName, dictionary);
    console.log(`[${languageName}] Locale written.`);
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
