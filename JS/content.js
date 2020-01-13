
var url = window.location.href

if (url.includes('chrome_extension_redirect=true')) {
	alert("This extension should be launched only from Service Desk. Hence you were redirected to 'Service Desk Homepage'. Please launch the extension again (Ctrl + I) and click on 'Show my bin' ")
}
