import { Interaction, SlashCommandBuilder } from "discord.js";


import { addCronJob, removeCronJob, getCronJobs } from "../lib/cronDataSource.js";
import { parseDateTimeToCron } from "../lib/cronGPTParser.js";
import locales from '../localizations/schedule.json' assert { type: "json" };


export const command = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setNameLocalizations(locales.schedule.name)
        .setDescription('Root command for scheduling tasks')
        .setDescriptionLocalizations(locales.schedule.description)
        .setDefaultMemberPermissions(0)
        .setDMPermission(false)
        .addSubcommand(subcommand =>
            subcommand.setName('add')
                .setNameLocalizations(locales.schedule.add.name)
                .setDescription('Adds a new schedule')
                .setDescriptionLocalizations(locales.schedule.add.description)
                .addStringOption(option =>
                    option.setName('name')
                        .setNameLocalizations(locales.schedule.global.variable.name.name)
                        .setDescription('Name of the schedule')
                        .setDescriptionLocalizations(locales.schedule.global.variable.name.description)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('datetime')
                        .setNameLocalizations(locales.schedule.add.variable.datetime.name)
                        .setDescription('The datetime for the task: eg. "in 5 minutes" or "Jan 16 at 3pm"')
                        .setDescriptionLocalizations(locales.schedule.add.variable.datetime.description)
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('message')
                        .setNameLocalizations(locales.schedule.add.variable.message.name)
                        .setDescription('Message to send at the scheduled time')
                        .setDescriptionLocalizations(locales.schedule.add.variable.message.description)
                        .setRequired(true)
                )
                .addChannelOption(option =>
                    option.setName('channel')
                        .setNameLocalizations(locales.schedule.add.variable.channel.name)
                        .setDescription('Channel to send the message in')
                        .setDescriptionLocalizations(locales.schedule.add.variable.channel.description)
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('channel_id')
                        .setNameLocalizations(locales.schedule.add.variable.channel_id.name)
                        .setDescription('ID of the channel to send the message in')
                        .setDescriptionLocalizations(locales.schedule.add.variable.channel_id.description)
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option.setName('repeat')
                        .setNameLocalizations(locales.schedule.add.variable.repeat.name)
                        .setDescription('Whether the message should be repeated')
                        .setDescriptionLocalizations(locales.schedule.add.variable.repeat.description)
                        .setRequired(false)
                        .addChoices(
                            { name: 'false', value: 'false' },
                            { name: 'true', value: 'true' },
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('remove')
                .setNameLocalizations(locales.schedule.remove.name)
                .setDescription('Removes a schedule')
                .setDescriptionLocalizations(locales.schedule.remove.description)
                .addStringOption(option =>
                    option.setName('name')
                        .setNameLocalizations(locales.schedule.global.variable.name.name)
                        .setDescription('Name of the schedule')
                        .setDescriptionLocalizations(locales.schedule.global.variable.name.description)
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setNameLocalizations(locales.schedule.list.name)
                .setDescription('Lists all scheduled messages')
                .setDescriptionLocalizations(locales.schedule.list.description)
        ),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const userLocale: string = interaction.locale || 'en-US';
        const subcommand: string = interaction.options.getSubcommand();
        const name: string = interaction.options.getString('name');

        switch (subcommand) {

            // Logic for adding a new schedule
            case 'add':
                console.log(`[${interaction.guild.name}] [${interaction.channel.name}] [${interaction.user.tag}]: schedule ${subcommand} ${name}`);

                const datetime: string = interaction.options.getString('datetime');
                const message: string = interaction.options.getString('message');
                let channelId: string = interaction.options.getString('channel_id') || interaction.options.getChannel('channel')?.id || interaction.channelId;
                const repeat: string = interaction.options.getString('repeat');

                const guildId: string = interaction.guildId;
                const cron: string = await parseDateTimeToCron(datetime);

                if (!cron) {
                    return await interaction.editReply(`${locales.schedule.add.response.parse_error[userLocale]}: ${datetime}`);
                }

                if (await addCronJob(name, cron, message, guildId, channelId, repeat)) {
                    return await interaction.editReply(`${locales.schedule.add.response.schedule_add[userLocale]}: ${name}`);
                } else {
                    return await interaction.editReply(`${locales.schedule.add.response.schedule_exists[userLocale]}: ${name}`);
                }
                break;

            // Logic for removing a schedule
            case 'remove':
                console.log(`[${interaction.guild.name}] [${interaction.channel.name}] [${interaction.user.tag}]: schedule ${subcommand} ${name}`);
                if (await removeCronJob(name)) {
                    await interaction.editReply(`${locales.schedule.remove.response.removed_schedule[userLocale]}: ${name}`);
                } else {
                    await interaction.editReply(`${locales.schedule.remove.response.no_schedule[userLocale]}: ${name}`);
                }
                break;

            // Logic for listing all schedules
            case 'list':
                console.log(`[${interaction.guild.name}] [${interaction.channel.name}] [${interaction.user.tag}]: schedule ${subcommand}`);
                const cronJobs = await getCronJobs();
                let reply = '```';
                cronJobs.forEach(job => {
                    if (interaction.guildId === job.guildId) {
                        reply += `
--------------------
${locales.schedule.list.response.name[userLocale]}: ${job.name}
${locales.schedule.list.response.cron[userLocale]}: ${job.cron}
${locales.schedule.list.response.message[userLocale]}: ${job.message}
${locales.schedule.list.response.channel_id[userLocale]}: ${job.channelId}
${locales.schedule.list.response.repeat[userLocale]}: ${job.repeat}`;
                    }
                });
                reply += '```';
                await interaction.editReply(reply);
                break;
            default:
                break;
        }
    }
}
