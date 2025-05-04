package fileDTO

type GetShort struct {
	ID   uint   `json:"id"`
	Name string `json:"placeFrom"`
	Size int64  `json:"size"`
	Type string `json:"type"`
}
