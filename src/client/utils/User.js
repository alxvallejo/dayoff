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
