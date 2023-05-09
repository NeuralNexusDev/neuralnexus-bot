import { SupabaseClient } from "@supabase/supabase-js";
import { AccessToken } from "@twurple/auth";
import { TwitchUser } from "./interfaces.js";


// Generic Supabase Response
export type SupabaseResponse<T> = {
    success: boolean,
    data?: T,
    error?: any
}

export type AllTwitchChannelNames = string[];

export interface TwitchToken {
    id: string,
    access_token?: string,
    expires_in?: number,
    refresh_token?: string,
    scope?: string[],
    token_type?: string
    obtainment_timestamp?: number
}


// Supabase Handler
export class SupabaseHandler {
    // Properties
    private supabase: SupabaseClient;

    // Constructor
    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    // Methods

    // Get all Twitch channel names
    async getAllTwitchChannelNames(): Promise<SupabaseResponse<AllTwitchChannelNames>> {
        try {
            const { data, error } = await this.supabase
                .from("twitch_users")
                .select("login");

            let names = [];
            for (let user in data) {
                names.push(data[user].login);
            }

            if (error) {
                console.log(error);
                return { success: false, error: error };
            }

            return { success: true, data: names };

        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }

    // Token Handlers

    // Map Twurple token data to DB format
    mapTokenToDB(twitchID: string, token: AccessToken): TwitchToken {
        return {
            id: twitchID,
            access_token: token.accessToken,
            refresh_token: token.refreshToken,
            scope: token.scope,
            expires_in: token.expiresIn,
            obtainment_timestamp: token.obtainmentTimestamp
        }
    }

    // Map DB token data to Twurple format
    mapTokenToTwurple(token: TwitchToken): AccessToken {
        return {
            accessToken: token.access_token,
            refreshToken: token.refresh_token,
            scope: token.scope,
            expiresIn: token.expires_in,
            obtainmentTimestamp: token.obtainment_timestamp
        }
    }

    // Getter
    async get<T extends { id: string }, R>(object: T, table: string, select?: any): Promise<SupabaseResponse<R>> {
        try {
            if (!select) select = "*";
            // Get the data
            const { data, error } = await this.supabase
                .from(table)
                .select(select)
                .eq("twitchID", object.id)
                .single();

            if (error) {
                console.log(error);
                return { success: false, error: error };
            }

            return { success: true, data: <R><unknown>data };
        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }

    // Setter
    async set<T extends { id: string }, R>(object: T, table: string): Promise<SupabaseResponse<R>> {
        try {
            // Insert the data
            const { data, error } = await this.supabase
                .from(table)
                .insert([object])
                .eq("twitchID", object.id);

            if (error) {
                console.log(error);
                return { success: false, error: error };
            }

            return { success: true, data: <R><unknown>object };
        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }

    // Updater
    async update<T extends { id: string }, R>(object: T, table: string): Promise<SupabaseResponse<R>> {
        try {
            // Get the current data
            const current: SupabaseResponse<R> = await this.get<T,R>(object, table);
            if (!current.success) {
                return await this.set<T,R>(object, table);
            }

            // Merge the data
            object = { ...current.data, ...object };

            // Update the data
            const { data, error } = await this.supabase
                .from(table)
                .update(object)
                .eq("twitchID", object.id);

            if (error) {
                console.log(error);
                return { success: false, error: error };
            }

            return { success: true, data: <R><unknown>object };
        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }

    // Get the Twitch token from the database
    async getToken(id?: string): Promise<SupabaseResponse<TwitchToken>> {
        return await this.get<TwitchUser, TwitchToken>({ id }, "twitch_tokens");
    }

    // Update the Twitch token in the database
    async updateToken(token: TwitchToken): Promise<SupabaseResponse<TwitchToken>> {
        return await this.update<TwitchToken, TwitchToken>(token, "twitch_tokens");
    }
}