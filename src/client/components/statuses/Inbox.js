import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../../context/UserContext';
import { StatusContext } from '../../context/StatusContext';
import { Row, Col, Button, Form, Modal } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useFormik } from 'formik';
import { firebaseDb } from '../../services/firebase';
import { Avatar } from '../profile/Avatar';
import LinesEllipsis from 'react-lines-ellipsis';
const moment = require('moment');

export const Inbox = () => {
	const [{ user, options, profile, inbox }, userDispatch] = useContext(UserContext);
	const [{ statuses }, statusDispatch] = useContext(StatusContext);
	const [selectedConvo, setSelectedConvo] = useState();
	console.log('inbox: ', inbox);

	const selectMsg = async (inboxMsg) => {
		const foundstatus = statuses.find((x) => x.uid === inboxMsg.statusUid);
		if (!foundstatus) {
			console.log('Could not find this status!');
		} else {
			statusDispatch({ type: 'SET_STATUS', status: foundstatus });
		}
		// const resp = await firebaseDb.ref(`shopping/${location.collectionId}/${inboxMsg.convoRef}`);
	};

	const deleteConvo = async () => {
		const requests = [
			firebaseDb.ref(`inbox/${selectedConvo.statusUid}/${selectedConvo.key}`).remove(),
			firebaseDb.ref(`inbox/${selectedConvo.replyUid}/${selectedConvo.key}`).remove(),
		];
		await Promise.all(requests);
		setSelectedConvo(null);
	};

	return (
		<div>
			<h3>Messages</h3>
			{inbox &&
				inbox.map((inboxMsg, i) => {
					console.log('inboxMsg: ', inboxMsg);
					let yourStatus = user.uid === inboxMsg.statusUid;
					let avatarPhoto = yourStatus ? inboxMsg.reply.replyPhoto : inboxMsg.statusPhoto;
					const displayDate = moment.unix(inboxMsg.time).fromNow();
					return (
						<div key={i} className="inbox-message main">
							<Row>
								<Col
									className="mr-2"
									xs={2}
									className="d-flex justify-content-end"
									onClick={() => selectMsg(inboxMsg)}
								>
									<Avatar photoURL={avatarPhoto} width={40} />
								</Col>
								<Col>
									<div
										className="byline d-flex justify-content-between"
										onClick={() => selectMsg(inboxMsg)}
									>
										<i>{inboxMsg.lastDisplayName}</i>
										<i>{displayDate}</i>
									</div>
									<div className="d-flex justify-content-between">
										<div className="flex-grow-1" onClick={() => selectMsg(inboxMsg)}>
											<LinesEllipsis text={inboxMsg.message} className={inboxMsg.status} />
										</div>
										<div className="actions">
											<i className="fas fa-trash" onClick={() => setSelectedConvo(inboxMsg)} />
										</div>
									</div>
								</Col>
							</Row>
						</div>
					);
				})}
			<Modal show={!!selectedConvo} onHide={() => setSelectedConvo(null)} size="sm" centered>
				<Modal.Body>Are you sure you want to delete?</Modal.Body>
				<Modal.Footer className="d-flex">
					<Button onClick={() => setSelectedConvo(null)}>Cancel</Button>
					<Button variant="danger" onClick={() => deleteConvo()}>
						Delete
					</Button>
				</Modal.Footer>
			</Modal>
		</div>
	);
};
