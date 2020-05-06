import React, { useState, useEffect, useContext } from 'react';
import { Image, Row, Col, Badge, Form, Button, Modal } from 'react-bootstrap';
import { firebaseDb } from '../../services/firebase';
import { UserContext } from '../../context/UserContext';
import { StatusContext } from '../../context/StatusContext';
import { useFormik } from 'formik';
import { map } from 'lodash';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
const moment = require('moment');

export const Message = ({ status }) => {
	const [{ user, location, inbox }, userDispatch] = useContext(UserContext);
	// const [{ user, location, inbox }, statusDispatch] = useContext(UserContext);
	const [messages, setMessages] = useState();
	const [convoRef, setConvoRef] = useState();
	const [otherUid, setOtherUid] = useState();

	const getConvo = async () => {
		// Check if status is already in your inbox
		let existingConvoRef = null;
		if (inbox && status) {
			inbox.map((subscription) => {
				if (subscription.statusUid === status.uid) {
					existingConvoRef = subscription.convoRef;
				}
			});
		}

		if (existingConvoRef) {
			console.log('existingConvoRef: ', existingConvoRef);
			setConvoRef(existingConvoRef);
			firebaseDb.ref(`messages/${location.collectionId}/${existingConvoRef}`).on('value', (snapshot) => {
				const results = snapshot.val();
				if (results) {
					setMessages(map(results));
				}
			});
			// Also delete the messageInbox for your user (or set to read)
			const inboxMsg = inbox.find((x) => x.statusUid === status.uid);
			console.log('inboxMsg to delete: ', inboxMsg);
			if (inboxMsg) {
				firebaseDb.ref(`messageInbox/${location.collectionId}/${user.uid}/${inboxMsg.key}`).set({
					...inboxMsg,
					status: 'read',
				});
			}
		} else {
			const newRef = await firebaseDb.ref(`messages/${location.collectionId}/`).push();
			setConvoRef(newRef.key);
			firebaseDb.ref(`messages/${location.collectionId}/${newRef.key}`).on('value', (snapshot) => {
				const results = snapshot.val();
				if (results) {
					setMessages(map(results));
				}
			});
		}
	};

	useEffect(() => {
		getConvo();

		if (status.uid === user.uid) {
			// this is
		}
	}, []);

	const validate = (values) => {
		const errors = {};
		if (!values.message) {
			errors.message = 'Required';
		}
		return errors;
	};

	const initialValues = {
		message: '',
	};
	const formik = useFormik({
		initialValues,
		validate,
		onSubmit: async (values) => {
			if (!user) {
				userDispatch({
					type: 'SHOW_LOGIN',
					showLogin: true,
				});
			} else {
				const unix = moment().unix();
				const payload = {
					...values,
					statusUid: status.uid,
					uid: user.uid,
					displayName: user.displayName,
					time: unix,
				};

				firebaseDb.ref(`messages/${location.collectionId}/${convoRef}`).push(payload);
				formik.resetForm();
				// Prepare subscription payload
				const subscriptionPayload = {
					convoRef,
					lastUid: user.uid, // inverse uid
					statusUid: status.uid,
					lastMessage: values.message,
					displayName: user.displayName,
					time: unix,
					status: 'unread',
				};
				// Add the recipient's subscription
				firebaseDb.ref(`messageInbox/${location.collectionId}/${convoUid}`).push(subscriptionPayload);
				// Add to your subscriptions
				// ?? do we need this if we're already on the convo? prob not.
				// firebaseDb.ref(`messageInbox/${location.collectionId}/${user.uid}`).push(subscriptionPayload);
			}
		},
		enableReinitialize: true,
	});
	const { handleChange, handleSubmit, values, setFieldValue, errors, touched, isSubmitting } = formik;

	const displayInitialstatus = () => {
		if (!status) {
			return null;
		}
		const timeDisplay = moment.unix(status.time).fromNow();
		if (status.uid === user.uid) {
			// Float right
			return (
				<div className="message d-flex flex-column align-items-end">
					<div className="message-content right mb-1">
						<ReactQuill value={status.status} readOnly={true} theme={'bubble'} />
					</div>
					<div className="message-byline">
						{status.displayName} {timeDisplay}
					</div>
				</div>
			);
		} else {
			return (
				<div className="message d-flex flex-column align-items-start">
					<div className="message-content mb-1">
						<ReactQuill value={status.status} readOnly={true} theme={'bubble'} />
					</div>
					<div className="message-byline">
						{status.displayName} {timeDisplay}
					</div>
				</div>
			);
		}
	};

	const displayMessage = (message, i) => {
		const timeDisplay = moment.unix(message.time).fromNow();
		if (message.uid === user.uid) {
			// Float right
			return (
				<div className="message d-flex flex-column align-items-end">
					<div className="message-content right mb-1">{message.message}</div>
					<div className="message-byline">
						{message.displayName} {timeDisplay}
					</div>
				</div>
			);
		} else {
			return (
				<div className="message d-flex flex-column align-items-start">
					<div className="message-content mb-1">{message.message}</div>
					<div className="message-byline">
						{message.displayName} {timeDisplay}
					</div>
				</div>
			);
		}
	};

	const placeholder = () => {
		if (!status) {
			return null;
		}
		if (status.uid === user.uid) {
			// Your status
			return '';
		} else {
			return `Hi ${status.displayName}, I can help with your list!`;
		}
	};

	return (
		<Col>
			<div className="mb-3">
				{displayInitialstatus()}
				{messages &&
					messages.map((message, i) => {
						return (
							<div key={i} className="py-3">
								{displayMessage(message, i)}
							</div>
						);
					})}
			</div>
			<Form onSubmit={handleSubmit} inline>
				<Form.Group className="flex-grow-1">
					<Form.Control
						className="flex-grow-1"
						type="text"
						name="message"
						onChange={handleChange}
						placeholder={placeholder()}
					/>
					<Button variant="outline-primary" type="submit" disabled={isSubmitting} className="ml-3">
						Send
					</Button>
				</Form.Group>
			</Form>
		</Col>
	);
};
