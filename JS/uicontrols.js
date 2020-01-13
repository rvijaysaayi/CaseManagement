
window.addEventListener('keydown', function(e) {   
    if (e.keyIdentifier == 'U+000A' || e.keyIdentifier == 'Enter' || e.keyCode == 13) {
        if (e.target.nodeName == 'INPUT' && e.target.type == 'text') {
            e.preventDefault();
            return false;
        }
    }
  }, true);

function createContextMenus()
{ 
  chrome.contextMenus.removeAll( function () {
		try {
			chrome.contextMenus.create({
				"title": "Categorize the Case",
				"id": 'SD',
				"type": "normal",
				"contexts": ["selection"],
				"onclick": log("Created a Context Menu for SD")
			});
		} catch (err) {
			console.log('Here ?' + err)
		}
		try {
			var categories = settings.available_categories
			if (categories.length) {				
				for (var i = 1; i < categories.length; i++) {
					if(categories[i] != 'Uncategorized'){
						chrome.contextMenus.create({
							id: categories[i],
							title: categories[i],
							parentId: "SD",
							contexts: ["selection"],
							onclick: catergorizetheCase()
						});
					}
				}
			}
			log("Available Categories : " + categories)
		} 
		catch (err) {
			console.log(err)
		}

	});

};

chrome.runtime.onStartup.addListener(function(){
  console.log("Chrome Startup")
  createContextMenus();

})

chrome.runtime.onInstalled.addListener(function() {
  console.log("Extension Installed")
   createContextMenus();
      
});


document.addEventListener('DOMContentLoaded', function() 
{
   var tbox = document.getElementById('abox')
  if(tbox)
  { tbox.addEventListener('input',function()
    { if (tbox.value.includes('@microsoft.com'))
      { localStorage.setItem('upn', tbox.value);
      }
    },false);
  }


  $('#sdornot').load('check','check',function()
  {
    chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        var activeURL = tabs[0].url
        // 1. Includes SD URL
        if(activeURL.toString().includes(""))
        { var text = ""
        }
        else  
         {  var text = "Since you are not in SD, you'll be redirected SD homepage"
        }

        var message = document.getElementById('sdornot')
        message.innerText = text
      
  });
});
    var mybin = document.getElementById('mybinbutton');
      mybin.addEventListener('click', function(e) {
      e.preventDefault();
      
          chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
            var activeURL = tabs[0].url
            // 2. Includes SD URL
            if(activeURL.toString().includes(""))
            {   chrome.tabs.create({'url': chrome.extension.getURL('/HTML/bin.html')}, function(tab) {
                    localStorage.setItem('chrome-extension-id',tab.id)
                 });
            }
            
            else  
             {  var x = localStorage.getItem('dontshowagain')
                if(x != 'true'){
                   // 3. Includes SD URL
                    var sdurl = "?chrome_extension_redirect=true";
                    localStorage.setItem('dontshowagain','true')
                }
                else
                  var sdurl = ""; // 4. Includes SD URL
                 chrome.tabs.create({ url: sdurl });
                //
            }
        });
             
    }, false);
  }, false);
  
 