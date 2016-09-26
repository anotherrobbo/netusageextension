var debug = false;
var blankOption = "--- Pick an Option ---";

// OBJECT DEFINITIONS
// An option to be set on the Extension Options page.
function Option(type, label, id, values, defVal) {
	this.type = type;
	this.label = label;
	this.id = id;
	this.values = values;
	this.defVal = defVal;
}

// Connection details used to load UsageData.
function ConnectionDetails() {
	this.action = "";
	this.url = "";
    this.username = "";
    this.password = "";
	this.params = null;
	this.loaded = false;
	this.error = "";
}

// Usage Data holding current usage.
function UsageData() {
	this.user;
	this.plan;
	this.unit;

	this.usageTypes = new Object();
	
	this.lastReset;
	this.nextReset;
	
	this.daysRemaining;
	this.hoursRemaining;
	this.totalDays;
	
	this.loaded = false;
	this.error = "";
}

function UsageType() {
	this.quota;
	this.usage;
	this.pct;
	this.remaining;
}

function getDisplayUsage(usageType, unit) {
	displayUnit = localStorage["displayUnit"];
	if (!displayUnit || displayUnit == blankOption) {
		displayUnit = unit;
	}
	var convUsage = convertUnits(unit, displayUnit, usageType.usage);
	var convQuota = convertUnits(unit, displayUnit, usageType.quota);
	var convPct = " (" + usageType.pct + "%)";
	var displayedUsage = convUsage;
	if (convQuota > 0) {
		displayedUsage += " / "
		displayedUsage += convQuota;
	}
	displayedUsage += " ";
	displayedUsage += displayUnit;
	if (convQuota > 0) {
		displayedUsage += convPct;
	}

	return displayedUsage;
}

function doDataPctCalc(data) {
	for (usageType in data.usageTypes) {
		theUsage = data.usageTypes[usageType]
		theUsage.pct = Math.round(theUsage.usage / theUsage.quota * 100);
		theUsage.remaining = theUsage.quota - theUsage.usage;
	}
}

function doDataDateCalc(data) {
	var lastResetDate = parseDate(data.lastReset);
	var nextResetDate = parseDate(data.nextReset);
	var remaining = getRemainingFromNext(nextResetDate);
	data.daysRemaining = remaining.days;
	data.hoursRemaining = remaining.hours;
	data.totalDays = daysBetween(lastResetDate, nextResetDate);
	
	data.peakPerDayRemaining = Math.round(data.peakRemaining / (data.daysRemaining + 1));
	data.offpeakPerDayRemaining = Math.round(data.offpeakRemaining / (data.daysRemaining + 1));
}

// Load up the script file for the given isp if it does not already exist on the page.
// Replaces any existing isp script element.
function loadISP(isp, func) {
	var newelement = createISP(isp, func);
	var targetelement = "script";
	var targetattr = "src";
	var allsuspects = document.getElementsByTagName(targetelement);
	for (var i = allsuspects.length - 1; i >= 0; i--) {
		if (allsuspects[i] && allsuspects[i].getAttribute(targetattr) != null && allsuspects[i].getAttribute(targetattr).indexOf("isp_") != -1) {
			if (allsuspects[i].getAttribute(targetattr) == "js/isp_" + isp + ".js") {
				return true;
			} else {
				allsuspects[i].parentNode.replaceChild(newelement, allsuspects[i])
				return false;
			}
		}
	}
	document.getElementsByTagName("head")[0].appendChild(newelement);
	return false;
}

// Create a new script element pointing to the given isp's javascript file
function createISP(isp, func) {
	var ispJs = document.createElement("script");
	ispJs.setAttribute("type","text/javascript");
	ispJs.setAttribute("src", "js/isp_" + isp + ".js");
	ispJs.onload = func;
	return ispJs;
}

// Store an object to local storage with JSON stringify
function storeObject(key, obj) {
	var objString = JSON.stringify(obj);
	localStorage[key] = objString;
}

// Load an object from local storage with JSON parse
function loadObject(key) {
	var objString = localStorage[key];
	if (objString) {
		return JSON.parse(objString);
	}
}

// Returns basic options likely to be shared by all ISPs
function getBasicOptions() {
	var options = [];
	var count = options.length;
	// Unit dropdown field
	options[count++] = new Option("select", "Display Units", "displayUnit", 
			[["B","Bytes (B)",1],
	        ["MB","Megabytes (MB)",3],
	        ["GB","Gigabytes (GB)",6]
	        ]);
	options[count++] = new Option("check", "Show Percentage on Graph", "graphText", null, "true");
	options[count++] = new Option("select", "Auto Refresh", "refresh", 
			[[0, "Never"]
		   ,[300000, "5 Minutes"]
		   ,[900000, "15 Minutes"]
		   ,[1800000, "30 Minutes"]
		   ,[3600000, "1 Hour"]
		   ,[7200000, "2 Hours"]
		   ,[21600000, "6 Hours"]
		   ,[43200000, "12 Hours"]
		   ,[86400000, "24 Hours"]
		    ]);
	options[count++] = new Option("select", "Graph 1", "graph1", getUsageTypes());
	options[count++] = new Option("select", "Graph 2", "graph2", getUsageTypes());
	return options;
}

