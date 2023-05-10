import { HelixUser } from "@twurple/api";
import { MinecraftUser, TwitchUser } from "./interfaces.js";


// General API Call
async function apiCall(url: string, method: string, body?: any): Promise<any | undefined> {
    const result = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'NeuralNexus/1.0 (https://nerualnexus.dev) API/DiscordBot/TwitchBot'
        },
        body: JSON.stringify(body)
    }).then(async (res) => res.json()).catch(err => undefined);

    return result;
}

// Get Minecraft Java User
export async function getMinecraftJavaUser(username: string): Promise<MinecraftUser | undefined> {
    const result = await apiCall(`https://playerdb.co/api/player/minecraft/${username}`, 'GET');
    if (!result.success) return undefined;
    const user = result.data.player;

    return <MinecraftUser>{
        id: user.id,
        username: user.username,
        skin: `https://crafatar.com/skins/${user.id}`
    };
}

// Get Minecraft Bedrock User
export async function getMinecraftBedrockUser(username: string, prefix: string = "."): Promise<MinecraftUser | undefined> {
    username = username.replace(prefix, '');
    const result = await apiCall(`https://uuid.kejona.dev/api/v1/gamertag/${username}`, 'GET');

    const geyserSkin = await apiCall(`https://api.geysermc.org/v2/skin/${result.xuid}`, 'GET');

    return <MinecraftUser>{
        id: result.floodgateuid,
        username: `${prefix}${result.gamertag}`,
        skin: `https://textures.minecraft.net/texture/${geyserSkin.texture_id}`
    };
}

// Get Minecraft User
export async function getMinecraftUser(username: string, prefix?: string): Promise<MinecraftUser | undefined> {
    let user = await getMinecraftJavaUser(username);
    if (!user && prefix) user = await getMinecraftBedrockUser(username, prefix);
    if (!user) user = await getMinecraftBedrockUser(username);
    return user;
}

// Get Twitch User with Helix
export async function getTwitchUserFromHelix(identifier: string, identifierType: string): Promise<TwitchUser | undefined> {
    try {
        const oauth = await fetch(`https://id.twitch.tv/oauth2/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'User-Agent': 'NeuralNexus/1.0 (https://nerualnexus.dev) API/DiscordBot/TwitchBot'
            },
            body: `client_id=${process.env.TWITCH_CLIENT_ID}&client_secret=${process.env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials`
        });

        const oauth_data = await oauth.json();

        const result = await fetch(`https://api.twitch.tv/helix/users?${identifierType}=${identifier}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'NeuralNexus/1.0 (https://nerualnexus.dev) API/DiscordBot/TwitchBot',
                'Authorization': `Bearer ${oauth_data.access_token}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID
            }
        });
        return (await result.json())?.data[0];
    } catch (error) {
        return undefined;
    }
}

// Get Twitch User from Username
export async function getTwitchUserFromUsername(username: string): Promise<TwitchUser | undefined> {
    return (await getTwitchUserFromHelix(username, 'login'));
}

// Get Twitch User from ID
export async function getTwitchUserFromID(id: string): Promise<TwitchUser | undefined> {
    return (await getTwitchUserFromHelix(id, 'id'));
}

// Twurple Helix Mapper
export function mapHelixUser(user: HelixUser): TwitchUser {
    return <TwitchUser>{
        id: user.id,
        login: user.name,
        display_name: user.displayName,
        type: user.type,
        broadcaster_type: user.broadcasterType,
        description: user.description,
        profile_image_url: user.profilePictureUrl,
        offline_image_url: user.offlinePlaceholderUrl,
    };
}

// TwitchUser Mapper
export function mapTwitchUser(user: TwitchUser): HelixUser {
    return <HelixUser>{
        id: user.id,
        name: user.login,
        displayName: user.display_name,
        type: user.type,
        broadcasterType: user.broadcaster_type,
        description: user.description,
        profilePictureUrl: user.profile_image_url,
        offlinePlaceholderUrl: user.offline_image_url,
    };
}