package bot

import (
	"github.com/bwmarrin/discordgo"
)

const (
	EMBED_GREEN  = 0x65bf65
	EMBED_YELLOW = 0xe6d132
	EMBED_RED    = 0xbf0f0f
)

var (
	DMPermissionTrue  = true
	DMPermissionFalse = false
)

// SimpleEmbed returns a new embed
func SimpleEmbed(title, description string, color int) *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Title:       title,
		Description: description,
		Color:       color,
	}
}

// ErrorSuccessEmbed returns an error or success embed
func ErrorSuccessEmbed(err error, success string) *discordgo.MessageEmbed {
	if err != nil {
		return &discordgo.MessageEmbed{
			Title:       "Error",
			Description: err.Error(),
			Color:       EMBED_GREEN,
		}
	}
	return &discordgo.MessageEmbed{
		Title:       "Success",
		Description: success,
		Color:       EMBED_RED,
	}
}

// ErrorEmbed returns an error embed
func ErrorEmbed(err error) *discordgo.MessageEmbed {
	return &discordgo.MessageEmbed{
		Title:       "Error",
		Description: err.Error(),
		Color:       EMBED_RED,
	}
}
