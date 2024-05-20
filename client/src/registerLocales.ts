import * as AthenaClient from '@AthenaClient/api/index.js';

import { LOCALES_EN } from "@AthenaPlugins/gp-translations-example/shared/locales/locales_en.js";
import { LOCALES_DE } from "@AthenaPlugins/gp-translations-example/shared/locales/locales_de.js";

import { LOCALE } from "@AthenaShared/locale/locale.js";

export class RegisterLocales {
    static async init() {

        for (const key in LOCALES_EN) {
            AthenaClient.locale.registerLocaleKey(key, LOCALES_EN[key], LOCALE.English);
            AthenaClient.locale.registerLocaleKey(key, LOCALES_DE[key], LOCALE.German);
        }
    }
}

