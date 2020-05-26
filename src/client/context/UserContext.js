import React, { useState, useReducer } from 'react';

export const UserContext = React.createContext();

const initialUser = {
	user: null,
	options: null,
	profile: null,
	favorites: [],
	tutorial: null,
	showLogin: false,
	loginForm: false,
	showProfile: false,
	inbox: null,
	lastStatus: null,
	archive: null,
};

const UserReducer = (state, action) => {
	switch (action.type) {
		case 'SET_USER':
			return {
				...state,
				user: action.user,
			};

		case 'SET_OPTIONS':
			return {
				...state,
				options: action.options,
			};

		case 'SET_PROFILE':
			return {
				...state,
				profile: action.profile,
			};

		case 'SET_STORE_LIST':
			return {
				...state,
				storeList: action.storeList,
			};

		case 'SET_FAVORITES':
			return {
				...state,
				favorites: action.favorites,
			};

		case 'SET_TUTORIAL':
			return {
				...state,
				tutorial: action.tutorial,
			};

		case 'SHOW_LOGIN':
			return {
				...state,
				showLogin: action.showLogin,
			};

		case 'LOGIN_FORM':
			return {
				...state,
				loginForm: action.loginForm,
			};

		case 'SHOW_PROFILE':
			return {
				...state,
				showProfile: action.showProfile,
			};

		// This is essentially a list of
		//
		case 'SET_INBOX':
			return {
				...state,
				inbox: action.inbox,
			};

		case 'SET_LAST_STATUS':
			return {
				...state,
				lastStatus: action.lastStatus,
			};

		case 'SET_ARCHIVE':
			return {
				...state,
				archive: action.archive,
			};

		default:
			return state;
	}
};

export const UserContextProvider = (props) => {
	const [state, dispatch] = useReducer(UserReducer, initialUser);

	return <UserContext.Provider value={[state, dispatch]}>{props.children}</UserContext.Provider>;
};
