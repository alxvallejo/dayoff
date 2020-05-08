import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { StatusContext } from '../context/StatusContext';
import { Image, Row, Col, Badge, Container, Form, Button, Modal } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { RequestForm } from './statuses/RequestForm';
import { Profile } from './Profile';

import { firebaseDb } from '../services/firebase';
import { map, keys, orderBy } from 'lodash';

const moment = require('moment');

export const Dashboard = () => {
	const [{ user, options, profile }, userDispatch] = useContext(UserContext);
	const [{ statuses }, statusDispatch] = useContext(StatusContext);
	const [tab, setTab] = useState('driver');

	useEffect(() => {
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
			}
		});
	}, [profile, options]);

	const contactButton = (status) => {
		if (user && status.uid === user.uid) {
			return null;
		}
		return (
			<a onClick={() => statusDispatch({ type: 'SET_STATUS', status: status })}>
				<Badge variant="secondary">Message</Badge>
			</a>
		);
	};

	return (
		<Container>
			<Row>
				<Col>{profile ? <RequestForm /> : <Profile />}</Col>
				<Col className="ml-4">
					<div>
						{statuses &&
							statuses.map((status, i) => {
								const displayDate = moment(status.unix).fromNow();

								return (
									<Row key={i}>
										<div className="mr-4">
											<Image roundedCircle src={status.photoURL} style={{ width: 50 }} />
										</div>
										<div>
											<Row>
												<Col>
													<h5>{status.displayName}</h5>
												</Col>
												<div>
													<h5>
														<i>{displayDate}</i>
													</h5>
													<ReactQuill
														value={status.status}
														readOnly={true}
														theme={'bubble'}
													/>
												</div>
											</Row>
										</div>
									</Row>
								);
							})}
					</div>
				</Col>
			</Row>
		</Container>
	);
};
