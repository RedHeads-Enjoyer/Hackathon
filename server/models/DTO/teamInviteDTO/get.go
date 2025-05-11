package teamInviteDTO

import "time"

type Get struct {
	Id        uint      `json:"id"`
	TeamName  string    `json:"teamName"`
	Status    int       `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}
