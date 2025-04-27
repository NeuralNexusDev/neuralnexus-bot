package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	g "github.com/NeuralNexusDev/neuralnexus-discord-bot/src/globals"
)

// APIRequest request helper method for the NeuralNexus API
func APIRequest(method, endpoint string, body interface{}) (*http.Response, error) {
	buff := new(bytes.Buffer)
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		buff = bytes.NewBuffer(b)
	}

	req, err := http.NewRequest(method, g.NEURALNEXUS_API+endpoint, buff)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+g.NEURALNEXUS_API_KEY)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

// User struct
type User struct {
	UserID      string    `json:"user_id"`
	Username    string    `json:"username"`
	Roles       []string  `json:"roles"`
	Permissions []string  `json:"permissions"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// HasPermission checks if the user has the specified permission
func (u *User) HasPermission(permission string) bool {
	if u.Permissions == nil {
		p, err := GetUserPermissions(u.UserID)
		if err != nil {
			return false
		}
		u.Permissions = p
	}
	for _, p := range u.Permissions {
		if p == permission {
			return true
		}
	}
	return false
}

// GetUser fetches the user from the NeuralNexus API
func GetUser(userID string) (*User, error) {
	resp, err := APIRequest("GET", "/users/"+userID, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("error fetching user")
	}

	var user User
	err = json.NewDecoder(resp.Body).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserFromPlatform fetches the user from the NeuralNexus API
func GetUserFromPlatform(platform, platformID string) (*User, error) {
	resp, err := APIRequest("GET", "/users/"+platform+"/"+platformID, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("error fetching user")
	}

	var user User
	err = json.NewDecoder(resp.Body).Decode(&user)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// GetUserPermissions fetches the user permissions from the NeuralNexus API
func GetUserPermissions(userID string) ([]string, error) {
	resp, err := APIRequest("GET", "/users/"+userID+"/permissions", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("error fetching user permissions")
	}

	var permissions []string
	err = json.NewDecoder(resp.Body).Decode(&permissions)
	if err != nil {
		return nil, err
	}
	return permissions, nil
}

// UpdateUser updates the user in the NeuralNexus API
func UpdateUser(userID string, user *User) (*User, error) {
	resp, err := APIRequest("PUT", "/users/"+userID, user)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("error updating user")
	}

	var updatedUser User
	err = json.NewDecoder(resp.Body).Decode(&updatedUser)
	if err != nil {
		return nil, err
	}
	return &updatedUser, nil
}

// UpdateUserPlatform updates the user in the NeuralNexus API
func UpdateUserPlatform(platform, platformID string, data interface{}) (*User, error) {
	resp, err := APIRequest("PUT", "/users/"+platform+"/"+platformID, data)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("error updating user")
	}

	var updatedUser User
	err = json.NewDecoder(resp.Body).Decode(&updatedUser)
	if err != nil {
		return nil, err
	}
	return &updatedUser, nil
}
