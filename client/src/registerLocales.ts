import * as AthenaClient from '@AthenaClient/api/index.js';
import { LOCALES_DE } from '@AthenaPlugins/gp-voice-yaca/shared/locale/locales_de.js';
import { LOCALES_EN } from '@AthenaPlugins/gp-voice-yaca/shared/locale/locales_en.js';
import { LOCALES_KEYS } from '@AthenaPlugins/gp-voice-yaca/shared/locale/locales_keys.js';

import { LOCALE } from "@AthenaShared/locale/locale.js";

export class RegisterLocales {
    static async init() {

        for (const key in LOCALES_KEYS) {
            AthenaClient.locale.registerLocaleKey(key, LOCALES_EN[key], LOCALE.English);
            AthenaClient.locale.registerLocaleKey(key, LOCALES_DE[key], LOCALE.German);
        }
    }
}

