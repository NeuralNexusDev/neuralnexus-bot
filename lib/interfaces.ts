export interface TwitchUser {
    id: string,
    login?: string,
    display_name?: string,
    type?: string,
    broadcaster_type?: string,
    description?: string,
    profile_image_url?: string,
    offline_image_url?: string,
    view_count?: number
}

interface DiscordUserFlags {
    bitfield: number,
}

export interface DiscordUser {
    id: string,
    bot?: boolean,
    tag?: string,
    system?: boolean,
    flags?: DiscordUserFlags,
    username?: string,
    discriminator?: string,
    avatar?: string,
    banner?: any,
    accentColor?: any,
}

export interface MinecraftUser {
    id: string,
    username: string,
    skin?: string,
}

export type Steam64 = string;

export interface User {
    userID: string,
    twitchID?: string,
    twitchUser?: TwitchUser,
    discordID?: string,
    discordUser?: DiscordUser,
    minecraft?: string,
    minecraftUser?: MinecraftUser,
    steam64?: Steam64
}