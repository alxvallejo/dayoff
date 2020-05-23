/* eslint-disable no-tabs */
import React, { useState, useEffect, useContext } from 'react';
import './sass/globals.scss';
import { BrowserRouter } from 'react-router-dom';
import { UserContext } from './context/UserContext';
import { StatusContext } from './context/StatusContext';
import { Modal } from 'react-bootstrap';
import { Route, Switch } from 'react-router-dom';
import { keys, map, orderBy } from 'lodash';

import { Login } from './components/Login';
import { TopNav } from './components/TopNav';

import { Dashboard } from './components/Dashboard';
import { Footer } from './components/Footer';
import { AdminDash } from './components/admin';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Message } from './components/statuses/Message';
import { MessageInput } from './components/statuses/MessageInput';
import { Profile } from './components/Profile';

import { firebaseAuth, firebaseDb } from './services/firebase';

const App = () => {
	const [{ user, profile, showProfile, showLogin }, userDispatch] = useContext(UserContext);
	const [{ status }, statusDispatch] = useContext(StatusContext);
	const [loading, setLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState();

	useEffect(() => {
		const checkUser = async () => {
			firebaseAuth.onAuthStateChanged(async (u) => {
				console.log('user on app load: ', u);
				if (u) {
					if (!user) {
						userDispatch({
							type: 'SET_USER',
							user: u,
						});
					}

					// Get user info
					const resp = await firebaseDb.ref(`user/${u.uid}`).once('value');
					const userInfo = resp.val();
					console.log('userInfo: ', userInfo);
					if (userInfo) {
						if (userInfo.profile) {
							console.log('userInfo.profile: ', userInfo.profile);
							userDispatch({
								type: 'SET_PROFILE',
								profile: userInfo.profile,
							});
							// We need two listeners for messages
							// 1. Listen for messageSubscriptions on other entries
							// 2. Listen for messages on your entries
							if (u) {
								// INBOX
								firebaseDb.ref(`inbox/${u.uid}`).on('value', (snapshot) => {
									const results = snapshot.val();
									if (results) {
										let filteredInbox = map(results);

										filteredInbox = orderBy(filteredInbox, 'time', 'desc');

										if (status) {
											// If the convo is already active, we can mark it as read
											filteredInbox = filteredInbox.map((result, i) => {
												if (result.statusUid === status.uid) {
													if (result.read === false) {
														firebaseDb
															.ref(`inbox/${user.uid}/${result.key}`)
															.set({ ...result, read: true });
														return {
															...result,
															read: true,
														};
													} else {
														return result;
													}
												} else {
													return result;
												}
											});
										}

										userDispatch({
											type: 'SET_INBOX',
											inbox: filteredInbox,
										});
									} else {
										userDispatch({
											type: 'SET_INBOX',
											inbox: null,
										});
									}
								});

								// ARCHIVE (ONE-TIME)
								const resp = await firebaseDb.ref(`archive/${u.uid}`).once('value');
								const myArchive = resp.val();
								if (myArchive) {
									const formattedArchive = keys(myArchive).map((key) => {
										return {
											...myArchive[key],
											key,
										};
									});
									const lastStatus = formattedArchive.slice(0);
									userDispatch({
										type: 'SET_ARCHIVE',
										archive: formattedArchive,
									});
									userDispatch({
										type: 'SET_LAST_STATUS',
										lastStatus,
									});
								}
							}
						}
						if (userInfo.options) {
							userDispatch({
								type: 'SET_OPTIONS',
								options: userInfo.options,
							});
						}
						if (userInfo.profile) {
							userDispatch({
								type: 'SET_PROFILE',
								profile: userInfo.profile,
							});
						}
						if (userInfo.favorites) {
							userDispatch({
								type: 'SET_FAVORITES',
								favorites: userInfo.favorites,
							});
						}
						if (userInfo.seenTutorial) {
							userDispatch({
								type: 'SET_SEEN_TUTORIAL',
								seenTutorial: userInfo.seenTutorial,
							});
						}
					}
					await checkAdmin(u);
				}

				if (user && !profile) {
					userDispatch({
						type: 'SHOW_PROFILE',
						showProfile: true,
					});
				}

				setLoading(false);
			});
		};
		if (!user) {
			checkUser();
		}
		const checkAdmin = async (u) => {
			if (!u) {
				return;
			}
			// Check admins
			const resp = await firebaseDb.ref(`admins`).orderByChild('uid').equalTo(u.uid).once('value');
			const adminObj = resp.val();
			if (adminObj) {
				setIsAdmin(true);
			}
		};
	}, [user]);

	if (loading) {
		return (
			<div className="loading">
				<div className="lds-ring">
					<div></div>
					<div></div>
					<div></div>
					<div></div>
				</div>
			</div>
		);
	}

	const handleLoginClose = () => {
		userDispatch({ type: 'SHOW_LOGIN', showLogin: false });
	};

	return (
		<BrowserRouter>
			<TopNav />

			<Switch>
				<Route path="/privacy" component={PrivacyPolicy} />
				{isAdmin && <Route path="/admin" component={AdminDash} />}
				<Route path="/" component={Dashboard} />
			</Switch>
			<Footer />
			<Modal show={!!showLogin} onHide={handleLoginClose} centered>
				<Modal.Body>
					<Login handleClose={handleLoginClose} />
				</Modal.Body>
			</Modal>
			{/* <Modal
				show={showProfile}
				onHide={() => userDispatch({ type: 'SHOW_PROFILE', showProfile: false })}
				centered
			>
				<Modal.Header closeButton>
					<Modal.Title>{`Profile`}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Profile />
				</Modal.Body>
			</Modal> */}
			<Modal
				show={!!status}
				onHide={() => statusDispatch({ type: 'SET_STATUS', status: null })}
				centered
				scrollable
			>
				<Modal.Header closeButton>
					<Modal.Title>{`Chat with ${status && status.displayName}`}</Modal.Title>
				</Modal.Header>
				<Modal.Body>
					<Message status={status} />
				</Modal.Body>
				<Modal.Footer className="d-flex">
					<MessageInput status={status} className="flex-grow" />
				</Modal.Footer>
			</Modal>
		</BrowserRouter>
	);
};

export default App;
