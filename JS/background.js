// Initialize a global variable that holds all the settings
DEBUG_MODE 		= true;
settings 		= new Object();
SR_TYPE			=  2;
SEV_LEVEL 		=  9;
LAST_EMAIL 		= 11;
TIME_LEFT		= 22;
FDR_STATE 		= 23;
SERVICE_LEVEL 	= 28;
ENTITLEMENT 	= 30;
TIMEZONE 		= 31;
COUNTRY 		= 33;
CONTACT_INFO 	= 35;
CUSTOMER_TITLE 	= 36;
INTERNAL_TITLE 	= 41;


if(localStorage.settings == null){
	settings.case_type = 'Open'
	settings.available_categories = []
	settings.available_categories.push("Uncategorized")
	settings.categorized_cases = []
	settings.cases = new Object();
	settings.list_of_cases = []
	settings.cases_in_each_category = new Object();
	settings.cases_in_each_category["Uncategorized"] = new Object();;
	settings.cases_in_each_category["Uncategorized"].case_numbers=[];
	settings.cases_in_each_category["Uncategorized"].count=0;
	settings.cases_in_each_category["Uncategorized"].color="";
	settings.page_properties = new Object();
	settings.page_properties.case_type = "Open"
	settings.page_properties.bg_color = "#ddd097"
	updateSettings();
}
else {
	settings = JSON.parse(localStorage.settings);	
}

function updateSettings(){
	localStorage.setItem('settings', JSON.stringify(settings));
}

function log(message){
	if(DEBUG_MODE)
		console.log(message);
}

function uniq(array){
	return Array.from(new Set(array));	
}

// When the extension is launched for the first time
chrome.runtime.onInstalled.addListener(function () {
	console.log("Extension Installed - Creating Context Menus")
	//createContextMenus();
});

// When extension is launced everytime
chrome.runtime.onStartup.addListener(function () {
	console.log("Chrome: StartUp - Creating Context Menus");
	//createContextMenus();
})

// Create a Context Menu
function createContextMenus() {
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

}

function catergorizetheCase() {
	return function (info, tab) {
		console.log("Categorized Cases : ", settings.categorized_cases)
		settings.categorized_cases.push(info.selectionText)
		settings.categorized_cases = uniq(settings.categorized_cases)
		// update cases_in_each_Cateogory
		settings.cases_in_each_category[info.menuItemId].case_numbers.push(info.selectionText)
		settings.cases_in_each_category["Uncategorized"].case_numbers.splice(settings.cases_in_each_category[info.menuItemId].case_numbers.indexOf(info.selectionText),1)
		settings.cases[info.selectionText].category = info.menuItemId
		getMyCases(fresh_list=false)
		display_count_of_cases()
		getTextArea()
	};
}

function display_count_of_cases() {
	var categories = settings.available_categories;
	log("Context Menus created");

	categories.forEach(x => 
		{ 
			try{
			settings.cases_in_each_category[x].count = settings.cases_in_each_category[x].case_numbers.length;
			document.getElementById('count_' + x).innerHTML = "(" + settings.cases_in_each_category[x].count + ")"
			}
			catch(err){
				console.log(err)
			}
		}
		);
	try{
	settings.cases_in_each_category["Uncategorized"].count = settings.cases_in_each_category["Uncategorized"].case_numbers.length;
	document.getElementById('count_Uncategorized').innerHTML = "(" + settings.cases_in_each_category["Uncategorized"].count + ")";
	}
	catch(err){
		console.log(err)
	}

}

function getTextArea() {
	Object.keys(settings.cases).forEach(cn=> {
		var temp = document.getElementById(cn);
		var initalMessage = !settings.cases[cn].comments ? "":settings.cases[cn].comments;
		temp.innerHTML = "<textarea id='td_" + cn + "' style='height=100%;width:100%;background: transparent;font-family: 'Gill Sans', 'Gill Sans MT', Calibri, 'Trebuchet MS', sans-serif' readOnly='readonly'>" + initalMessage + "</textarea>"
	})
}

