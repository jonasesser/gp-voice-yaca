export enum YacaFilter {
    RADIO = "RADIO",
    MEGAPHONE = "MEGAPHONE",
    PHONE = "PHONE",
    PHONE_SPEAKER = "PHONE_SPEAKER",
    INTERCOM = "INTERCOM",
    PHONE_HISTORICAL = "PHONE_HISTORICAL",
};

export enum YacaStereoMode {
    MONO_LEFT = "MONO_LEFT",
    MONO_RIGHT = "MONO_RIGHT",
    STEREO = "STEREO",
};

export enum YacaBuildType {
    RELEASE = 0,
    DEVELOP = 1
};

export enum CommDeviceMode {
    SENDER = 0,
    RECEIVER = 1,
    TRANSCEIVER = 2,
};

export const PlayerVariables = {
    phoneCallMemberIds: "phoneCallMemberIds",
    range: "range",
};