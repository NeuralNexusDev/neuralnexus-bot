package api

import (
	"encoding/json"
	"errors"
	"net/http"
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
	resp, err := APIRequest("GET", "/bee-name-generator/name", nil)
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
	resp, err := APIRequest("POST", "/bee-name-generator/name/"+name, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("error uploading bee name")
	}
	return nil
}

// DeleteBeeName deletes a bee name from the NeuralNexus API
func DeleteBeeName(name string) error {
	resp, err := APIRequest("DELETE", "/bee-name-generator/name/"+name, nil)
	if err != nil {
		return err
	}

	if resp.StatusCode != http.StatusOK {
		return errors.New("error deleting bee name")
	}
	return nil
}

// GetBeeNameSuggestions fetches bee name suggestions from the NeuralNexus API
func GetBeeNameSuggestions() (*BeeNameSuggestions, error) {
	resp, err := APIRequest("GET", "/bee-name-generator/suggestions/1", nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("error fetching bee name suggestions")
	}

	var suggestions BeeNameSuggestions
	err = json.NewDecoder(resp.Body).Decode(&suggestions)
	if err != nil {
		return nil, err
	}
	return &suggestions, nil
}

// SubmitBeeNameSuggestion submits a bee name suggestion to the NeuralNexus API
func SubmitBeeNameSuggestion(name string) error {
	resp, err := APIRequest("POST", "/bee-name-generator/suggestions/"+name, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("error submitting bee name suggestion")
	}
	return nil
}

// AcceptBeeNameSuggestion accepts a bee name suggestion on the NeuralNexus API
func AcceptBeeNameSuggestion(name string) error {
	resp, err := APIRequest("PUT", "/bee-name-generator/suggestions/"+name, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return errors.New("error accepting bee name suggestion")
	}
	return nil
}

// RejectBeeNameSuggestion rejects a bee name suggestion on the NeuralNexus API
func RejectBeeNameSuggestion(name string) error {
	resp, err := APIRequest("DELETE", "/bee-name-generator/suggestions/"+name, nil)
	if err != nil {
		return err
	}

	if resp.StatusCode != http.StatusOK {
		return errors.New("error rejecting bee name suggestion")
	}
	return nil
}
