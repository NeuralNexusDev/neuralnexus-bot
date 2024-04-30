package mcstatus

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	g "github.com/NeuralNexusDev/neuralnexus-discord-bot/src/modules/globals"
	"github.com/bwmarrin/discordgo"
)

// ServerStatus server status response
type ServerStatus struct {
	Host       string `json:"host"`
	Port       int    `json:"port"`
	Name       string `json:"name"`
	Motd       string `json:"motd"`
	Map        string `json:"map"`
	MaxPlayers int    `json:"max_players"`
	NumPlayers int    `json:"num_players"`
	Players    []struct {
		Name string `json:"name"`
		ID   string `json:"uuid"`
	} `json:"players"`
	Version    string `json:"version"`
	Favicon    string `json:"favicon"`
	ServerType string `json:"server_type"`
}

// GetServerStatus fetches the server status from the NeuralNexus API
func GetServerStatus(host string) (*ServerStatus, error) {
	resp, err := http.Get(g.NEURALNEXUS_API + "/mcstatus/" + host)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var body map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&body)
		log.Println("Error fetching server status:\n\t", body)
		return nil, errors.New(body["detail"].(string))
	}

	var status ServerStatus
	err = json.NewDecoder(resp.Body).Decode(&status)
	if err != nil {
		return nil, err
	}
	return &status, nil
}

var dmPermission = true

// MCStatusCommand minecraft server status command
var MCStatusCommand = &discordgo.ApplicationCommand{
	Name:                     "mcstatus",
	NameLocalizations:        &map[discordgo.Locale]string{},
	Description:              "Check a Minecraft server's status",
	DescriptionLocalizations: &map[discordgo.Locale]string{},
	Type:                     discordgo.ChatApplicationCommand,
	DMPermission:             &dmPermission,
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

	var status *ServerStatus
	var err error
	if isBedrock {
		status, err = GetServerStatus(host + "?bedrock=true")
	} else {
		status, err = GetServerStatus(host)
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
						Color:       g.EMBED_RED,
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
					Color:       g.EMBED_GREEN,
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
