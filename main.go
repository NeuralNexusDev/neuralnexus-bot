package main

import (
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/discord"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/discord/modules/bng"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/discord/modules/gss"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/discord/modules/mcstatus"
)

func main() {
	discordBot := discord.NewBot()
	discordBot.AddCommandHandler(gss.GSSCommand, gss.GSSHandler)
	discordBot.AddCommandHandler(mcstatus.MCStatusCommand, mcstatus.MCStatusHandler)
	discordBot.AddCommandHandler(bng.BeeNameCommand, bng.BeeNameCommandHandler)
	discordBot.AddComponentHandlers(bng.BeeNameComponentHandlers)
	discordBot.Start()
}
