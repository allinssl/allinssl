package response

type AccessSiteList struct {
	Id       string   `json:"id"`
	SiteName string   `json:"siteName"`
	Domain   []string `json:"domain"`
}
