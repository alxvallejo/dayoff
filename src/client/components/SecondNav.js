import React, { useContext } from 'react';

import { UserContext } from '../context/UserContext';
import { Button } from 'react-bootstrap';
import { firebaseDb } from '../services/firebase';

export const SecondNav = () => {
	const [{ user, options, profile }, userDispatch] = useContext(UserContext);

	const togglePref = async (newPref) => {
		if (!user) {
			userDispatch({
				type: 'SHOW_LOGIN',
				showLogin: true,
			});
		} else {
			const newOptions = {
				...options,
				preference: newPref,
			};
			firebaseDb.ref(`user/${user.uid}/options`).set(newOptions);
			userDispatch({
				type: 'SET_OPTIONS',
				options: newOptions,
			});
		}
	};

	const togglePrefForm = () => {
		const currentPref = (options && options.preference) || 'Hangout';
		return (
			<div className="d-flex align-items-center">
				{profile && profile.status === 'Single' && (
					<Button
						variant={currentPref === 'Dating' ? 'primary' : 'primary-outline'}
						onClick={() => togglePref('Dating')}
					>
						Dating
					</Button>
				)}

				<Button
					variant={currentPref === 'Hangout' ? 'primary' : 'primary-outline'}
					onClick={() => togglePref('Hangout')}
				>
					Hangout
				</Button>
			</div>
		);
	};

	return <div>{togglePrefForm()}</div>;
};
