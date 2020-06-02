const moment = require('moment');

export const defaultPrefCategory = 'Hangout';

export const getPrefCategory = (profile) => {
	if (!profile) {
		return defaultPrefCategory;
	}
	const { gender, preference } = profile;
	if (!gender || !preference) {
		return defaultPrefCategory;
	}
	const firstP = gender.charAt(0);
	const lastP = preference.charAt(0);
	return firstP + '4' + lastP;
};

export const calcAge = (birthday) => {
	if (!birthday) {
		return null;
	}
	return moment().diff(birthday, 'years');
};
