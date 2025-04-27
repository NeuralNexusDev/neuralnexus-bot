package g

import "os"

var (
	NEURALNEXUS_API     = "https://api.neuralnexus.dev/api/v1" // os.Getenv("NEURALNEXUS_API")
	NEURALNEXUS_API_KEY = os.Getenv("NEURALNEXUS_API_KEY")
)
