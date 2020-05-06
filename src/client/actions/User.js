import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { firebaseDb } from '../services/firebase';

export const getProfile = async (user) => {
	const [userDispatch] = useContext(UserContext);
	const resp = await firebaseDb.ref(`user/${user.uid}`).once('value');
	const profile = resp.val();
	if (profile) {
		userDispatch({
			type: 'SET_PROFILE',
			profile,
		});
	}
};
