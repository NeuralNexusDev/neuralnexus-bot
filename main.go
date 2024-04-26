package main

import (
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/modules/gss"
)

func main() {
	bot := NewBot()
	bot.AddCommandHandler(gss.GSSCommand, gss.GSSCommandHandler)
	bot.Start()
}
