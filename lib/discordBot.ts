import { Client, Collection, Events, GatewayIntentBits, Message, SlashCommandBuilder } from 'discord.js';
import { SupabaseClient } from '@supabase/supabase-js';


import { SupabaseHandler } from "./supabaseHandler.js";
import { LinkAccount } from './linkAccount.js';
import { DataBaseResponse } from './databaseHandler.js';
import { DiscordUser, MinecraftUser, TwitchUser, User } from './interfaces.js';
import { getMinecraftUser, getTwitchUserFromUsername } from './accountUtils.js';
import linkLocales from '../localizations/link.json' assert { type: "json" };


export class DiscordBot extends LinkAccount {
    // Properties
    private token: string;
    private sbh: SupabaseHandler;

    // Constructor
    constructor(database: any, supabase: SupabaseClient) {
        super(database);
        this.token = <string>process.env.DISCORD_TOKEN;
        this.sbh = new SupabaseHandler(supabase);
    }

    // Methods
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

        const link = {
            data: new SlashCommandBuilder()
                .setName('link')
                .setNameLocalizations(linkLocales.link.name)
                .setDescription('Link your accounts')
                .setDescriptionLocalizations(linkLocales.link.description)
                .setDefaultMemberPermissions(0)
                .setDMPermission(true)
                .addSubcommand(subcommand =>
                    subcommand.setName('twitch')
                        .setDescription('Link your Twitch account')
                        .setDescriptionLocalizations(linkLocales.link.twitch.description)
                        .addStringOption(option =>
                            option.setName('username')
                                .setNameLocalizations(linkLocales.link.global.variable.username.name)
                                .setDescription('Your Twitch username')
                                .setDescriptionLocalizations(linkLocales.link.global.variable.username.description)
                                .setRequired(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand.setName('game')
                        .setNameLocalizations(linkLocales.link.game.name)
                        .setDescription('Link your game account')
                        .setDescriptionLocalizations(linkLocales.link.game.description)
                        .addStringOption(option =>
                            option.setName('platform')
                                .setNameLocalizations(linkLocales.link.game.variable.platform.name)
                                .setDescription('The platform/game you play on')
                                .setDescriptionLocalizations(linkLocales.link.game.variable.platform.description)
                                .setRequired(true)
                                .addChoices(
                                    { name: 'Minecraft', value: 'minecraft' },
                                    { name: 'Steam64 ID', value: 'steam64' },
                                )
                        )
                        .addStringOption(option =>
                            option.setName('username')
                                .setNameLocalizations(linkLocales.link.global.variable.username.name)
                                .setDescription('Your username in the platform/game')
                                .setDescriptionLocalizations(linkLocales.link.global.variable.username.description)
                                .setRequired(true)
                        )
                ),
            async execute(interaction: any) {
                await interaction.deferReply({ ephemeral: true });
                const subcommand = interaction.options.getSubcommand();
                const discordID = interaction.user.id;
        
                let dbresult: DataBaseResponse<User>;
                switch (subcommand) {
                    // Link Game Account
                    case "game":
                        const platform = interaction.options.getString('platform');
                        const username = interaction.options.getString('username');
        
                        dbresult = await _this.db.getUser("discord", "id", discordID);
                        let user: User = dbresult.success ? dbresult.data : { id: "", discord: <DiscordUser>interaction.user };
        
                        switch (platform) {
                            // Minecraft
                            case "minecraft":
                                const minecraftUser: MinecraftUser = await getMinecraftUser(username);
        
                                if (!minecraftUser) {
                                    const embed = {
                                        color: 0xe6d132,
                                        description: "Invalid Minecraft username",
                                    };
                                    return await interaction.editReply({ embeds: [embed]});
                                }
        
                                dbresult = await _this.db.updateUser(user.id, { minecraft: minecraftUser });
        
                                if (dbresult?.error) {
                                    // if (dbresult.error.code === '23505') {
                                    //     const embed = {
                                    //         color: 0xe6d132,
                                    //         description: "This Minecraft account has already been linked",
                                    //     };
                                    //     return await interaction.editReply({ embeds: [embed]});
                                    // }
                                    const embed = {
                                        color: 0xbf0f0f,
                                        description: "An error occurred while linking your account",
                                    };
                                    return await interaction.editReply({ embeds: [embed]});
                                }
        
                                const accountType = username.match(/^\.+[^\s]+$/) ? 'Minecraft Bedrock' : 'Minecraft Java';
        
                                const embed = {
                                    color: 0x65bf65,
                                    description: `Your ${accountType} account has been linked`,
                                };
                                return await interaction.editReply({ embeds: [embed]});
                        }
        
                        // Generic catch-all
                        dbresult = await _this.db.updateUser(user.id, { [platform]: username });
                    // Link Twitch Account
                    case "twitch":
                        const twitchUsername: string = interaction.options.getString('username');
        
                        // get twitchUser from twitchUsername
                        const twitchUser: TwitchUser = await getTwitchUserFromUsername(twitchUsername);
        
                        if (!twitchUser) {
                            const embed = {
                                color: 0xe6d132,
                                description: "Invalid Twitch username",
                            };
                            return await interaction.editReply({ embeds: [embed]});
                        }
        
                        // Get User from TwitchUser
                        dbresult = await _this.db.getUser("twitch", "id", twitchUser.id);
        
                        if (dbresult?.error) {
                            console.log(dbresult.error);
                            const embed = {
                                color: 0xbf0f0f,
                                description: "An error occurred while linking your account",
                            };
                            return await interaction.editReply({ embeds: [embed]});
                        }
        
                        // Check to see if linking the right user
                        if (interaction.user.tag === dbresult?.data?.discord?.tag?.split("?confirm?")[0]) {
                            // Merge old user data into new user -- TODO: make this better
                            let oldUserID = (await this.db.getUser("discord", "id", discordID))?.data?.id;
                            if (oldUserID) {
                                const olddbresult = await this.db.getUserByID(oldUserID);
                                const delOldUser = await this.db.deleteUser(oldUserID);
                                if (olddbresult?.data) {
                                    let oldUser = olddbresult.data;
                                    oldUser.id = user.id;
                                    const updateUser = { ...oldUser, ...dbresult?.data}
                                    dbresult = await this.db.updateUser(user.id, updateUser);
                                }
                            }
        
                            dbresult = await _this.db.updateUser(user.id, {
                                discord: interaction.user,
                                twitch: twitchUser
                            });
        
                        // Message if no link pending
                        } else {
                            const embed = {
                                color: 0xe6d132,
                                description: "There is no link pending for this Twitch account, please link your Discord account in Twitch chat:\n```!link discord username#0000```",
                            };
                            return await interaction.editReply({ embeds: [embed]});
                        }
        
                        if (dbresult?.error) {
                            console.log(dbresult.error);
                            const embed = {
                                color: 0xbf0f0f,
                                description: "An error occurred while linking your account",
                            };
                            return await interaction.editReply({ embeds: [embed]});
                        }
        
                        const embed = {
                            color: 0x65bf65,
                            description: "Your Twitch account has been linked",
                        };
                        return await interaction.editReply({ embeds: [embed]});
                }
        
                if (dbresult?.error) {
                    console.log(dbresult.error);
                    const embed = {
                        color: 0xbf0f0f,
                        description: "An error occurred while linking your account",
                    };
                    await interaction.editReply({ embeds: [embed]});
                }
        
                const embed = {
                    color: 0x65bf65,
                    description: "Your account has been linked",
                };
                await interaction.editReply({ embeds: [embed]});
            }
        };

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