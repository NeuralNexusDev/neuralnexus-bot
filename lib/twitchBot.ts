import { ApiClient } from "@twurple/api";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import { SupabaseClient } from "@supabase/supabase-js";


import { DataBaseResponse, DatabaseHandler } from "./databaseHandler.js";
import { SupabaseHandler } from "./supabaseHandler.js";
import { DiscordUser, MinecraftUser, TwitchUser, User } from "./interfaces.js";
import { getMinecraftUser, mapHelixUser } from "./accountUtils.js";
import { LinkAccount, LinkSuccess, PlatformInfo } from "./linkAccount.js";


export class TwitchBot extends LinkAccount {
    // Properties
    private authProvider: RefreshingAuthProvider;
    private apiClient: ApiClient;
    private chatClient: ChatClient;
    private botName: string;
    private botID: string;
    private twitchNames: string[];
    private clientID: string;
    private clientSecret: string;
    private sbh: SupabaseHandler;

    // Constructor
    constructor(database: any, supabase: SupabaseClient) {
        super(database);
        this.clientID = <string>process.env.TWITCH_CLIENT_ID;
        this.clientSecret = <string>process.env.TWITCH_CLIENT_SECRET;
        this.botName = <string>process.env.TWITCH_CHANNEL;
        this.botID = <string>process.env.TWITCH_BOT_ID;
        this.sbh = new SupabaseHandler(supabase);
    }

    // Methods

    // Chat handler
    private async chatHandler(channel: string, user: string, text: string, msg: any) {
        try {
            if (text.startsWith("!")) {
                // Parse command
                const cmd = text.match(/([^\s]+)/g);
                const twitchUser: TwitchUser = mapHelixUser(await this.apiClient.users.getUserByName(user));

                let message: string;
                switch (cmd[0].toLowerCase()) {
                    // Account link command
                    case '!link':
                        if (cmd.length == 3) {
                            this.logger("twitch", channel, twitchUser.id, text);

                            const platform = cmd[1].toLowerCase();
                            const username = cmd[2];

                            let dbresult: DataBaseResponse<User> = await this.db.getUser("twitch", "id", twitchUser.id);
                            let user: User;
                            if (dbresult.success === false && dbresult.error === "User not found") {
                                dbresult = await this.db.createUser({ id: "", twitch: <TwitchUser>twitchUser });
                                if (dbresult.success === true) {
                                    user = dbresult.data;
                                }
                            } else {
                                user = dbresult.data;
                            }

                            if (dbresult.success === false) {
                                message = `@${twitchUser.login} An error occurred while linking your account`;
                                this.logger("twitch", channel, this.botID, message);
                                this.logger("twitch", channel, this.botID, dbresult.error);
                                return await this.chatClient.say(channel, message);
                            }

                            const fromPlatform: PlatformInfo = { platform: "twitch", username: twitchUser.login, id: twitchUser.id };
                            const toPlatform: PlatformInfo = { platform: platform, username: username };

                            let linkResult: LinkSuccess<string> = await this.linkAccount(fromPlatform, toPlatform, user);

                            message = linkResult.success === false ?
                                `@${twitchUser.login} ${linkResult.error}` :
                                `@${twitchUser.login} Your account has been linked`;
                            this.logger("twitch", channel, this.botID, message);
                            return await this.chatClient.say(channel, message);

                        } else {
                            message = `@${twitchUser.login} Wrong arguments. Correct usage: "!link platform platformUsername"`;
                            this.logger("twitch", channel, this.botID, message);
                            return await this.chatClient.say(channel, message);
                        }
                    default:
                        break;
                }
            }
        } catch(error) {
            console.log(error);
        }
    }

    // Init Twurple
    private async initTwurple() {
        try {
            // Auth Provider
            this.authProvider = new RefreshingAuthProvider({
                clientId: this.clientID,
                clientSecret: this.clientSecret,
                onRefresh: async (userId, newTokenData) => {
                    await this.sbh.updateToken(
                        this.sbh.mapTokenToDB(userId, newTokenData)
                    );
                }
            });

            // API
            this.apiClient = new ApiClient({ authProvider: this.authProvider });

            // Chat
            this.twitchNames = (await this.sbh.getAllTwitchChannelNames()).data;
            this.chatClient = new ChatClient({ authProvider: this.authProvider, channels: this.twitchNames });
        } catch (error) {
            console.log(error);
        }
    }

    // Start bot
    public async start() {
        await this.initTwurple();

        await this.authProvider.addUser(this.botID,
            this.sbh.mapTokenToTwurple((await this.sbh.getToken(this.botID)).data),
            ['chat']
        );

        await this.chatClient.connect();

        this.chatClient.onMessage(async (channel, user, text, msg) => {
            await this.chatHandler(channel, user, text, msg);
        });

        console.log("Twitch bot started");
    }
}
