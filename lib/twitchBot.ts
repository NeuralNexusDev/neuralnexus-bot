import { ApiClient, HelixChatChatter, HelixPaginatedResultWithTotal } from "@twurple/api";
import { AccessToken, RefreshingAuthProvider, exchangeCode } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import { SupabaseClient } from "@supabase/supabase-js";


import { DatabaseHandler } from "./databaseHandler.js";
import { SupabaseHandler } from "./supabaseHandler.js";


export class TwitchBot {
    // Properties
    private authProvider: RefreshingAuthProvider;
    private apiClient: ApiClient;
    private chatClient: ChatClient;
    private botName: string;
    private botID: string;
    private twitchNames: string[];
    private clientID: string;
    private clientSecret: string;
    private db: DatabaseHandler;
    private sbh: SupabaseHandler;

    // Constructor
    constructor(database: any, supabase: SupabaseClient) {
        this.clientID = <string>process.env.TWITCH_CLIENT_ID;
        this.clientSecret = <string>process.env.TWITCH_CLIENT_SECRET;
        this.botName = <string>process.env.TWITCH_CHANNEL;
        this.botID = <string>process.env.TWITCH_BOT_ID;
        this.db = new DatabaseHandler(database);
        this.sbh = new SupabaseHandler(supabase);
    }

    // Methods

    // Chat handler
    private async chatHandler(channel: string, user: string, text: string, msg: any) {
        try {
            if (text.startsWith("!")) {
                // Parse command
                const command: string[] = text.split(/ +/g);
                switch (command[0]) {
                    // Account link command
                    case "!link":
                        console.log("link command");
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
                clientId: process.env.TWITCH_CLIENT_ID,
                clientSecret: process.env.TWITCH_CLIENT_SECRET,
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
