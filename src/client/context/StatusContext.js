import React, { useReducer } from 'react';

export const StatusContext = React.createContext();

const initialStatus = {
	statuses: null,
	status: null,
	convo: null,
};

const StatusReducer = (state, action) => {
	switch (action.type) {
		case 'SET_STATUSES':
			return {
				...state,
				statuses: action.statuses,
			};
		case 'SET_STATUS':
			return {
				...state,
				status: action.status,
			};
		case 'SET_CONVO':
			return {
				...state,
				convo: action.convo,
			};

		default:
			return state;
	}
};

export const StatusContextProvider = (props) => {
	const [state, dispatch] = useReducer(StatusReducer, initialStatus);

	return <StatusContext.Provider value={[state, dispatch]}>{props.children}</StatusContext.Provider>;
};
