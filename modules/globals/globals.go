package g

import "os"

const (
	EMBED_GREEN  = 0x65bf65
	EMBED_YELLOW = 0xe6d132
	EMBED_RED    = 0xbf0f0f
)

var (
	NEURALNEXUS_API     = "https://api.neuralnexus.dev/api/v1" // os.Getenv("NEURALNEXUS_API")
	NEURALNEXUS_API_KEY = os.Getenv("NEURALNEXUS_API_KEY")
)
