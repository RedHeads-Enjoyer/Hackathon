package awardDTO

type Get struct {
	PlaceFrom    int     `json:"placeFrom"`
	PlaceTo      int     `json:"placeTo"`
	MoneyAmount  float64 `json:"moneyAmount"`
	Additionally string  `json:"additionally"`
}
