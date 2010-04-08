function processData(xml) {
	var accounts = xml.getElementsByTagName("Account");

	for (var i = 0, account; account = accounts[i]; i++) {
		var type = account.getAttribute("type");
		if ("ADSL" == type) {
			return loadAccount(account);
		}
	}	
}

function loadAccount(account) {
	var data = new Object();
	data.user = account.getAttribute("username");
	var planType = account.getElementsByTagName("PlanType")[0].textContent;
	var planSpeed = account.getElementsByTagName("PlanSpeed")[0].textContent;
	data.plan = planType + " " + planSpeed;
	//data.lastUpdate;
	//data.nextUpdate;
	
	data.unit = "MB";
	data.quota = account.getElementsByTagName("MegabyteQuota")[0].textContent;
	var usage = account.getElementsByTagName("Usage")[0];
	data.peakDl = usage.getElementsByTagName("MegabytesDownloadedPeak")[0].textContent;
	data.offpeakDl = usage.getElementsByTagName("MegabytesDownloadedOffPeak")[0].textContent;
	data.upload = usage.getElementsByTagName("MegabytesUploadedTotal")[0].textContent;
	data.peakPercent = Math.round(data.peakDl / data.quota * 100);
	data.offpeakPercent = Math.round(data.offpeakDl / data.quota * 100);
	data.uploadPercent = Math.round(data.upload / data.quota * 100);
	
	var lastResetDate = parseDate(account.getElementsByTagName("QuotaStartDate")[0].textContent);
	data.lastReset = toDateString(lastResetDate);
	var remaining = getRemainingFromLast(lastResetDate);
	data.daysRemaining = remaining.days;
	data.hoursRemaining = remaining.hours;
	data.totalDays = daysInMonth(lastResetDate.getMonth, lastResetDate.getFullYear());
	return data;
}

function getConnectionDetails() {
	var details = new Object();
	details.action = "GET";
	username = localStorage["username"];
	password = localStorage["password"];
	details.loaded = username && password;
	details.url = "https://" + username + ":" + password + "@members.adam.com.au/um2.1/usage.php";
	return details;
}

function parseDate(dateString) {
	var year = dateString.substring(0, 4);
	var month = dateString.substring(5, 7) - 1;
	var day = dateString.substring(8, 10);
	var date = new Date(year, month, day);
	return date;
}