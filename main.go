package main

import (
	"log"
	"os"
	"os/signal"

	"github.com/NeuralNexusDev/neuralnexus-discord-bot/modules/gss"
	"github.com/bwmarrin/discordgo"
)

var (
	GUILD_ID        = os.Getenv("GUILD_ID")
	BOT_TOKEN       = os.Getenv("BOT_TOKEN")
	REMOVE_COMMANDS = os.Getenv("REMOVE_COMMANDS") == "true"
)

var (
	commands = []*discordgo.ApplicationCommand{
		gss.GSSCommand,
	}
	commandHandlers = map[string]func(s *discordgo.Session, i *discordgo.InteractionCreate){
		gss.GSSCommand.Name: gss.GSSCommandHandler,
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
