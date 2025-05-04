package awardDTO

type Get struct {
	ID           uint    `json:"id"`
	PlaceFrom    int     `json:"placeFrom"`
	PlaceTo      int     `json:"placeTo"`
	MoneyAmount  float64 `json:"moneyAmount"`
	Additionally string  `json:"additionally"`
}
