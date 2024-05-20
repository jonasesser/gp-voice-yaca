import * as Athena from '@AthenaServer/api/index.js';
import { LOCALE } from "@AthenaShared/locale/locale.js";

import { LOCALES_EN } from "@AthenaPlugins/gp-translations-example/shared/locales/locales_en.js";
import { LOCALES_DE } from "@AthenaPlugins/gp-translations-example/shared/locales/locales_de.js";
import { LOCALES_KEYS } from '@AthenaPlugins/gp-translations-example/shared/locales/locales_keys.js';

export class RegisterLocales {
    static async init() {
        for (const key in LOCALES_KEYS) {
            Athena.locale.registerLocaleKey(key, LOCALES_EN[key], LOCALE.English);
            Athena.locale.registerLocaleKey(key, LOCALES_DE[key], LOCALE.German);
        }
    }
}