// !!! Render HTML 
function renderHTML(textMessage, n) {
	var cn_index_map = new Object();
	var message = ""
	var categories = settings.available_categories

	if (!categories.length) {
		alert("Please click on Settings and Add a new Category")
	}
	settings.list_of_cases = [];
	//var cases_to_remove = [];
	for (var index = 0; index < n; index++) {
		// map case_number with index
		cn_index_map[textMessage[index][0]] = index;

		// Add the case number to the list_of_cases
		settings.list_of_cases.push(textMessage[index][0]);

		// if case not available before, mark it uncategorized and increase the count 
		if(!settings.cases[textMessage[index][0]] ){
		   var case_number = textMessage[index][0];
		   settings.cases[case_number] = new Object();
		   settings.cases[case_number].category = "Uncategorized"
		   settings.cases_in_each_category["Uncategorized"].case_numbers.push(textMessage[index][0])
		   settings.cases_in_each_category["Uncategorized"].count += 1;
		   
		}
	}

	sanity_check();

	Object.keys(settings.cases).forEach(x=> {
		if(! settings.list_of_cases.includes(x)){
			var temp = settings.cases_in_each_category[settings.cases[x].category].case_numbers
				temp.splice(temp.indexOf(x),1)			
				delete settings.cases[x];
		}
	})

	updateSettings();

	var headerArray = new Array("Case Number", "Internal Title", "Customer Details", "Case Info", "Additional Comments");
	headers = "<tr> "
	for (index = 0; index < headerArray.length; index++)
		headers = headers + "<td class='table-headers'> <center>" + headerArray[index] + "</center></td> "
	headers = headers + "</tr>"
	// for every category ,
	for(var cat_index = 0; cat_index < settings.available_categories.length ; cat_index++){
		var category = settings.available_categories[cat_index]
		var color = settings.cases_in_each_category[category].color;
		var msg = category + "  <div id='count_" + category + "' style='display: inline'> </div>" + " :<br> <table style='width:100%;table-layout: auto;background-color:" + color + "'> " + headers;
		var counter = 0

		//Select only uniq cases in this category :
		settings.cases_in_each_category[category].case_numbers =uniq(settings.cases_in_each_category[category].case_numbers);
		// for cases in this category
		for(var i=0; i < settings.cases_in_each_category[category].case_numbers.length; i++){
			case_index = cn_index_map[settings.cases_in_each_category[category].case_numbers[i]]
			var PHNo = ""
			var EmailID = ""
			var Name = ""
			var CxCountry 		= textMessage[case_index][COUNTRY]
			var CxTimezone 		= textMessage[case_index][TIMEZONE]
			var CxServiceLevel 	= textMessage[case_index][SERVICE_LEVEL]
			var Entitlement 	= textMessage[case_index][ENTITLEMENT]
			var CxSevLevel 		= textMessage[case_index][SEV_LEVEL]
			var lastEmail 		= new Date(textMessage[case_index][LAST_EMAIL].split('.')[0] + '.000Z')
			var FDRState 		= textMessage[case_index][FDRState]
			var title			= "";
			if (textMessage[case_index][INTERNAL_TITLE] != '')
				title = textMessage[case_index][INTERNAL_TITLE]
			else
				title = textMessage[case_index][CUSTOMER_TITLE]

			var caseTitle = textMessage[case_index][0];
			var c = JSON.parse(( textMessage[case_index][CONTACT_INFO]))

			// Filter our contact information :
			for(var contactinfo_index = 0; contactinfo_index < c.length ; contactinfo_index++){
				try {
					if (c[contactinfo_index].Contacts[0].IsPrimaryContact) {
						if (c[contactinfo_index].Contacts[0].hasOwnProperty('Email'))
							EmailID = c[contactinfo_index].Contacts[0].Email;
						if (c[contactinfo_index].Contacts[0].hasOwnProperty('Phone'))
							PHNo = c[contactinfo_index].Contacts[0].Phone;
						if (c[contactinfo_index].Contacts[0].hasOwnProperty('FirstName') && c[contactinfo_index].Contacts[0].hasOwnProperty('LastName'))
							Name = c[contactinfo_index].Contacts[0].FirstName + " " + c[contactinfo_index].Contacts[0].LastName;
					}
				} catch (err) {
					console.log(err.message)
				}

			}

			
			var ascUsed = settings.cases[textMessage[case_index][0]].asc_used ?  "<font style='color:green'><b>Yes</b></font>" : "<font style='color:red'><b>No</b></font>" ;
				
			// Case Details Translate :
			switch(CxSevLevel){
				case '2' : {CxSevLevel = 'A';break}
				case '3' : {CxSevLevel = 'B';break}
				case '4' : {CxSevLevel = 'C';break}
			}

			switch(CxServiceLevel){
				case 'Premier' 		: {CxServiceLevel = 'PREM';break}
				case 'Professional' : {CxServiceLevel = 'PRO';break}
				
			}

			if ((Entitlement.includes('Unified')) || (Entitlement.includes('Advanced')))
				CxServiceLevel = "MUS"
			
			
			if (FDRState == "Complete") 
				FDRState = "Yes"

			// Time left to make FDR :
			if (FDRState != "Yes" && FDRState != "Missed") {
				var currentTime = new Date()
				var timeLeft = new Date(textMessage[case_index][TIME_LEFT].split('.')[0] + '.000Z')
				var timeDiff = timeLeft.getTime() - currentTime.getTime() ///currentTime+" - "+lastEmail//Math.abs((currentTime.getTime() - lastEmail.getTime()) / 3600000)
				if (timeDiff > 0)
					FDRState = msToDHM(timeDiff).toString() + "left"
				else
					FDRState = "Missed"
			}

			// Phone Number Mapping 
			if (PHNo != "" && PHNo != null) {
				if (PHNo.startsWith('0'))
					PHNo = PHNo.substring(1, PHNo.length)

				if (!PHNo.includes('+'))
					PHNo = "+" + countryCodeToPHno[CxCountry] + " " + PHNo
			} else
				PHNo = "- - -"
			var temp = textMessage[case_index][0]

			// Check for Collab Tasks 
			if (textMessage[case_index][SR_TYPE] == "CollaborationTasks")
				caseTitle += " <br><font style='font-size:14'> <center> (Collab Task) </center> </font> "
			else if (textMessage[case_index][SR_TYPE] == "FollowUpTasks")
				caseTitle += " <br><font style='font-size:14'> <center> (Follow up Task) </center> </font> "

			bk = ""
			if (textMessage[case_index][2] == 'Case')
				bk = "<br>"
			caseTitle = caseTitle + bk + " <font style='font-size:14' > <center>" + CxServiceLevel + " " + CxSevLevel + " | " + "<a href='https://servicedesk.microsoft.com/#/customer/case/" + temp + "' target='_blank'> SD" + "</a> " + " | " + "<a href='https://azuresupportcenter.msftcloudes.com/caseoverview?srId=" + temp + "' target='_blank' id='asc_" + textMessage[case_index][0] + "'> ASC" + "</a> </center></font>"


			var defText = ""

			//var comments = settings.cases_in_each_category[category].case_numbers[textMessage[case_index][0]].comments;
			settings.cases[textMessage[case_index][0]].comments = settings.cases[textMessage[case_index][0]].comments == 'undefined' ? '' : settings.cases[textMessage[case_index][0]].comments;
			defText = settings.cases[textMessage[case_index][0]].comments;
			
			// Check when Last Email was Sent :
			var currentTime = new Date()
			var timeDiff = currentTime.getTime() - lastEmail.getTime() 
			if (settings.case_type != 'Closed')
				lastEmail = 'Last Update : ' + msToDHM(timeDiff).toString() + "ago"
			else
				{lastEmail = ""; ascUsed = ""};
			
			if (!msg.includes(caseTitle)) { // 10   40  15  10 25
				var msgItems = new Array(caseTitle,title, "<center>" + Name + " <br> " + EmailID + " <br> " + PHNo + "  " + timeZoneToOffset[CxTimezone] + "</center>", "<left> ASC Used : " + ascUsed + '</left><br> FDR: ' + FDRState + "<br>" + lastEmail, "<div id=cmt_" + textMessage[case_index][0] + ">" + defText + "</div>")
				var classnames = new Array("caseNumber", "Title", "CustomerDetails", "caseinfo", "addcomments")
				var colwidths = new Array(10, 30, 20, 17, 23)
				msg = msg + "<tr>"
				for (var l = 0; l < msgItems.length; l++) {
					if (l != 4)
						msg = msg + "<td class='" + classnames[l] + "' style='width:" + colwidths[l].toString() + "%'>" + msgItems[l] + "</td>"
					else
						msg = msg + "<td id='" + textMessage[case_index][0] + "' style='width:" + colwidths[l].toString() + '%' + "'>" + msgItems[l] + "</td>"
				}
				msg = msg + "</tr>"

				counter += 1;
			}	

		}  // end of per cases per category
		
		msg = msg + "</table> <br>"

		if (counter < 1) {
			msg = "";
			headerSet = false;
		}
		message = message + msg;

	} // end of iteration over category

	// Cases in each category :
	updateSettings();
	return message;

}


