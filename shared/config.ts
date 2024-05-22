import { YacaStereoMode } from "./enums.js";

export const Config = {
    DISCONNECT_TIMEOUT: 120, //Disconnect timeout in seconds if voice plugin not activated, 0 for no timeout.
    UNIQUE_SERVER_ID: '0N5QgVGsJfHpBC5bdtOUn+OJ7a4=',
    CHANNEL_ID: 5, //InGame Voice Channel
    CHANNEL_PASSWORD: "jWujNA/W0't*iTRGP/CY",
    DEFAULT_CHANNEL_ID: 1, // Entry Hall channel
    USE_WHISPER: false,
    MAX_RADIO_CHANNELS: 99,
    MAX_VOICE_RANGE: 50,
    MAX_PHONE_SPEAKER_RANGE: 5,

    defaultRadioChannelSettings: {
        volume: 1,
        stereo: YacaStereoMode.STEREO,
        muted: false,
        frequency: 0,
    },

    voiceRangesEnum: {
        1: 1,
        2: 3,
        3: 8,
        4: 15,
        5: 20,
        6: 25,
        7: 30,
        8: 40,
    },

    lipsyncAnims: {
        true: {
            name: "mic_chatter",
            dict: "mp_facial"
        },
        false: {
            name: "mood_normal_1",
            dict: "facials@gen_male@variations@normal"
        }
    },
}