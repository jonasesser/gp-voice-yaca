import { YacaStereoMode } from "./enums.js";

export const Config = {
    YACA_UNIQUE_SERVER_ID: '',
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

    //TODO MOVE TO TRANSLATIONS
    translations: {
        "plugin_not_activated": "Please activate your voiceplugin!",
        "connect_error": "Error while connecting to voiceserver, please reconnect!",
        "plugin_not_initializiaed": "Plugin not initialized!",
    
        // Error message which comes from the plugin
        "OUTDATED_VERSION": "You dont use the required plugin version!",
        "WRONG_TS_SERVER": "You are on the wrong teamspeakserver!",
        "NOT_CONNECTED": "You are on the wrong teamspeakserver!",
        "MOVE_ERROR": "Error while moving into ingame teamspeak channel!",
        "WAIT_GAME_INIT": "",
        "HEARTBEAT": ""
    }
}