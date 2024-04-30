package gss

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	g "github.com/NeuralNexusDev/neuralnexus-discord-bot/src/modules/globals"
	"github.com/bwmarrin/discordgo"
)

// ServerStatus server status response
type ServerStatus struct {
	Host       string `json:"host"`
	Port       int    `json:"port"`
	Name       string `json:"name"`
	MapName    string `json:"map_name"`
	NumPlayers int    `json:"num_players"`
	MaxPlayers int    `json:"max_players"`
	Players    []struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	} `json:"players"`
	QueryType string `json:"query_type"`
}

// GetServerStatus fetches the server status from the NeuralNexus API
func GetServerStatus(game, ip string, port int64) (*ServerStatus, error) {
	resp, err := http.Get(g.NEURALNEXUS_API + "/game-server-status/" + game + "?host=" + ip + "&port=" + strconv.FormatInt(port, 10))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var body map[string]any
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
	color := g.EMBED_GREEN

	status, err := GetServerStatus(game, host, port)
	if err != nil {
		log.Printf("Error fetching server status: %v", err)
		title = "Error:"
		description = "Whoops, something went wrong,\n"
		description += "couldn't reach " + host + ":" + strconv.FormatInt(port, 10) + ".\t¯\\\\_(\"/)\\_/¯" + "\n"
		description += err.Error()
		color = g.EMBED_RED
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
