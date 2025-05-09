package mentorInviteDTO

import "time"

type GetFull struct {
	ID            uint      `json:"id"`
	CreatedAt     time.Time `json:"createdAt"`
	HackathonName string    `json:"hackathonName"`
	HackathonID   uint      `json:"hackathonId"`
	Status        int       `json:"status"`
}
