import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import { StatusContext } from '../context/StatusContext';
import { Image, Row, Col, Badge, Container, Form, Button, Modal } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { RequestForm } from './statuses/RequestForm';
import { getProfile } from '../actions/User';

import { firebaseDb } from '../services/firebase';
import { map } from 'lodash';

const moment = require('moment');

export const Dashboard = () => {
	const [{ user, location, profile }, userDispatch] = useContext(UserContext);
	const [{ statuses, status }, statusDispatch] = useContext(StatusContext);
	const [tab, setTab] = useState('driver');

	useEffect(() => {
		if (user && !profile) {
			getProfile(user);
		}
	}, [user, profile]);

	const contactButton = (shopperstatus) => {
		if (user && shopperstatus.uid === user.uid) {
			return null;
		}
		return (
			<a onClick={() => statusDispatch({ type: 'SET_STATUS', status: shopperstatus })}>
				<Badge variant="secondary">Message</Badge>
			</a>
		);
	};

	return (
		<Container>
			<Row>
				<Col>
					<RequestForm />
				</Col>
				<Col className="ml-4">
					<div>
						{statuses &&
							statuses.map((shopperstatus, i) => {
								const displayDate = moment(shopperstatus.unix).fromNow();

								return (
									<Row key={i}>
										<div className="mr-4">
											<Image roundedCircle src={shopperstatus.photoURL} style={{ width: 50 }} />
										</div>
										<div>
											<Row>
												<Col>
													<h5>{shopperstatus.displayName}</h5>
													{contactButton(shopperstatus)}
												</Col>
												<div>
													<h5>
														<i>{displayDate}</i>
													</h5>
													<ReactQuill
														value={shopperstatus.status}
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
