export enum YACA_EVENTS {
    //Server to CLIENT
    CLIENT_INIT = 'client:yaca:init',
    CLIENT_DISCONNECT = 'client:yaca:disconnect',
    CLIENT_PHONE_MUTE = 'client:yaca:phoneMute',
    CLIENT_PHONE_OLD = 'client:yaca:phoneOld',
    CLIENT_PHONE = 'client:yaca:phone',
    CLIENT_RADIO_TALKING = 'client:yaca:radioTalking',
    CLIENT_RADIO_MUTE_STATE = 'client:yaca:setRadioMuteState',
    CLIENT_LEAVE_RADIO_CHANNEL = 'client:yaca:leaveRadioChannel',
    CLIENT_SET_RADIO_FREQUENCY = 'client:yaca:setRadioFrequency',
    CLIENT_ADD_PLAYERS = 'client:yaca:addPlayers',
    CLIENT_SET_MAX_VOICE_RANGE = 'client:yaca:setMaxVoiceRange',
    CLIENT_MUTE_TARGET = 'client:yaca:muteTarget',
    CLIENT_PLAYERS_TO_PHONE_SPEAKER_EMIT = 'client:yaca:playersToPhoneSpeakerEmit',
    
    
    //WEBVIEW to Client
    WV_CLIENT_CHANGE_ACTIVE_RADIO_CHANNEL = 'client:yaca:changeActiveRadioChannel',
    WV_CLIENT_CHANGE_RADIO_FREQUENCY = 'client:yaca:changeRadioFrequency',
    WV_CLIENT_MUTE_RADIO_CHANNEL = 'client:yaca:muteRadioChannel',

    //Client to SERVER
    SERVER_CONNECT = 'server:yaca:connect',
    SERVER_CALL_PLAYER = 'server:yaca:callPlayer',
    SERVER_CALL_PLAYER_OLD_EFFECT = 'server:yaca:callPlayerOldEffect',
    SERVER_CHANGE_PLAYER_ALIVE_STATUS = 'server:yaca:changePlayerAliveStatus',
    
    SERVER_RADIO_TALKING = 'server:yaca:radioTalking',
    SERVER_MUTE_ON_PHONE = 'server:yaca:muteOnPhone',
    SERVER_ENABLE_PHONE_SPEAKER = 'server:yaca:enablePhoneSpeaker',
    SERVER_PHONE_SPEAKER_EMIT = 'server:yaca:phoneSpeakerEmit',

    SERVER_CHANGE_VOICE_RANGE = 'server:yaca:changeVoiceRange',
    SERVER_LIP_SYNC = 'server:yaca:lipSync',
    SERVER_ADD_PLAYER = 'server:yaca:addPlayer',
    SERVER_USE_MEGAPHONE = 'server:yaca:useMegaphone',
    SERVER_NO_VOICE_PLUGIN = 'server:yaca:noVoicePlugin',
    SERVER_WS_READY = 'server:yaca:wsReady',
    SERVER_ENABLE_RADIO = 'server:yaca:enableRadio',
    SERVER_CHANGE_RADIO_FREQUENCY = 'server:yaca:changeRadioFrequency',
    SERVER_MUTE_RADIO_CHANNEL = 'server:yaca:muteRadioChannel',
    SERVER_CHANGE_ACTIVE_RADIO_CHANNEL = 'server:yaca:changeActiveRadioChannel',
}