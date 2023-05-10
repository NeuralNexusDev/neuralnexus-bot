import { Client, Events, GatewayIntentBits, Message } from 'discord.js';
import { SupabaseClient } from '@supabase/supabase-js';

import { DatabaseHandler } from "./databaseHandler.js";
import { SupabaseHandler } from "./supabaseHandler.js";


export class DiscordBot {
    // Properties
    private token: string;
    private db: DatabaseHandler;
    private sbh: SupabaseHandler;

    // Constructor
    constructor(database: any, supabase: SupabaseClient) {
        this.token = <string>process.env.DISCORD_TOKEN;
        this.db = new DatabaseHandler(database);
        this.sbh = new SupabaseHandler(supabase);
    }

    async chatHandler(msg: Message) {
        try {
            if (msg.author.bot) return;
            if (msg.content.startsWith("!")) {
                // Parse command
                const command: string[] = msg.content.split(/ +/g);
                switch (command[0]) {
                    // Account link command
                    case "!link":
                        console.log("link command");
                        break;
                }
            }
        } catch (error) {
            console.log(error);
        }
    }

    async start() {
        const _this = this;

        const client: Client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                // GatewayIntentBits.MessageContent
            ]
        });

        client.once(Events.ClientReady, c => {
            console.log(`Ready! Logged in as ${c.user.tag}`);

            client.on(Events.MessageCreate, async msg => await _this.chatHandler(msg));
        });

        client.login(this.token);
    }
}