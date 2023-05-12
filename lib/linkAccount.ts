import { getMinecraftUser, getTwitchUserFromUsername } from "./accountUtils.js";
import { MinecraftUser, TwitchUser, User } from "./interfaces.js";

import { DataBaseResponse, DatabaseHandler } from './databaseHandler.js';


interface LinkSuccess<T> {
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
        let dbresult: DataBaseResponse<User>;

        // get twitchUser from twitchUsername
        const twitchUser: TwitchUser = await getTwitchUserFromUsername(username);

        if (!twitchUser) {
            return { success: false, error: "Invalid Twitch username"};
        }

        // Get User from TwitchUser
        dbresult = await this.db.getUser("twitch", "id", twitchUser.id);

        if (dbresult?.error) {
            return { success: false, error: "An error occurred while linking your account"};
        }

        // Link account
        dbresult = await this.db.updateUser(user.id, { twitch: twitchUser });

        if (dbresult?.error) {
            return { success: false, error: "An error occurred while linking your account"};
        }

        return { success: true, data: "Your Twitch account has been linked" };
    }
    
    async linkMinecraftAccount(username: string, user: User): Promise<LinkSuccess<string>> {
        const minecraftUser: MinecraftUser = await getMinecraftUser(username);
    
        if (!minecraftUser) {
            return { success: false, error: "Invalid Minecraft username"}
        }
    
        let dbresult = await this.db.updateUser(user.id, { minecraft: minecraftUser });
    
        if (dbresult?.error) {
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
    
        const embed = {
            color: 0x65bf65,
            description: `Your ${accountType} account has been linked`,
        };
        return { success: true, data: `Your ${accountType} account has been linked` };
    }
    
    async linkAccount(subcommand: string, platform: string, username: string, platformId: string, user: User): Promise<LinkSuccess<string>> {
        try {
            let dbresult: DataBaseResponse<User>;
            switch (subcommand) {
                // Link Game Account
                case "game":
                    switch (platform) {
                        // Minecraft
                        case 'minecraft':
                            return await this.linkMinecraftAccount(username, user);
                    }
                    // Generic catch-all
                    dbresult = await this.db.updateUser(user.id, { [platform]: username });

                // Link Twitch Account
                case 'twitch':
                    return await this.linkTwitchAccount(username, platformId, user);
            }
    
            if (dbresult?.error) {
                console.log(dbresult.error);
                return { success: false, error: "An error occurred while linking your account"}
            } else {
                return { success: true, data: `Your ${platform} account has been linked` };
            }
    
        } catch (error) {
            console.log(error);
            return { success: false, error: error };
        }
    }
}