// Returns the date in the format dd/MM/yyyy
function formatDate(date) {
	var year = date.getFullYear();
	var month = (date.getMonth() + 1);
	if (month < 10) {
		month = "0" + month;
	}
	var day = date.getDate();
	if (day < 10) {
		day = "0" + day;
	}
	return day + "/" + month + "/" + year;
}

// Parses the dateString in the format dd/MM/yyyy
function parseDate(dateString) {
	var year = dateString.substring(6, 10);
	var month = dateString.substring(3, 5) - 1;
	var day = dateString.substring(0, 2);
	var date = new Date(year, month, day);
	return date;
}

// Returns the number of days between 2 dates
function daysBetween(date1, date2) {
    // The number of milliseconds in one day
    var ONE_DAY = 1000 * 60 * 60 * 24;
    // Convert both dates to milliseconds
    var date1_ms = date1.getTime();
    var date2_ms = date2.getTime();
    // Calculate the difference in milliseconds
    var difference_ms = Math.abs(date1_ms - date2_ms);
    // Convert back to days and return
    return Math.round(difference_ms/ONE_DAY);
}

// Returns the number of days in the given month (0 = Jan)
function daysInMonth(month, year) {
	// Note: months are zero indexed!
	switch(month) {
		case 3:
		case 5:
		case 8:
		case 10:
			return 30;
		case 1:
			if (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0)) {
				return 29;
			} else {
				return 28;
			}
		default:
			return 31;
	}
}

// Tries to guess the next reset date based on one month from the given start date
function getNextReset(date) {
	var nextMonth = date.getMonth() < 11 ? date.getMonth() + 1 : 0;
	var nextYear = nextMonth > 0 ? date.getFullYear() : date.getFullYear() + 1;
	var nextDay = Math.min(date.getDate(), daysInMonth(nextMonth, nextYear));
	var nextDate = new Date(nextYear, nextMonth, nextDay);
	return nextDate;
}

// Tries to guess the last reset date based on one month before the given rollover date
function getLastReset(date) {
	var lastMonth = date.getMonth() > 0 ? date.getMonth() - 1 : 11;
	var lastYear = lastMonth < 11 ? date.getFullYear() : date.getFullYear() - 1;
	var lastDay = Math.min(date.getDate(), daysInMonth(lastMonth, lastYear));
	var lastDate = new Date(lastYear, lastMonth, lastDay);
	return lastDate;
}

// Tries to guess the remaining time to reset based on one month from the given start date
function getRemainingFromLast(date) {
	var nextDate = getNextReset(date);
	return getRemainingFromNext(nextDate);
}

// Calculates the number of days & hours between now and the given date
function getRemainingFromNext(date) {
	var remaining = new Object();
	var days = 0;
	var nowDate = new Date();
	if (nowDate.getMonth() != date.getMonth()) {
		// need to figure out how many days left in the month
		days = daysInMonth(nowDate.getMonth(), nowDate.getFullYear()) - nowDate.getDate();
		days = days + date.getDate();
		remaining.days = days;
	} else {
		remaining.days = date.getDate() - nowDate.getDate();
	}
	if (nowDate.getHours() > 0) {
		remaining.days = remaining.days - 1;
		remaining.hours = 24 - nowDate.getHours();
	} else {
		remaining.hours = 0;
	}
	return remaining;
}

function convertUnits(fromUnits, toUnits, data) {
	var units = new Object()
	units["B"] = 0;
	units["MB"] = 6;
	units["GB"] = 9;
	from = units[fromUnits];
	to = units[toUnits];
	diff = from - to;
	//console.log(diff);
	if (diff < 1) {
		return Math.round(data / Math.pow(10, Math.abs(diff)));
	} else if (diff > 1) {
		return data * Math.pow(10, diff);
	} else {
		return data;
	}
}

// DOM RELATED HELPERS
function removeAllChildren(node) {
	if (node && node.hasChildNodes && node.removeChild) {
		while (node.hasChildNodes()) {
			node.removeChild(node.firstChild);
		}
	}
}

// PERFORM A SIMPLE, SYNCHRONOUS XMLHttpRequest CALL
// TODO Error handling
function callURL(url) {
	var request = new XMLHttpRequest();
	request.open("GET", url, false);  // 'false' makes the request synchronous
	request.send(null);

	if (request.status === 200) {
	  return request.responseText;
	}
}

function callURLForXml(url) {
	var request = new XMLHttpRequest();
	request.open("GET", url, false);  // 'false' makes the request synchronous
	request.send(null);

	if (request.status === 200) {
	  return request.responseXML;
	}
}