function updateDropDown() {
	var categories = settings.available_categories;
	e = document.getElementById('CC');
	e.innerHTML = ""
	categories.forEach(x=> {
		if(x != "Uncategorized"){
			var option = document.createElement('option');
				option.text = x;
				e.options.add(option);
		}
	});
}


function reload_page() {
	chrome.tabs.query({
		active: true,
		currentWindow: true
	}, function (tabs) {
		chrome.tabs.reload(tabs[0].id);
	});

}

function sanity_check(){
	// 1. Remove all duplicates from the cases_in_Each_category
	var sum = 0 ;
	Object.keys(settings.cases_in_each_category).forEach(x=>{
		settings.cases_in_each_category[x].case_numbers = uniq(settings.cases_in_each_category[x].case_numbers)
		settings.cases_in_each_category[x].count = settings.cases_in_each_category[x].case_numbers.length
		sum += settings.cases_in_each_category[x].count;
	})

	console.log('Removed all Duplicates in "cases_in_each_category object"')
	console.log('Total cases in "cases_in_each_category object" : '+sum)
	// 2. Total number of cases should be equal to the cases in each category
	sum != settings.list_of_cases ? console.log('List of Cases matching') : console.log('List of Cases not matching')
}

document.addEventListener('DOMContentLoaded', function () {
	var addCategory = document.getElementById('addCategory');
	var settingsButon = document.getElementById('settings');
	var viewCasesButton = document.getElementById('viewCases');
	var saveButton = document.getElementById('save');
	var bgColorpallete = document.getElementById('bg-colorbox');

	document.body.style.backgroundColor = settings.page_properties.bg_color;

	// When Color palette is changed
	if (bgColorpallete) {
		bgColorpallete.addEventListener('change', function () {
			document.body.style.backgroundColor = bgColorpallete.value;
			settings.page_properties.bg_color = bgColorpallete.value;
			updateSettings();
		})
	}

	// Update Context Menus on Document Load
	createContextMenus();

	// When View Cases button is clicked
	if (viewCasesButton) {
		viewCasesButton.addEventListener('click', function () {
			document.getElementById('settingsPage').style.display = 'none';
			document.getElementById('settingsPage').style.visibility = 'hidden';
			getMyCases(fresh_list=false);
		}, false);

	}

	// When Settings button is clicked
	if (settingsButon) {
		settingsButon.addEventListener('click', function () {
			document.getElementById('settingsPage').style.display = 'inline-table';
			document.getElementById('settingsPage').style.visibility = 'visible';
			updateDropDown();
		}, false);
	} 
	else {
		if (document.getElementById('settingsPage')) {
			document.getElementById('settingsPage').style.display = 'none';
			document.getElementById('settingsPage').style.visibility = 'hidden';
		}
	}

	// When case type is changed
	var ctype = document.getElementById('CS')
	if (ctype) {
		ctype.addEventListener('change', function () {
			var txt = ctype.options[ctype.selectedIndex].text
			console.log('Case Type Changed to ', txt)
			settings.page_properties.case_type = 'Close'
			
			var loadingpage = document.getElementById('cases')
			loadingpage.innerHTML = 'Loading ... <br> <div class="lds-ring"><div></div><div></div><div></div><div></div></div>'
			getMyCases(fresh_list=true)
		})

	}

	// When Add Category Button is clicked
	if (addCategory) {
		addCategory.addEventListener('click', function () {
			console.log("Add Category button clicked")
			var textBox = document.getElementById('enteredText')
			var colorPicker = document.getElementById('colorbox')
			settings.cases_in_each_category[textBox.value] = new Object();
			settings.cases_in_each_category[textBox.value].case_numbers = new Array(); 
			settings.cases_in_each_category[textBox.value].color = colorPicker.value;
			settings.available_categories.push(textBox.value);
			
			alert("Created a New Category '" + textBox.value + "'")
			console.log("Created a New Category '" + textBox.value + "'")
			textBox.value = ""
			createContextMenus();
			//updateContextMenus(category)
			console.log("Updated Context Menus")

			//localStorage.setItem('availableCategories', category.toString());
			updateDropDown()
			console.log('Updated DropDown List')
			updateSettings();

			delete category

		}, false);

	}

	// When Remove Category Button is clicked
	var removeCategory = document.getElementById('removeCategory');
	if (removeCategory) {
		removeCategory.addEventListener('click', function () {
			var e = document.getElementById('CC');
			var category = e.options[e.selectedIndex].text;
			// Remove the category from available categories
			settings.available_categories.splice(settings.available_categories.indexOf(category),1);
			// Move all categorized cases to Uncategorized :
			settings.cases_in_each_category[category].case_numbers.forEach(x=> {
				settings.cases_in_each_category["Uncategorized"].case_numbers.push(x);
				settings.cases[x].category = "Uncategorized";
				settings.cases[x].category = "";
			});
			// Remove the category key from settings :
			delete settings.cases_in_each_category[category];

			updateSettings();
			// Update Context Menus , Dropdown and reload the page
			createContextMenus();
			updateDropDown()
			alert('Removed Category : '+ category)
			getMyCases(fresh_list=true);

		}, false);
	}
	
	//When Add Comments button is pressed ;
	var addCommentButton = document.getElementById('addComments');
	if (addCommentButton) {
		addCommentButton.addEventListener('click', function () {
			document.getElementById('save').style.visibility = 'visible'
			document.getElementById('save').style.display = 'inline'

			settings.list_of_cases.forEach(x => {
				var temp = document.getElementById('td_' + x);
					temp.style.backgroundColor = 'white';
					temp.readOnly = false;
					temp.value = settings.cases[x].comments == 'undefined' ? "":settings.cases[x].comments ;
			})

		}, false);
	}

	// When Save button is clicked
	if (saveButton) {
		saveButton.addEventListener('click', function () {
			settings.list_of_cases.forEach(x => {
				var temp = document.getElementById('td_' + x);
					temp.style.backgroundColor = 'transparent';
					temp.readOnly = true
					settings.cases[x].comments = temp.value == 'undefined' ? "": temp.value ;
			})

			updateSettings();
			saveButton.style.display = 'none'
			saveButton.style.visibility = 'hidden'
			delete cases
		}, false);
	}

	var listOfCases = document.getElementById('cases');
	if (listOfCases)
		getMyCases(fresh_list= true);


});

