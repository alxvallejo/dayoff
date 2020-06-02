import React from 'react';

import InputRange from 'react-input-range';
import 'react-input-range/lib/css/index.css';
import { calcAge } from '../../utils/user';

export const AgePrefSelection = ({ birthday, agePref, updateAgePref }) => {
	const defaultVal = { min: 18, max: 50 };

	const agePrefValid = () => {
		if (agePref) {
			if (!agePref.min || !agePref.max) {
				return false;
			}
			return true;
		}
		return false;
	};

	const getAgeInputFieldValue = () => {
		if (!birthday) {
			return defaultVal;
		}
		if (agePref) {
			if (!agePref.min || !agePref.max) {
				const age = calcAge(birthday);
				const minBound = Math.max(18, age - 3);
				const maxBound = age + 3;
				return { min: minBound, max: maxBound };
			}
			return { min: agePref.min, max: agePref.max };
		}
		return defaultVal;
	};

	const inputVal = getAgeInputFieldValue();

	return (
		<div className="age-range-input">
			<InputRange maxValue={50} minValue={18} value={inputVal} onChange={updateAgePref} />
		</div>
	);
};
