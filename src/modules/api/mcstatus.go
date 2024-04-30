package api

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	g "github.com/NeuralNexusDev/neuralnexus-discord-bot/src/modules/globals"
)

// MCServerStatus server status response
type MCServerStatus struct {
	Host       string `json:"host"`
	Port       int    `json:"port"`
	Name       string `json:"name"`
	Motd       string `json:"motd"`
	Map        string `json:"map"`
	MaxPlayers int    `json:"max_players"`
	NumPlayers int    `json:"num_players"`
	Players    []struct {
		Name string `json:"name"`
		ID   string `json:"uuid"`
	} `json:"players"`
	Version    string `json:"version"`
	Favicon    string `json:"favicon"`
	ServerType string `json:"server_type"`
}

// GetMCServerStatus fetches the server status from the NeuralNexus API
func GetMCServerStatus(host string) (*MCServerStatus, error) {
	resp, err := http.Get(g.NEURALNEXUS_API + "/mcstatus/" + host)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var body map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&body)
		log.Println("Error fetching server status:\n\t", body)
		return nil, errors.New(body["detail"].(string))
	}

	var status MCServerStatus
	err = json.NewDecoder(resp.Body).Decode(&status)
	if err != nil {
		return nil, err
	}
	return &status, nil
}
