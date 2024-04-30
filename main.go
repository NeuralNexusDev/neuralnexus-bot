package main

import (
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/bot"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/modules/bng"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/modules/gss"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/modules/mcstatus"
)

func main() {
	bot := bot.NewBot()
	bot.AddCommandHandler(gss.GSSCommand, gss.GSSHandler)
	bot.AddCommandHandler(mcstatus.MCStatusCommand, mcstatus.MCStatusHandler)
	bot.AddCommandHandler(bng.BeeNameCommand, bng.BeeNameCommandHandler)
	bot.AddComponentHandlers(bng.BeeNameComponentHandlers)
	bot.Start()
}
