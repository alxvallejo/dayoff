import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { StatusContext } from '../context/StatusContext';
import { Media, Row, Col, Badge, Container, Form, Button, Modal } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { RequestForm } from './statuses/RequestForm';
import { LoginForm } from './LoginForm';
import { Profile } from './Profile';
import { AvatarStatus } from './profile/Avatar';

import { firebaseDb } from '../services/firebase';
import { map, keys, orderBy } from 'lodash';

const moment = require('moment');

export const Dashboard = () => {
	const [{ user, options, profile, showProfile, loginForm }, userDispatch] = useContext(UserContext);
	const [{ statuses, lastStatus }, statusDispatch] = useContext(StatusContext);

	const setLastStatusPresence = async () => {
		const room =
			options && options.preference === 'Dating' && profile && profile.prefCategory ? profile.pref : 'Hangout';
		console.log('room: ', room);
		if (user && profile) {
			// USER PRESENCE TRACKING
			// Assuming user is logged in
			let loadedLastStatus;
			if (!lastStatus && profile.lastStatusPath) {
				const resp = await firebaseDb.ref(profile.lastStatusPath).once('value');
				loadedLastStatus = resp.val();
			} else {
				loadedLastStatus = lastStatus;
			}
			console.log('loadedLastStatus: ', loadedLastStatus);

			if (room && loadedLastStatus) {
				const statusRef = firebaseDb.ref(`statuses/${room}/${user.uid}`);

				// Set the /users/:userId value to true
				statusRef.update({ online: true }).then(() => console.log('Online presence set'));

				// Remove the node whenever the client disconnects
				statusRef
					.onDisconnect()
					.update({ online: false })
					.then(() => console.log('On disconnect function configured.'));
			}
		}
	};

	useEffect(() => {
		console.log('profile at dashboard', profile);
		const room =
			options && options.preference === 'Dating' && profile && profile.prefCategory ? profile.pref : 'Hangout';
		firebaseDb.ref(`statuses/${room}`).on('value', (snapshot) => {
			const results = snapshot.val();
			if (results) {
				let filteredStatuses = keys(results).map((key) => {
					return {
						...results[key],
						key,
					};
				});
				filteredStatuses = orderBy(filteredStatuses, 'time', 'desc');
				statusDispatch({
					type: 'SET_STATUSES',
					statuses: filteredStatuses,
				});
			} else {
				statusDispatch({
					type: 'SET_STATUSES',
					statuses: null,
				});
			}
		});
		setLastStatusPresence();
	}, [profile, options]);

	const showLogin = () => {
		userDispatch({ type: 'SHOW_LOGIN', showLogin: true });
	};

	const showLoginForm = () => {
		// setLoginForm(true);
		userDispatch({
			type: 'LOGIN_FORM',
			loginForm: true,
		});
	};

	const openChat = (status) => {
		if (!user) {
			showLogin();
		} else {
			statusDispatch({ type: 'SET_STATUS', status: status });
		}
	};

	const contactButton = (status) => {
		if (user && status.uid === user.uid) {
			return null;
		}

		return (
			<a onClick={() => openChat(status)}>
				{/* <Badge variant="secondary">Chat</Badge> */}
				<i className="text-secondary chat-btn far fa-comment" />
			</a>
		);
	};

	const welcome = () => {
		return (
			<div>
				<p style={{ fontSize: 18 }}>The better way to meet people on your day off.</p>
				{loginForm ? <LoginForm /> : <Button onClick={() => showLoginForm()}>Get Started</Button>}
			</div>
		);
	};

	const viewLeftPanel = () => {
		if (user && profile) {
			if (loginForm) {
				return <LoginForm />;
			} else if (showProfile) {
				return <Profile />;
			} else {
				return <RequestForm />;
			}
		} else {
			return welcome();
		}
	};

	return (
		<Container>
			<Row>
				<Col className="left-col">{viewLeftPanel()}</Col>
				<Col className="ml-4">
					<div>
						{statuses &&
							statuses.map((status, i) => {
								console.log('status: ', status);
								const displayDate = moment.unix(status.time).fromNow();

								return (
									<div className="status-listing mb-3" key={i}>
										<Media>
											<AvatarStatus status={status} width={50} />
											<Media.Body className="ml-3">
												<div className="byline d-flex justify-content-between">
													<span>
														{status.displayName}
														{' · '}
														<span className="text-bold">{status.age}</span>
														{' · '}
														<span className="text-bold">{status.location}</span>
													</span>
													<i>{displayDate}</i>
												</div>
												<ReactQuill value={status.status} readOnly={true} theme={'bubble'} />
												<div>{contactButton(status)}</div>
											</Media.Body>
										</Media>
									</div>
								);
							})}
					</div>
				</Col>
			</Row>
		</Container>
	);
};
