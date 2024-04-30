package gss

import (
	"log"
	"strconv"

	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/bot"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/modules/api"
	"github.com/bwmarrin/discordgo"
)

var dmPermission = true

// GSSCommand game server status command
var GSSCommand = &discordgo.ApplicationCommand{
	Name:                     "gstatus",
	NameLocalizations:        &map[discordgo.Locale]string{},
	Description:              "Check a game server's status",
	DescriptionLocalizations: &map[discordgo.Locale]string{},
	Type:                     discordgo.ChatApplicationCommand,
	DMPermission:             &dmPermission,
	Options: []*discordgo.ApplicationCommandOption{
		{
			Name:                     "game",
			NameLocalizations:        map[discordgo.Locale]string{},
			Description:              "Game to check status for",
			DescriptionLocalizations: map[discordgo.Locale]string{},
			Type:                     discordgo.ApplicationCommandOptionString,
			Required:                 true,
		},
		{
			Name:                     "host",
			NameLocalizations:        map[discordgo.Locale]string{},
			Description:              "The server's IP address or hostname",
			DescriptionLocalizations: map[discordgo.Locale]string{},
			Type:                     discordgo.ApplicationCommandOptionString,
			Required:                 true,
		},
		{
			Name:                     "port",
			NameLocalizations:        map[discordgo.Locale]string{},
			Description:              "The server's port number",
			DescriptionLocalizations: map[discordgo.Locale]string{},
			Type:                     discordgo.ApplicationCommandOptionInteger,
			MaxValue:                 65535,
			Required:                 true,
		},
	},
}

// GSSCommandHandler game server status command handler
func GSSHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	options := i.ApplicationCommandData().Options
	game := options[0].StringValue()
	host := options[1].StringValue()
	port := options[2].IntValue()

	title := ""
	description := ""
	color := bot.EMBED_GREEN

	status, err := api.GetServerStatus(game, host, port)
	if err != nil {
		log.Printf("Error fetching server status: %v", err)
		title = "Error:"
		description = "Whoops, something went wrong,\n"
		description += "couldn't reach " + host + ":" + strconv.FormatInt(port, 10) + ".\t¯\\\\_(\"/)\\_/¯" + "\n"
		description += err.Error()
		color = bot.EMBED_RED
	} else {
		title = status.Host + ":" + strconv.Itoa(status.Port)
		description += "Name: " + status.Name + "\n"
		description += "Map: " + status.MapName + "\n"
		description += "Players: " + strconv.Itoa(status.NumPlayers) + "/" + strconv.Itoa(status.MaxPlayers)
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{
				{
					Title:       title,
					Description: description,
					Color:       color,
				},
			},
		},
	})
}
