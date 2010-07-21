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
	options[count++] = new Option("input", "Username", "username");
	options[count++] = new Option("input", "Password", "password");
	return options;
}

function getConnectionDetails() {
	var details = new ConnectionDetails();
	details.action = "GET";
	username = localStorage["username"];
	password = localStorage["password"];
	details.url = debug ? "adam.xml" : "https://" + username + ":" + password + "@members.adam.com.au/um2.1/usage.php";
	details.loaded = username && password;
	if (!details.loaded) {
		details.error = "Username or Password missing"
	}
	return details;
}

function processData(xml, text) {
	var accounts = xml.getElementsByTagName("Account");

	for (var i = 0, account; account = accounts[i]; i++) {
		var type = account.getAttribute("type");
		if ("ADSL" == type) {
			return loadAccount(account);
		}
	}	
}

function getUsageTypes() {
	return [["Peak DL","Peak DL"], ["OffPeak DL","OffPeak DL"], ["Upload","Upload"], ["Newsgroup","Newsgroup"]];
}

function loadAccount(account) {
	var data = new UsageData();
	data.user = account.getAttribute("username");
	var planType = account.getElementsByTagName("PlanType")[0].textContent;
	var planSpeed = account.getElementsByTagName("PlanSpeed")[0].textContent;
	data.plan = planType + " " + planSpeed;
	data.unit = "MB";
	
	data.usageTypes["Peak DL"] = new UsageType();
	data.usageTypes["OffPeak DL"] = new UsageType();
	data.usageTypes["Upload"] = new UsageType();
	data.usageTypes["Newsgroup"] = new UsageType();
	
	var quota = account.getElementsByTagName("MegabyteQuota")[0].textContent;
	var datablocks = account.getElementsByTagName("MegabyteDatablocks")[0].textContent;
	data.usageTypes["Peak DL"].quota = parseInt(quota) + parseInt(datablocks);
	data.usageTypes["OffPeak DL"].quota = data.usageTypes["Peak DL"].quota;
	data.usageTypes["Upload"].quota = data.usageTypes["Peak DL"].quota;
	data.usageTypes["Newsgroup"].quota = account.getElementsByTagName("NewsgroupQuota")[0].textContent;
	
	var usage = account.getElementsByTagName("Usage")[0];
	data.usageTypes["Peak DL"].usage = usage.getElementsByTagName("MegabytesDownloadedPeak")[0].textContent;
	data.usageTypes["OffPeak DL"].usage = usage.getElementsByTagName("MegabytesDownloadedOffPeak")[0].textContent;
	data.usageTypes["Upload"].usage = usage.getElementsByTagName("MegabytesUploadedTotal")[0].textContent;
	data.usageTypes["Newsgroup"].usage = usage.getElementsByTagName("MegabytesNewsgroupTotal")[0].textContent;
	
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