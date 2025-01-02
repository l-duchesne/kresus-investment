/* eslint no-process-exit: 0 */
let path = require('path');
let fs = require('fs');

import { makeLogger } from '../../server/helpers';

const ROOT = path.join(path.dirname(fs.realpathSync(__filename)), '..', '..');

let log = makeLogger('compare-locales');

const localesDir = path.join(ROOT, 'shared', 'locales');

let localesMap = new Map;

fs.readdirSync(localesDir).forEach(child => {
    let file = path.join(localesDir, child);
    if (fs.statSync(file).isDirectory())
        return;
    if (file.indexOf('.json') === -1)
        return;
    let format = child.replace('.json', '');
    localesMap.set(format, require(file));
    log.info(`Found ${format} locale...`);
});

let cache = new Map;
function buildKeys(localeObject) {
    function _(obj, prefix) {
        let keys = [];
        for (let k in obj) {
            if (!obj.hasOwnProperty(k))
                continue;

            let val = obj[k];
            let newPrefix = `${prefix}.${k}`;
            if (typeof val === 'object') {
                let subkeys = _(val, newPrefix);
                keys = keys.concat(subkeys);
            } else {
                keys.push(newPrefix);
            }
        }
        return keys;
    }
    if (!cache.has(localeObject))
        cache.set(localeObject, _(localeObject, ''));
    return cache.get(localeObject);
}

let allKeys = new Map;
for (let [format, locale] of localesMap) {
    let keys = buildKeys(locale);
    for (let k of keys) {
        let langs = allKeys.get(k) || [];
        langs.push(format);
        allKeys.set(k, langs);
    }
}

for (let [format, locale] of localesMap) {
    if (format === 'en')
        continue;

    let keys = new Set(buildKeys(locale));
    let missingKeys = [];
    for (let k of allKeys.keys()) {
        if (!keys.has(k)) {
            missingKeys.push(k);
        }
    }

    if (missingKeys.length) {
        missingKeys.sort();
        log.warn(`Missing keys in the ${format} locale: ${missingKeys.join(', ')}`);
    }
}

let englishLocale = localesMap.get('en');
if (!englishLocale) {
    log.error('No english locale!?');
    process.exit(1);
}

let englishKeys = new Set(buildKeys(englishLocale));

let hasError = false;
for (let [k, v] of allKeys) {
    if (!englishKeys.has(k)) {
        log.error(`Missing key (present in ${v.join(', ')}) in the english locale: ${k}`);
        hasError = true;
    }
}

if (hasError)
    process.exit(1);

log.info('CompareLocale: OK.');
process.exit(0);
