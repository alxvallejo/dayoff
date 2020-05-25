import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { firebaseDb } from '../services/firebase';

import { map, keys } from 'lodash';

export const getProfile = async (user) => {
	const resp = await firebaseDb.ref(`users/${user.uid}`).once('value');
	return resp.val();
};
