import { SlashCommandBuilder } from 'discord.js';
import { createClient } from '@supabase/supabase-js';

import { MinecraftUser, SupabaseHandler, TwitchUser, SupabaseResponse, User } from '../lib/supabaseHandler.js';
import { getMinecraftUser, getTwitchUserFromUsername } from '../lib/accountUtils.js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
);
export const db = new SupabaseHandler(supabase);


export const command = {
	data: new SlashCommandBuilder()
        .setName('link')
        .setDescription('Link your accounts')
        .addSubcommand(subcommand =>
            subcommand.setName('twitch')
                .setDescription('Link your Twitch account')
                .addStringOption(option =>
                    option.setName('twitch_username')
                        .setDescription('Your Twitch username')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('game')
                .setDescription('Link your game account')
                .addStringOption(option =>
                    option.setName('platform')
                        .setDescription('The platform/game you play on')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Minecraft', value: 'minecraft' },
                            { name: 'Steam64 ID', value: 'steam64' },
                ))
                .addStringOption(option =>
                    option.setName('username')
                        .setDescription('Your username in the platform/game')
                        .setRequired(true)
                )
        ),
    async execute(interaction: any) {
        await interaction.deferReply({ ephemeral: true });
        const subcommand = interaction.options.getSubcommand();
        const discordID = interaction.user.id;

        let dbresult: SupabaseResponse<User>;
        if (subcommand === 'game') {
            const platform = interaction.options.getString('platform');
            const username = interaction.options.getString('username');

            let userID = (await db.getUserID("discordID", discordID))?.data;
            if (!userID) {
                await db.setUser({
                    discordID,
                    discordUser: interaction.user,
                    userID: ''
                });
                userID = (await db.getUserID("discordID", discordID))?.data;
            }

            if (platform === 'minecraft') {
                const minecraftUser: MinecraftUser = await getMinecraftUser(username);

                if (!minecraftUser) {
                    const embed = {
                        color: 0xe6d132,
                        description: "Invalid Minecraft username",
                    };
                    return await interaction.editReply({ embeds: [embed]});
                }

                dbresult = await db.updateUser({
                    userID,
                    minecraft: username,
                    minecraftUser
                });

                if (dbresult?.error) {
                    console.log(dbresult.error);
                    if (dbresult.error.code === '23505') {
                        const embed = {
                            color: 0xe6d132,
                            description: "This Minecraft account has already been linked",
                        };
                        return await interaction.editReply({ embeds: [embed]});
                    }
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
            
            dbresult = await db.updateUser({
                userID,
                [platform]: username
            });
        } else if (subcommand === 'twitch') {
            const twitchUsername: string = interaction.options.getString('twitch_username');

            // get twitchUser from twitchUsername
            const twitchUser: TwitchUser = await getTwitchUserFromUsername(twitchUsername);

            if (!twitchUser) {
                const embed = {
                    color: 0xe6d132,
                    description: "Invalid Twitch username",
                };
                return await interaction.editReply({ embeds: [embed]});
            }

            // get userID from TwitchUser
            let userID = (await db.getUserID("twitchID", twitchUser.id))?.data;
            const newUser = await db.getUser({ userID });

            if (newUser?.error) {
                console.log(newUser.error);
                const embed = {
                    color: 0xbf0f0f,
                    description: "An error occurred while linking your account",
                };
                return await interaction.editReply({ embeds: [embed]});
            }

            // Check to see if linking the right user
            if (interaction.user.tag === newUser?.data?.discordUser?.tag?.split("?confirm?")[0]) {
                // Merge old user data into new user -- TODO: make this better
                let oldUserID = (await db.getUserID("discordID", discordID))?.data;
                if (oldUserID) {
                    const olddbresult = await db.getUser({ userID: oldUserID });
                    const delOldUser = await db.deleteUser({ userID: oldUserID });
                    if (olddbresult?.data) {
                        const oldUser = olddbresult.data;
                        oldUser.userID = userID;
                        const updateUser = { ...oldUser, ...newUser?.data}
                        dbresult = await db.updateUser(updateUser);
                    }
                }

                dbresult = await db.updateUser({
                    userID,
                    discordID,
                    discordUser: interaction.user,
                    twitchID: twitchUser.id,
                    twitchUser
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
