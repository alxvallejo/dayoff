import { useContext } from 'react';
import { StatusContext } from '../context/StatusContext';
import { firebaseDb } from '../services/firebase';

const [{ statuses, status }, statusDispatch] = useContext(StatusContext);

export const getStatuses = preference => {
	const resp = await firebaseDb.ref(`statuses/${preference}`).once('value');
	const statuses = resp.val();
	if (statuses) {
		statusDispatch({
			type: 'SET_STATUSES',
			statuses
		})
	}
}