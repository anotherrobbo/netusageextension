/*
ISP specific JavaScript for Adam Internet

MUST implement the following methods:
getCustomOptions (returns an array of Option Objects)
getConnectionDetails (returns a ConnectionDetails Object)
processData(xml, text) (processes the supplied input data to return a UsageData Object)
getUsageTypes() (returns the different Usage Types available in this ISPs data)

See util.js for details on individual Objects
*/

function getCustomOptions() {
	// make a call to function in util.js
	var options = getBasicOptions();
	var count = options.length;
	options[count++] = new Option("input", "Token", "token");
	return options;
}

function getConnectionDetails() {
	var details = new ConnectionDetails();
	details.action = "GET";
	token = localStorage["token"];
	details.url = debug ? "adam.xml" : "https://:" + token + "@members.adam.com.au/api/";
	details.loaded = token;
	if (!details.loaded) {
		details.error = "Token missing"
	}
	return details;
}

function getXml(xml, tagName, attrName, attrValue) {
	var items = xml.getElementsByTagName(tagName);

	for (var i = 0, item; item = items[i]; i++) {
		var type = item.getAttribute(attrName);
		if (attrValue == type) {
			return item;
		}
	}	
}

function processData(xml, text) {
	account = getXml(xml, "Account", "type", "ADSL");
	return loadAccount(account);
}

function getUsageTypes() {
	return [["Download","Download"], ["Newsgroup","Newsgroup"]];
}

function loadAccount(account) {
	var data = new UsageData();
	data.user = account.getAttribute("username");
	var planName = account.getElementsByTagName("PlanName")[0].textContent;
	var planType = account.getElementsByTagName("PlanType")[0].textContent;
	var planSpeed = account.getElementsByTagName("PlanSpeed")[0].textContent;
	data.plan = planName;// + "<br/>" + planType + " " + planSpeed;
	data.unit = "B";
	
	data.usageTypes["Download"] = new UsageType();
	data.usageTypes["Newsgroup"] = new UsageType();
	
	var dloadBucket = getXml(account, "Bucket", "desc", "Download");
	var newsgroupBucket = getXml(account, "Bucket", "desc", "Newsgroups");

	var quota = dloadBucket.getElementsByTagName("Quota")[0].textContent;
	var datablocks = account.getElementsByTagName("Datablocks")[0].textContent;
	data.usageTypes["Download"].quota = parseInt(quota) + parseInt(datablocks);
	data.usageTypes["Newsgroup"].quota = newsgroupBucket.getElementsByTagName("Quota")[0].textContent;
	
	data.usageTypes["Download"].usage = dloadBucket.getElementsByTagName("Usage")[0].textContent;
	data.usageTypes["Newsgroup"].usage = newsgroupBucket.getElementsByTagName("Usage")[0].textContent;
	
	var lastResetDate = parseAdamDate(account.getElementsByTagName("QuotaStartDate")[0].textContent);
	data.lastReset = formatDate(lastResetDate);
	
	var nextResetDate = getNextReset(lastResetDate);
	data.nextReset = formatDate(nextResetDate);
	
	doDataPctCalc(data);
	
	data.loaded = true;
	return data;
}

function parseAdamDate(dateString) {
	var year = dateString.substring(0, 4);
	var month = dateString.substring(5, 7) - 1;
	var day = dateString.substring(8, 10);
	var date = new Date(year, month, day);
	return date;
}