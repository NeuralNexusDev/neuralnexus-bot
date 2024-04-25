package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"

	"github.com/bwmarrin/discordgo"
)

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

func GetServerStatus(game, ip string, port int64) (*ServerStatus, error) {
	resp, err := http.Get("https://api.neuralnexus.dev/api/v1/game-server-status/" + game + "?host=" + ip + "&port=" + strconv.FormatInt(port, 10))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var body map[string]any
		json.NewDecoder(resp.Body).Decode(&body)
		log.Printf("Error fetching server status: %v", body)
		return nil, errors.New("cannot fetch server status")
	}

	var status ServerStatus
	err = json.NewDecoder(resp.Body).Decode(&status)
	if err != nil {
		return nil, err
	}
	return &status, nil
}

var (
	GUILD_ID        = os.Getenv("GUILD_ID")
	BOT_TOKEN       = os.Getenv("BOT_TOKEN")
	REMOVE_COMMANDS = os.Getenv("REMOVE_COMMANDS") == "true"
)

type CommandHandler func(s *discordgo.Session, i *discordgo.InteractionCreate)

var (
	dmPermission = true
	minInt       = 1.0
	// defaultMemberPermissions int64 = discordgo.PermissionAllText

	commands = []*discordgo.ApplicationCommand{
		{
			Name:                     "status",
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
					MinValue:                 &minInt,
					MaxValue:                 65535,
					Required:                 true,
				},
			},
		},
	}

	commandHandlers = map[string]CommandHandler{
		"status": func(s *discordgo.Session, i *discordgo.InteractionCreate) {
			options := i.ApplicationCommandData().Options
			content := ""
			game := options[0].StringValue()
			host := options[1].StringValue()
			port := options[2].IntValue()

			status, err := GetServerStatus(game, host, port)
			if err != nil {
				log.Printf("Error fetching server status: %v", err)
				content = "An error occurred while fetching the server status"
			} else {
				content = "```"
				content += "Server: " + status.Host + ":" + strconv.Itoa(status.Port) + "\n"
				content += "Name: " + status.Name + "\n"
				content += "Map: " + status.MapName + "\n"
				content += "Players: " + strconv.Itoa(status.NumPlayers) + "/" + strconv.Itoa(status.MaxPlayers) + "\n"
				content += "```"
			}

			s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
				Type: discordgo.InteractionResponseChannelMessageWithSource,
				Data: &discordgo.InteractionResponseData{
					Content: content,
				},
			})
		},
	}
)

func main() {
	s, err := discordgo.New("Bot " + BOT_TOKEN)
	if err != nil {
		log.Fatalf("Invalid bot parameters: %v", err)
	}

	s.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) { log.Println("Bot is up!") })
	s.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		if h, ok := commandHandlers[i.ApplicationCommandData().Name]; ok {
			h(s, i)
		}
	})
	err = s.Open()
	if err != nil {
		log.Fatalf("Cannot open the session: %v", err)
	}
	defer s.Close()

	createdCommands, err := s.ApplicationCommandBulkOverwrite(s.State.User.ID, GUILD_ID, commands)

	if err != nil {
		log.Fatalf("Cannot register commands: %v", err)
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop
	log.Println("Gracefully shutting down")

	if REMOVE_COMMANDS {
		for _, cmd := range createdCommands {
			err := s.ApplicationCommandDelete(s.State.User.ID, GUILD_ID, cmd.ID)
			if err != nil {
				log.Fatalf("Cannot delete %q command: %v", cmd.Name, err)
			}
		}
	}
}
