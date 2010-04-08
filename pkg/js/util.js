function storeObject(key, obj) {
	var objString = JSON.stringify(obj);
	localStorage[key] = objString;
}

function loadObject(key) {
	var objString = localStorage[key];
	if (objString) {
		return JSON.parse(objString);
	}
}

function toDateString(date) {
	return date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
}

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

function getRemainingFromLast(date) {
	var nextMonth = date.getMonth() < 11 ? date.getMonth() + 1 : 0;
	var nextYear = nextMonth > 0 ? date.getFullYear() : date.getFullYear() + 1;
	var nextDay = Math.min(date.getDate(), daysInMonth(nextMonth, nextYear));
	var nextDate = new Date(nextYear, nextMonth, nextDay);
	return getRemainingFromNext(nextDate);
}

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