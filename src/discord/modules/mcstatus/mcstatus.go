package mcstatus

import (
	"strconv"
	"strings"

	bot "github.com/NeuralNexusDev/neuralnexus-discord-bot/src/discord"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/api"
	"github.com/bwmarrin/discordgo"
)

// MCStatusCommand minecraft server status command
var MCStatusCommand = &discordgo.ApplicationCommand{
	Name:                     "mcstatus",
	NameLocalizations:        &map[discordgo.Locale]string{},
	Description:              "Check a Minecraft server's status",
	DescriptionLocalizations: &map[discordgo.Locale]string{},
	Type:                     discordgo.ChatApplicationCommand,
	DMPermission:             &bot.DMPermissionTrue,
	Options: []*discordgo.ApplicationCommandOption{
		{
			Name:        "host",
			Description: "The IP address of the server",
			Type:        discordgo.ApplicationCommandOptionString,
			Required:    true,
		},
		{
			Name:        "is_bedrock",
			Description: "Is the server running Bedrock Edition?",
			Type:        discordgo.ApplicationCommandOptionBoolean,
			Required:    false,
		},
	},
}

// MCStatusHandler minecraft server status handler
func MCStatusHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options
	host := options[0].StringValue()
	isBedrock := false
	if len(options) > 1 {
		isBedrock = options[1].BoolValue()
	}

	var status *api.MCServerStatus
	var err error
	if isBedrock {
		status, err = api.GetMCServerStatus(host + "?bedrock=true")
	} else {
		status, err = api.GetMCServerStatus(host)
	}
	if err != nil {
		description := "Whoops, something went wrong,\n"
		description += "couldn't reach " + host + ".\t¯\\\\_(\"/)\\_/¯" + "\n"
		description += err.Error()
		s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
			Type: discordgo.InteractionResponseChannelMessageWithSource,
			Data: &discordgo.InteractionResponseData{
				Embeds: []*discordgo.MessageEmbed{
					{
						Title:       "Error fetching server status",
						Description: description,
						Color:       bot.EMBED_RED,
					},
				},
			},
		})
		return
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{
				{
					URL:         "https://neuralnexus.dev/mcstatus/" + host,
					Title:       status.Host,
					Description: strings.ReplaceAll(status.Motd, "\\n", "\n"),
					Color:       bot.EMBED_GREEN,
					Thumbnail: &discordgo.MessageEmbedThumbnail{
						URL: "https://api.neuralnexus.dev/api/v1/mcstatus/icon/" + host,
					},
					Footer: &discordgo.MessageEmbedFooter{
						Text: "Powered by NeuralNexus.dev",
					},
					Fields: []*discordgo.MessageEmbedField{
						{
							Name:   "Players",
							Value:  "Online: " + strconv.Itoa(status.NumPlayers) + "/" + strconv.Itoa(status.MaxPlayers),
							Inline: true,
						},
						{
							Name:   "Version",
							Value:  status.Version,
							Inline: true,
						},
						{
							Name:   "Map",
							Value:  status.Map,
							Inline: true,
						},
					},
				},
			},
		},
	})
}
