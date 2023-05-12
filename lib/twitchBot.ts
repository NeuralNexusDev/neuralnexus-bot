import { ApiClient } from "@twurple/api";
import { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import { SupabaseClient } from "@supabase/supabase-js";


import { DataBaseResponse, DatabaseHandler } from "./databaseHandler.js";
import { SupabaseHandler } from "./supabaseHandler.js";
import { DiscordUser, MinecraftUser, TwitchUser, User } from "./interfaces.js";
import { getMinecraftUser, mapHelixUser } from "./accountUtils.js";
import { LinkAccount } from "./linkAccount.js";


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
                const broadcasterUser: TwitchUser = mapHelixUser(await this.apiClient.users.getUserByName(channel.replace('#', '')));

                let dbresult: DataBaseResponse<User>;
                switch (cmd[0]) {
                    // Account link command
                    case '!link':
                        console.log(cmd);
                        if (cmd.length == 3) {
                            const platform = cmd[1].toLowerCase();
                            const username = cmd[2];

                            dbresult = await this.db.getUser("twitch", "id", twitchUser.id);
                            let user: User = dbresult.success ? dbresult.data : { id: "", twitch: <TwitchUser>twitchUser };

                            if (platform === 'minecraft') {
                                const minecraftUser: MinecraftUser = await getMinecraftUser(username);
                                if (!minecraftUser) {
                                    return await this.chatClient.say(channel, `@${user} Invalid Minecraft username`);
                                }

                                dbresult = await this.db.updateUser(user.id, { minecraft: minecraftUser });

                                if (dbresult?.error) {
                                    console.log(dbresult.error);
                                    if (dbresult.error.code === '23505') {
                                        return await this.chatClient.say(channel, `@${user} Minecraft account already linked`);
                                    }
                                    return await this.chatClient.say(channel, `@${user} Error linking Minecraft account`);
                                }

                                const accountType = username.match(/^\.+[^\s]+$/) ? 'Minecraft Bedrock' : 'Minecraft Java';

                                return await this.chatClient.say(channel, `@${user} Your ${accountType} account has been linked`);

                            } else if (platform === 'discord') {
                                const discordUser: DiscordUser = {
                                    id: "",
                                    tag: `${username}?confirm?${twitchUser.login}`,
                                }

                                dbresult = await this.db.updateUser(user.id, { discord: discordUser });

                                if (dbresult?.error) {
                                    console.log(dbresult.error);
                                    return await this.chatClient.say(channel, `@${user} Error linking Discord account`);
                                }

                                return await this.chatClient.say(channel, `@${user} Pending confirmation of your Discord account, please confirm the account link using our Discord Bot: /link twitch ${user}`);
                            }

                            dbresult = await this.db.updateUser(user.id, { [platform]: username });

                            if (dbresult?.error) {
                                console.log(dbresult.error);
                                return await this.chatClient.say(channel, `@${user} Error linking account`);
                            }

                            return await this.chatClient.say(channel, `@${user} Your ${platform} account has been linked`);

                        } else {
                            return await this.chatClient.say(channel, `@${user} Wrong arguments. Correct usage: "!link platform platformUsername"`);
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
