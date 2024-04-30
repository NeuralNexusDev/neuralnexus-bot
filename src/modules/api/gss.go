package api

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	g "github.com/NeuralNexusDev/neuralnexus-discord-bot/src/modules/globals"
)

// ServerStatus server status response
type ServerStatus struct {
	Host       string `json:"host"`
	Port       int    `json:"port"`
	Name       string `json:"name"`
	MapName    string `json:"map_name"`
	NumPlayers int    `json:"num_players"`
	MaxPlayers int    `json:"max_players"`
	Players    []struct {
		Name string `json:"name"`
		ID   string `json:"id"`
	} `json:"players"`
	QueryType string `json:"query_type"`
}

// GetServerStatus fetches the server status from the NeuralNexus API
func GetServerStatus(game, ip string, port int64) (*ServerStatus, error) {
	resp, err := http.Get(g.NEURALNEXUS_API + "/game-server-status/" + game + "?host=" + ip + "&port=" + strconv.FormatInt(port, 10))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var body map[string]any
		json.NewDecoder(resp.Body).Decode(&body)
		log.Println("Error fetching server status:\n\t", body)
		return nil, errors.New(body["detail"].(string))
	}

	var status ServerStatus
	err = json.NewDecoder(resp.Body).Decode(&status)
	if err != nil {
		return nil, err
	}
	return &status, nil
}
