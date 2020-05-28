import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { StatusContext } from '../context/StatusContext';
import { Image, Row, Col, Badge, Container, Form, Button, Modal } from 'react-bootstrap';
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
	const [{ statuses }, statusDispatch] = useContext(StatusContext);

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
				<Badge variant="secondary">Chat</Badge>
			</a>
		);
	};

	const welcome = () => {
		return (
			<div>
				<h3>Welcome</h3>
				<p>Dayoff is a chat community where you're allowed one post at a time.</p>
				{loginForm ? <LoginForm /> : <Button onClick={() => showLoginForm()}>Get started.</Button>}
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
				<Col>{viewLeftPanel()}</Col>
				<Col className="ml-4">
					<div>
						{statuses &&
							statuses.map((status, i) => {
								const displayDate = moment.unix(status.time).fromNow();

								return (
									<div className="status-listing mb-3" key={i}>
										<Row>
											<Col className="mr-2" xs={3} className="d-flex justify-content-end">
												<AvatarStatus status={status} width={50} />
											</Col>
											<Col>
												<div className="byline">
													<span>
														<b>{status.displayName}</b> <i>{displayDate}</i>
													</span>
												</div>
												<ReactQuill value={status.status} readOnly={true} theme={'bubble'} />
												<div>{contactButton(status)}</div>
											</Col>
										</Row>
									</div>
								);
							})}
					</div>
				</Col>
			</Row>
		</Container>
	);
};
