import { YacaStereoMode } from "./enums.js";

export const Config = {
    YACA_UNIQUE_SERVER_ID: '2342340N5QgVGsJfHpBC5bdtOUn+OJ7a4=',
    YACA_CHANNEL_ID: '2', //InGame Voice Channel
    YACA_CHANNEL_PASSWORD: '1234',
    YACA_DEFAULT_CHANNEL_ID: '1', // Entry Hall channel
    YACA_USE_WHISPER: false,
    YACA_MAX_RADIO_CHANNELS: 99,
    YACA_MAX_VOICE_RANGE: 50,
    YACA_MAX_PHONE_SPEAKER_RANGE: 5,

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