var debug = false;

// OBJECT DEFINITIONS
// An option to be set on the Extension Options page.
function Option(type, label, id, values) {
	this.type = type;
	this.label = label;
	this.id = id;
	this.values = values;
}

// Connection details used to load UsageData.
function ConnectionDetails() {
	this.action = "";
	this.url = "";
	this.loaded = false;
	this.error = "";
}

// Usage Data holding current usage.
function UsageData() {
	this.user;
	this.plan;
	this.unit;

	this.peakQuota;
	this.peakDl;
	this.peakPct;
	
	this.offpeakQuota;
	this.offpeakDl;
	this.offpeakPct;
	
	this.uploadQuota;
	this.upload;
	this.uploadPct;
	
	this.miscQuota;
	this.miscDl;
	this.miscPct;
	this.miscName;
	
	this.lastReset;
	this.nextReset;
	
	this.daysRemaining;
	this.hoursRemaining;
	this.totalDays;
	
	this.loaded = false;
}

function doDataPctCalc(data) {
	data.peakPct = Math.round(data.peakDl / data.peakQuota * 100);
	data.offpeakPct = Math.round(data.offpeakDl / data.offpeakQuota * 100);
	data.uploadPct = Math.round(data.upload / data.uploadQuota * 100);
}

function doDataDateCalc(data) {
	var lastResetDate = parseDate(data.lastReset);
	var nextResetDate = parseDate(data.nextReset);
	var remaining = getRemainingFromNext(nextResetDate);
	data.daysRemaining = remaining.days;
	data.hoursRemaining = remaining.hours;
	data.totalDays = daysInMonth(lastResetDate.getMonth, lastResetDate.getFullYear());
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

// DOM RELATED HELPERS
function removeAllChildren(node) {
	if (node && node.hasChildNodes && node.removeChild) {
		while (node.hasChildNodes()) {
			node.removeChild(node.firstChild);
		}
	}
}