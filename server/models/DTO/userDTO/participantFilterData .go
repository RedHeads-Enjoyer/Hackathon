package userDTO

type ParticipantFilterData struct {
	Name   string `json:"name"`   // Для поиска по имени или email
	IsFree bool   `json:"isFree"` // Фильтр по участникам без команды
	Limit  int    `json:"limit"`  // Лимит для пагинации
	Offset int    `json:"offset"` // Смещение для пагинации
}
