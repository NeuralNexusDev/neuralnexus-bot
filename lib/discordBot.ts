import { Client, Events, GatewayIntentBits, Message } from 'discord.js';

export class DiscordBot {
    // Properties
    private token: string;
    private db: databaseHandler;
    private sbh: supabaseHandler;

    // Constructor
    constructor() {
        this.token = <string>process.env.DISCORD_TOKEN;
        this.dataSource = new dataSource();
        this.db = new databaseHandler();
    }

    async chatHandler(msg: Message) {
        try {
            if (msg.author.bot) return;
            if (msg.content.startsWith(this.options.discord.commandPrefix)) {
                // Parse command
                const command: string[] = msg.content.split(/ +/g);
                const commandKeys: string[] = Object.keys(this.options.discord.commands);

                if (commandKeys.includes(command[0])) {
                    switch (command[0]) {
                        // Add staff command
                        case this.options.discord.commands["addstaff"]:
                            // Check if user is staff
                            // Check if user is in database
                            // Add user to database
                            // Add user to staff role
                            break;

                        // Adds a streamer to the bot's watchlist
                        case this.options.discord.commands["add"]:
                            // Check if user is staff
                            // Get helix twitch user
                            // Check if user is in database
                            // Add user to database
                            // Add user to watchlist
                            break;

                        // leaderboard with all members watchtime averages
                        case this.options.discord.commands["averages"]:
                            // Pull top 10-20 users from database
                            // Send message with averages
                            break;

                        // allows users to check their current average watchtime
                        case this.options.discord.commands["myaverage"]:
                            // Check if user is in database
                            // Pull user from database
                            // Send message with average
                            break;

                        // displays average viewer stats for @user or user who use command if no one was @ed(for members and staff)
                        case this.options.discord.commands["averageviewer"]:
                            // Check if user is in database
                            // Pull user from database
                            // Send message with average
                            break;

                        // gets watchtime from twitch bots modded channels and announces the top supporter and gives them the top supporter role(this should look at a 30 day period as this will be given out monthly)and once at the end of the year)
                        case this.options.discord.commands["topsupporter"]:
                            // Check if user is staff
                            // Get top supporter from database
                            // Send message with top supporter
                            // Add top supporter role
                            // Remove top supporter role from previous top supporter
                            break;

                        // top bits sender for my channel only this will be monthly
                        case this.options.discord.commands["topbitter"]:
                            // Check if user is staff
                            // Get top bitter from database
                            // Send message with top bitter
                            // Add top bitter role
                            // Remove top bitter role from previous top bitter
                            break;

                        // top gifted sub sender for my channel this will be monthly
                        case this.options.discord.commands["topgifter"]:
                            // Check if user is staff
                            // Get top gifter from database
                            // Send message with top gifter
                            // Add top gifter role
                            // Remove top gifter role from previous top gifter
                            break;

                        case this.options.discord.commands["test"]:
                            msg.channel.send("Test command");
                            break;
                        default:
                            break;
                    }
                }
            }
        } catch (error) {
            console.log(error);
            fs.appendFileSync("./dataStore/error.log", `[${(new Date()).toJSON()}]: ${error}\n`);
        }
    }

    async start() {
        this.options = await this.dataSource.getOptions();
        const _this = this;

        const client: Client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        client.once(Events.ClientReady, c => {
            console.log(`Ready! Logged in as ${c.user.tag}`);

            client.on(Events.MessageCreate, async msg => await _this.chatHandler(msg));
        });

        client.login(this.token);
    }
}