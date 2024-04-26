package main

import (
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/modules/gss"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/modules/mcstatus"
)

func main() {
	bot := NewBot()
	bot.AddCommandHandler(gss.GSSCommand, gss.GSSHandler)
	bot.AddCommandHandler(mcstatus.MCStatusCommand, mcstatus.MCStatusHandler)
	bot.Start()
}
