import { Client, Collection, Events, GatewayIntentBits, Message } from 'discord.js';
import { SupabaseClient } from '@supabase/supabase-js';


import { command as link } from '../commands/link.js';


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
                const cmd: string[] = msg.content.split(/ +/g);
                switch (cmd[0]) {
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

        // Custom client type
        interface CustomClient extends Client {
            commands: Collection<string, any>;
        }

        const client: CustomClient = <CustomClient>(new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        }));

        // Set up slash commands
        const commands = [];
        client.commands = new Collection();
        client.commands.set(link.data.name, link);
        commands.push(link.data.toJSON());

        client.once(Events.ClientReady, c => {
            console.log(`Ready! Logged in as ${c.user.tag}`);

            client.on(Events.MessageCreate, async msg => await _this.chatHandler(msg));
        });

        client.login(this.token);
    }
}