function getDataFromStorage(key) {
	return (localStorage.getItem(key))
}

function writeToStorage(key, value) {
	localStorage.setItem(key, value);
}


function getMyCases(fresh_list=false) {
	access_token = localStorage.getItem('access_token')
	var casetype = settings.page_properties.case_type;

	if(fresh_list){
		var xhr = new XMLHttpRequest();
		//1. API call to fetch the list of cases :
		var  url = "";
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/json");
		console.log('Making a new Post Request')
		xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
		var username = localStorage.getItem('upn')
		console.log(username)
		//2. Body of the Post Request 
		var body = {
			
		}
	
		xhr.send(JSON.stringify(body));
		xhr.onreadystatechange = function ()  {		
			console.log(xhr.status)
			if ((xhr.readyState === 4) && (xhr.status == 401 || xhr.status == 0)) {
				alert('Session Expired. Redirecting you to Service Desk Homepage');
				//3. Service Desk Homepage URL
				var sdurl = "";
				chrome.tabs.create({
					url: sdurl
				});
			}		
	
			if (xhr.readyState === 4 && xhr.status === 200)  {
				var listOfCases = document.getElementById('cases');
				textMessage = JSON.parse(xhr.response)
				textMessage = textMessage.table_parameters[0].table_parameter_result			
				localStorage.setItem('textMessage', JSON.stringify(textMessage))
				var n = textMessage.length
				listOfCases.innerHTML = renderHTML(textMessage, n) 
				// render html should update list_of_cases
				display_count_of_cases()
				addASCButtonListeners()
				getTextArea();
			}
		};

	}
	else{
		var listOfCases = document.getElementById('cases');
		var textMessage = new Object();
			textMessage = JSON.parse(localStorage.textMessage)
			var n = textMessage.length
		listOfCases.innerHTML = renderHTML(textMessage, n) 
		display_count_of_cases()
		addASCButtonListeners()
		getTextArea();

	}

}

function addASCButtonListeners() {
	var myCases = Object.keys(settings.cases);
	myCases.forEach(x => 
			{
				document.getElementById('asc_' + x).addEventListener('click', function (){
					settings.cases[x].asc_used = true;
					updateSettings();
					getMyCases(fresh_list=false);
					});
			}
		);
	}

function msToDHM(milliseconds) {
	var days = milliseconds / 8.64e7 | 0;
	var hrs = (milliseconds % 8.64e7) / 3.6e6 | 0;
	var mins = Math.round((milliseconds % 3.6e6) / 6e4);
	var dtime = ""
	if (days > 0 && days != 1) dtime += days + ' days,'
	if (days == 1) dtime += days + ' day, '

	if (days > 1)
		dtime = "<font style='color:red'> <b>" + days + ' days, ' + z(hrs) + ' hours, ' + z(mins) + ' min  </b></font>'
	else
		dtime += z(hrs) + ' hours, ' + z(mins) + ' min '
	return dtime

	function z(n) {
		return (n < 10 ? '0' : '') + n;
	}
}



