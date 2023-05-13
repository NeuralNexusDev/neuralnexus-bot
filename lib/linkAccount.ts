import { getMinecraftUser, getTwitchUserFromUsername } from "./accountUtils.js";
import { MinecraftUser, TwitchUser, User } from "./interfaces.js";

import { DataBaseResponse, DatabaseHandler } from './databaseHandler.js';


export interface LinkSuccess<T> {
    success: boolean;
    data?: T;
    error?: any;
}

export class LinkAccount {
    // Properties
    public db: DatabaseHandler;

    // Constructor
    constructor(database: any) {
        this.db = new DatabaseHandler(database);
    }

    // Methods
    async linkTwitchAccount(username: string, platformId: string, user: User): Promise<LinkSuccess<string>> {
        // get twitchUser from twitchUsername
        const twitchUser: TwitchUser = await getTwitchUserFromUsername(username);

        if (!twitchUser) {
            return { success: false, error: "Invalid Twitch username"};
        }

        // Check if account is already linked
        let dbresult: DataBaseResponse<User> = await this.db.getUser("minecraft", "id", twitchUser.id);

        if (dbresult.success === false && dbresult?.error !== "User not found") {
            console.log(dbresult.error);
            return { success: false, error: "An error occurred while linking your account"}
        } else if (dbresult.success === true && dbresult.data.id !== user.id) {
            return { success: false, error: "This Minecraft account has already been linked" };
        }

        dbresult = await this.db.updateUser(user.id, { twitch: twitchUser });

        // Get User from TwitchUser
        dbresult = await this.db.getUser("twitch", "id", twitchUser.id);

        if (dbresult?.error) {
            return { success: false, error: "An error occurred while linking your account"};
        }

        // Link account
        dbresult = await this.db.updateUser(user.id, { twitch: twitchUser });

        if (dbresult?.error) {
            console.log(dbresult.error);
            return { success: false, error: "An error occurred while linking your account"};
        }

        return { success: true, data: "Your Twitch account has been linked" };
    }
    
    async linkMinecraftAccount(username: string, user: User): Promise<LinkSuccess<string>> {
        const minecraftUser: MinecraftUser = await getMinecraftUser(username);

        if (!minecraftUser) {
            return { success: false, error: "Invalid Minecraft username"}
        }

        // Check if account is already linked
        let dbresult: DataBaseResponse<User> = await this.db.getUser("minecraft", "id", minecraftUser.id);

        if (dbresult.success === false && dbresult?.error !== "User not found") {
            console.log(dbresult.error);
            return { success: false, error: "An error occurred while linking your account"}
        } else if (dbresult.success === true && dbresult.data.id !== user.id) {
            return { success: false, error: "This Minecraft account has already been linked" };
        }

        dbresult = await this.db.updateUser(user.id, { minecraft: minecraftUser });

        if (dbresult?.error) {
            console.log(dbresult.error);
            // if (dbresult.error.code === '23505') {
            //     const embed = {
            //         color: 0xe6d132,
            //         description: "This Minecraft account has already been linked",
            //     };
            //     return await interaction.editReply({ embeds: [embed]});
            // }
            return { success: false, error: "An error occurred while linking your account"}
        }

        const accountType = username.match(/^\.+[^\s]+$/) ? 'Minecraft Bedrock' : 'Minecraft Java';

        return { success: true, data: `Your ${accountType} account has been linked` };
    }
    
    async linkAccount(subcommand: string, toPlatform: string, toPlatformUsername: string, fromPlatformId: string, user: User): Promise<LinkSuccess<string>> {
        try {
            let dbresult: DataBaseResponse<User>;
            switch (subcommand) {
                // Link Game Account
                case "game":
                    switch (toPlatform) {
                        // Minecraft
                        case 'minecraft':
                            return await this.linkMinecraftAccount(toPlatformUsername, user);
                    }
                    // Generic catch-all
                    dbresult = await this.db.updateUser(user.id, { [toPlatform]: toPlatformUsername });

                // Link Twitch Account
                case 'twitch':
                    return await this.linkTwitchAccount(toPlatformUsername, fromPlatformId, user);
            }

            if (dbresult?.error) {
                console.log(dbresult.error);
                return { success: false, error: "An error occurred while linking your account"}
            } else {
                return { success: true, data: `Your ${toPlatform} account has been linked` };
            }

        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }
}
