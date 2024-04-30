package bng

import (
	"errors"

	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/bot"
	"github.com/NeuralNexusDev/neuralnexus-discord-bot/src/modules/api"
	"github.com/bwmarrin/discordgo"
)

// GetSuggestionsComponent get suggestions component
func GetSuggestionsComponents() []discordgo.MessageComponent {
	return []discordgo.MessageComponent{
		&discordgo.Button{
			Label:    "Accept",
			Style:    discordgo.SuccessButton,
			Disabled: false,
			CustomID: "beename_suggestion_accept",
		},
		&discordgo.Button{
			Label:    "Reject",
			Style:    discordgo.DangerButton,
			Disabled: false,
			CustomID: "beename_suggestion_reject",
		},
		&discordgo.Button{
			Label:    "Next",
			Style:    discordgo.SecondaryButton,
			Disabled: false,
			CustomID: "beename_suggestion_next",
		},
	}
}

// BeeNameComponentHandlers bee name component handlers
var BeeNameComponentHandlers = map[string]bot.InteractionHandler{
	"beename_suggestion_accept": func(s *discordgo.Session, i *discordgo.InteractionCreate) {},
	"beename_suggestion_reject": func(s *discordgo.Session, i *discordgo.InteractionCreate) {},
	"beename_suggestion_next":   func(s *discordgo.Session, i *discordgo.InteractionCreate) {},
}

var dmPermission = true

// BeeNameCommand bee name command
var BeeNameCommand = &discordgo.ApplicationCommand{
	Name:                     "beename",
	NameLocalizations:        &map[discordgo.Locale]string{},
	Description:              "Generate a bee name",
	DescriptionLocalizations: &map[discordgo.Locale]string{},
	Type:                     discordgo.ChatApplicationCommand,
	DMPermission:             &dmPermission,
	Options: []*discordgo.ApplicationCommandOption{
		{
			Name:                     "get",
			NameLocalizations:        map[discordgo.Locale]string{},
			Description:              "Generate a bee name",
			DescriptionLocalizations: map[discordgo.Locale]string{},
			Type:                     discordgo.ApplicationCommandOptionSubCommand,
		},
		{
			Name:                     "upload",
			NameLocalizations:        map[discordgo.Locale]string{},
			Description:              "Upload a bee name",
			DescriptionLocalizations: map[discordgo.Locale]string{},
			Type:                     discordgo.ApplicationCommandOptionSubCommand,
			Options: []*discordgo.ApplicationCommandOption{
				{
					Name:                     "name",
					NameLocalizations:        map[discordgo.Locale]string{},
					Description:              "The bee name to upload",
					DescriptionLocalizations: map[discordgo.Locale]string{},
					Required:                 true,
					Type:                     discordgo.ApplicationCommandOptionString,
				},
			},
		},
		{
			Name:                     "suggestion",
			NameLocalizations:        map[discordgo.Locale]string{},
			Description:              "Suggestion command group",
			DescriptionLocalizations: map[discordgo.Locale]string{},
			Type:                     discordgo.ApplicationCommandOptionSubCommandGroup,
			Options: []*discordgo.ApplicationCommandOption{
				{
					Name:                     "get",
					NameLocalizations:        map[discordgo.Locale]string{},
					Description:              "Get a list of bee name suggestions",
					DescriptionLocalizations: map[discordgo.Locale]string{},
					Type:                     discordgo.ApplicationCommandOptionSubCommand,
				},
				{
					Name:                     "submit",
					NameLocalizations:        map[discordgo.Locale]string{},
					Description:              "Submit a bee name suggestion",
					DescriptionLocalizations: map[discordgo.Locale]string{},
					Type:                     discordgo.ApplicationCommandOptionSubCommand,
					Options: []*discordgo.ApplicationCommandOption{
						{
							Name:                     "name",
							NameLocalizations:        map[discordgo.Locale]string{},
							Description:              "The bee name suggestion",
							DescriptionLocalizations: map[discordgo.Locale]string{},
							Required:                 true,
							Type:                     discordgo.ApplicationCommandOptionString,
						},
					},
				},
			},
		},
	},
}

// BeeNameCommandHandler bee name command handler
func BeeNameCommandHandler(s *discordgo.Session, i *discordgo.InteractionCreate) {
	var embed *discordgo.MessageEmbed
	options := i.ApplicationCommandData().Options
	switch options[0].Name {
	case "get":
		name, err := api.GetBeeName()
		if err != nil {
			embed = bot.ErrorEmbed(err)
		} else {
			embed = bot.SimpleEmbed("Bee Name", name.Name, bot.EMBED_GREEN)
		}
	case "upload":
		user, err := api.GetUserFromPlatform("discord", i.Member.User.ID)
		if err != nil {
			user, err = api.UpdateUserPlatform("discord", i.Member.User.ID, i.Member.User)
			if err != nil {
				embed = bot.ErrorEmbed(err)
				break
			}
		}
		if !user.HasPermission("beenamegenerator|*") {
			embed = bot.ErrorEmbed(errors.New("you do not have permission to upload a bee name"))
			break
		}

		name := options[0].Options[0].StringValue()
		err = api.UploadBeeName(name)
		embed = bot.ErrorSuccessEmbed(err, "Bee name uploaded")
	case "delete":
		user, err := api.GetUserFromPlatform("discord", i.Member.User.ID)
		if err != nil {
			user, err = api.UpdateUserPlatform("discord", i.Member.User.ID, i.Member.User)
			if err != nil {
				bot.ErrorEmbed(err)
				break
			}
		}
		if !user.HasPermission("beenamegenerator|*") {
			embed = bot.ErrorEmbed(errors.New("you do not have permission to delete a bee name"))
			break
		}

		name := options[0].Options[0].StringValue()
		err = api.DeleteBeeName(name)
		embed = bot.ErrorSuccessEmbed(err, "Bee name deleted")
	case "suggestion":
		switch options[0].Options[0].Name {
		case "get":
			suggestions, err := api.GetBeeNameSuggestions()
			if err != nil {
				bot.ErrorEmbed(err)
				break
			}
			embed = bot.SimpleEmbed("Bee Name Suggestions", suggestions.Suggestions[0], bot.EMBED_GREEN)

			s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
				Type: discordgo.InteractionResponseChannelMessageWithSource,
				Data: &discordgo.InteractionResponseData{
					Embeds:     []*discordgo.MessageEmbed{embed},
					Components: GetSuggestionsComponents(),
				},
			})
			return
		case "submit":
			err := api.SubmitBeeNameSuggestion(options[0].Options[0].StringValue())
			embed = bot.ErrorSuccessEmbed(err, "Bee name suggestion submitted")
		}
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}
