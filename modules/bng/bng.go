package bng

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/NeuralNexusDev/neuralnexus-discord-bot/modules/api"
	g "github.com/NeuralNexusDev/neuralnexus-discord-bot/modules/globals"
	"github.com/bwmarrin/discordgo"
)

// BeeName bee name response
type BeeName struct {
	Name string `json:"name"`
}

// BeeNameSuggestions bee name suggestions response
type BeeNameSuggestions struct {
	Suggestions []string `json:"suggestions"`
}

// GetBeeName fetches a bee name from the NeuralNexus API
func GetBeeName() (*BeeName, error) {
	resp, err := api.APIRequest("GET", "/bee-name-generator/name", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("error fetching bee name")
	}

	var name BeeName
	err = json.NewDecoder(resp.Body).Decode(&name)
	if err != nil {
		return nil, err
	}
	return &name, nil
}

// UploadBeeName uploads a bee name to the NeuralNexus API
func UploadBeeName(name string) error {
	resp, err := api.APIRequest("POST", "/bee-name-generator/name/"+name, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("error uploading bee name")
	}
	return nil
}

// GetSuggestionsComponent get suggestions component
func GetSuggestionsComponent() *discordgo.ActionsRow {
	return &discordgo.ActionsRow{
		Components: []discordgo.MessageComponent{
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
				CustomID: "beename_suggestion_get_next",
			},
		},
	}
}

// SuggestionAcceptHandler suggestion accept handler

// SuggestionRejectHandler suggestion reject handler

// SuggestionGetNextHandler suggestion get next handler

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
	embed := &discordgo.MessageEmbed{
		Title:       "",
		Description: "",
		Color:       g.EMBED_GREEN,
	}

	options := i.ApplicationCommandData().Options
	switch options[0].Name {
	case "get":
		name, err := GetBeeName()
		if err != nil {
			embed.Title = "Error"
			embed.Description = err.Error()
			embed.Color = g.EMBED_RED
		} else {
			embed.Title = "Bee Name"
			embed.Description = name.Name
		}
	case "upload":
		user, err := api.GetUserFromPlatform("discord", i.Member.User.ID)
		if err != nil {
			user, err = api.UpdateUserPlatform("discord", i.Member.User.ID, i.Member.User)
			if err != nil {
				embed.Title = "Error"
				embed.Description = err.Error()
				embed.Color = g.EMBED_RED
				break
			}
		}
		if !user.HasPermission("beenamegenerator|*") {
			embed.Title = "Error"
			embed.Description = "You do not have permission to upload a bee name"
			embed.Color = g.EMBED_RED
			break
		}

		name := options[0].Options[0].StringValue()
		err = UploadBeeName(name)
		if err != nil {
			embed.Title = "Error"
			embed.Description = err.Error()
			embed.Color = g.EMBED_RED
		} else {
			embed.Title = "Success"
			embed.Description = "Bee name uploaded"
		}
	}

	s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Embeds: []*discordgo.MessageEmbed{embed},
		},
	})
}
