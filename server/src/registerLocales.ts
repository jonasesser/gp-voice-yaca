import { LOCALES_DE } from '@AthenaPlugins/gp-voice-yaca/shared/locale/locales_de.js';
import { LOCALES_EN } from '@AthenaPlugins/gp-voice-yaca/shared/locale/locales_en.js';
import { LOCALES_KEYS } from '@AthenaPlugins/gp-voice-yaca/shared/locale/locales_keys.js';
import * as Athena from '@AthenaServer/api/index.js';
import { LOCALE } from "@AthenaShared/locale/locale.js";

export class RegisterLocales {
    static async init() {
        for (const key in LOCALES_KEYS) {
            Athena.locale.registerLocaleKey(key, LOCALES_EN[key], LOCALE.English);
            Athena.locale.registerLocaleKey(key, LOCALES_DE[key], LOCALE.German);
        }
    }
}

