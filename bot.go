package main

import (
	"log"
	"os"
	"os/signal"

	"github.com/bwmarrin/discordgo"
)

var (
	GUILD_ID        = os.Getenv("GUILD_ID")
	BOT_TOKEN       = os.Getenv("BOT_TOKEN")
	REMOVE_COMMANDS = os.Getenv("REMOVE_COMMANDS") == "true"
)

type CommandHandler func(s *discordgo.Session, i *discordgo.InteractionCreate)

type Bot struct {
	GuildID         string
	BotToken        string
	RemoveCommands  bool
	s               *discordgo.Session
	commands        []*discordgo.ApplicationCommand
	commandHandlers map[string]CommandHandler
}

func NewBot() *Bot {
	bot := &Bot{
		GuildID:         GUILD_ID,
		BotToken:        BOT_TOKEN,
		RemoveCommands:  REMOVE_COMMANDS,
		commands:        []*discordgo.ApplicationCommand{},
		commandHandlers: map[string]CommandHandler{},
	}
	s, err := discordgo.New("Bot " + BOT_TOKEN)
	if err != nil {
		log.Fatalf("Invalid bot parameters: %v", err)
	}
	bot.s = s
	return bot
}

func (b *Bot) AddCommandHandler(cmd *discordgo.ApplicationCommand, h CommandHandler) {
	b.commands = append(b.commands, cmd)
	b.commandHandlers[cmd.Name] = h
}

func (b *Bot) Start() {
	b.s.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) { log.Println("Bot is up!") })
	b.s.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		if h, ok := b.commandHandlers[i.ApplicationCommandData().Name]; ok {
			h(s, i)
		}
	})
	err := b.s.Open()
	if err != nil {
		log.Fatalf("Cannot open the session: %v", err)
	}
	defer b.s.Close()

	createdCommands, err := b.s.ApplicationCommandBulkOverwrite(b.s.State.User.ID, GUILD_ID, b.commands)

	if err != nil {
		log.Fatalf("Cannot register commands: %v", err)
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt)
	<-stop
	log.Println("Gracefully shutting down")

	if REMOVE_COMMANDS {
		for _, cmd := range createdCommands {
			err := b.s.ApplicationCommandDelete(b.s.State.User.ID, GUILD_ID, cmd.ID)
			if err != nil {
				log.Fatalf("Cannot delete %q command: %v", cmd.Name, err)
			}
		}
	}
}
