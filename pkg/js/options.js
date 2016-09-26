var background = chrome.extension.getBackgroundPage();

var countries = [ [ "au", "Australia" ], [ "nz", "New Zealand" ] ];
var isps = new Object();
isps.au = [ [ "adam", "Adam Internet" ]
 , ["internode","Internode"]
// , ["bigpond","BigPond"]
// , ["optusnet","OptusNet"]
// , ["exetel","Exetel"]
];
isps.nz = [ [ "orcon", "Orcon" ] ];

function createOptions() {
	if (!localStorage["country"]) {
		// default to first in array
		localStorage["country"] = countries[0][0];
	}
	if (!localStorage["isp"]) {
		// default to first in array
		localStorage["isp"] = isps[localStorage["country"]][0][0];
	}
	// Country dropdown field
	var countryField = addField("Country", createSelectField("country", countries), "mainOptions");
	countryField.onchange = function() {
		countryChanged(this.value);
	};
	countryField.value = localStorage["country"];
	console.log("Loaded " + countryField.id + " : " + localStorage["country"]);
	// ISP dropdown field
	var ispField = addField("ISP", createSelectField("isp", isps[localStorage["country"]]), "mainOptions");
	ispField.onchange = function() {
		ispChanged(this.value);
	};
	ispField.value = localStorage["isp"];
	console.log("Loaded " + ispField.id + " : " + localStorage["isp"]);

	ispChanged(localStorage["isp"]);
}

function createCustomOptions() {
	// clear out current options
	removeAllChildren(document.getElementById("leftColumn"));
	var options = getCustomOptions();
	for ( var i = 0, option; option = options[i]; i++) {
		if ("select" == option.type) {
			addCustomField(option.label, createSelectField(option.id,
					option.values));
		} else if ("check" == option.type) {
			addCustomField(option.label, createCheckboxField(option.id, option.defVal));
		} else {
			addCustomField(option.label, createField(option.id));
		}
	}
	restoreOptions();
}

function createSelectField(fieldId, values) {
	var field = document.createElement("select");
	field.id = fieldId;
	var option = document.createElement("option");
	option.value = null;
	option.innerHTML = blankOption;
	field.appendChild(option);
	// when country is not selected, values is undefined
	if (values) {
		for ( var i = 0, value; value = values[i]; i++) {
			var option = document.createElement("option");
			option.value = value[0];
			option.innerHTML = value[1];
			field.appendChild(option);
		}
	}
	field.className = "field"
	/*
	 * <select id="isp">
	 * 		<option class="field" value="adam">Adam Internet</option>
	 * </select>
	 */
	return field;
}

function createCheckboxField(fieldId, checked) {
	var field = document.createElement("input");
	field.type = "checkbox";
	field.id = fieldId;
	field.className = "cbfield";
	field.checked = checked;
	return field;
}

function createField(fieldId) {
	var field = document.createElement("input");
	if ("password" == fieldId) {
		field.type = "password";
	} else {
		field.type = "text";
	}
	field.id = fieldId;
	field.className = "field";
	return field;
}

function addCustomField(fieldLabel, field) {
	return addField(fieldLabel, field, "leftColumn");
}

function addField(fieldLabel, field, containerId) {
	var optionDiv = document.createElement("div");
	optionDiv.className = "optionDiv";

	var labelDiv = document.createElement("div");
	labelDiv.className = "fieldLabel";
	labelDiv.innerHTML = fieldLabel + ":";
	optionDiv.appendChild(labelDiv);

	var fieldDiv = document.createElement("div");
	fieldDiv.className = "fieldDiv";
	fieldDiv.appendChild(field);
	optionDiv.appendChild(fieldDiv);

	document.getElementById(containerId).appendChild(optionDiv);

	/*
	 * <div class="option">
	 * 		<div class="fieldLabel">Provider:</div>
	 * 		<div class="fieldDiv"><input class="field" type="" id="" /></div>
	 * </div>
	 */
	return field;
}

function countryChanged(country) {
	console.log("countryChanged: " + country);
	var ispField = document.getElementById("isp");
	var newIspField = createSelectField("isp", isps[country]);
	newIspField.onchange = function() {
		ispChanged(this.value);
	};
	ispField.parentNode.replaceChild(newIspField, ispField);
	// default to first in array
	// newIspField.value = isps[localStorage["country"]][0][0];
	// if (newIspField.onchange) {
	// newIspField.onchange();
	// }
}

function ispChanged(isp) {
	console.log("ispChanged: " + isp);
	var ispLoaded = loadISP(isp, function() {
		createCustomOptions();
	});
	if (ispLoaded) {
		createCustomOptions();
	}
}

// Saves options to localStorage.
function saveOptions(e) {
	console.log("saveOptions");
	background.cancelScheduledUpdate();
	localStorage.clear();
	var fields = document.getElementsByClassName("field");
	for ( var i = 0, field; field = fields[i]; i++) {
		localStorage[field.id] = field.value;
		console.log("Stored " + field.id + " : " + localStorage[field.id]);
	}
	fields = document.getElementsByClassName("cbfield");
	for ( var i = 0, field; field = fields[i]; i++) {
		localStorage[field.id] = field.checked;
		console.log("Stored " + field.id + " : " + localStorage[field.id]);
	}

	// Update status to let user know options were saved.
	var status = document.getElementById("status");
	status.innerHTML = "Options Saved.";
	setTimeout(function() {
		status.innerHTML = "";
	}, 1000);
	background.updateUsage();
}

// Restores field states to saved values from localStorage.
function restoreOptions() {
	console.log("restoreOptions");
	var customOptions = document.getElementById("customOptions");
	var fields = customOptions.getElementsByClassName("field");
	for (var i = 0, field; field = fields[i]; i++) {
		var newValue = localStorage[field.id];
		if (newValue) {
			var origValue = field.value;
			field.value = newValue;
			console.log("Loaded " + field.id + " : " + newValue + ", OLD : " + origValue);
		}
	}
	fields = customOptions.getElementsByClassName("cbfield");
	for (var i = 0, field; field = fields[i]; i++) {
		var newValue = localStorage[field.id];
		if (newValue) {
			var origValue = field.checked;
			field.checked = newValue;
			console.log("Loaded " + field.id + " : " + newValue + ", OLD : " + origValue);
		}
	}
}

// Add event listeners once the DOM has fully loaded by listening for the 'DOMContentLoaded' event
// on the document, and adding your listeners to specific elements when it triggers.
document.addEventListener('DOMContentLoaded', function () {
	document.querySelector('button').addEventListener('click', saveOptions);
	createOptions();
});