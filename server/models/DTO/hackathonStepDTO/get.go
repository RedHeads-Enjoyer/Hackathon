package hackathonStepDTO

import (
	"time"
)

type Get struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name" validate:"required,min=3,max=50"`
	Description string    `json:"description" validate:"max=500"`
	StartDate   time.Time `json:"start_date" validate:"required"`
	EndDate     time.Time `json:"end_date" validate:"required,gtfield=StartDate"`
}
