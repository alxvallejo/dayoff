import React, { useContext, useState } from 'react';
import { firebaseAuth, googleAuth, facebookAuth, emailAuth } from '../services/firebase';
// import firebase from 'firebase';
import { UserContext } from '../context/UserContext';
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';
import { Container, Button, Form, Card, Modal } from 'react-bootstrap';

const moment = require('moment');

export const Login = ({ handleClose }) => {
	const [{ user }, userDispatch] = useContext(UserContext);
	// Configure FirebaseUI.
	const uiConfig = {
		// Popup signin flow rather than redirect flow.
		signInFlow: 'popup',
		// We will display Google and Facebook as auth providers.
		// signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID, firebase.auth.FacebookAuthProvider.PROVIDER_ID],
		signInOptions: [emailAuth.PROVIDER_ID, googleAuth.PROVIDER_ID],
		callbacks: {
			// Avoid redirects after sign-in.
			signInSuccessWithAuthResult: (authResult, redirectUrl) => {
				console.log('authResult', authResult);
				if (authResult.user) {
					userDispatch({
						type: 'SET_USER',
						user: authResult.user,
					});
					userDispatch({
						type: 'SHOW_LOGIN',
						showLogin: false,
					});
					localStorage.setItem('authUser', JSON.stringify(authResult.user));
				}
				handleClose();
				return true;
			},
		},
	};

	return (
		<Container className="login">
			<div className="mb-4 text-center font-weight-bold">
				<p>Login to Dayoff</p>
				<p>Only for verification purposes. Your data is never shared.</p>
			</div>
			<StyledFirebaseAuth uiConfig={uiConfig} firebaseAuth={firebaseAuth} />
		</Container>
	);
};
