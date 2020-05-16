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
	const [{ user, profile, inbox }, userDispatch] = useContext(UserContext);
	// const [{ user, location, inbox }, statusDispatch] = useContext(UserContext);
	const [messages, setMessages] = useState();
	const [convoKey, setConvoKey] = useState();
	const [newConvo, setNewConvo] = useState();
	const [convo, setConvo] = useState();

	const convoListener = (convoID) => {
		firebaseDb.ref(`messages/${status.room}/${convoID}`).on('value', (snapshot) => {
			const results = snapshot.val();
			if (results) {
				setMessages(map(results));
			}
		});
	};

	const getConvo = async () => {
		let existingConvo = null;
		if (inbox && status) {
			inbox.map((subscription) => {
				if (subscription.statusUid === status.uid) {
					existingConvo = subscription;
					setConvo(existingConvo);
					setConvoKey(existingConvo.key);
					firebaseDb.ref(`inbox/${user.uid}/${existingConvo.key}`).set({ ...existingConvo, read: true });
				}
			});
		}

		if (existingConvo) {
			setConvoKey(existingConvo.key);
			convoListener(existingConvo.key);
			// firebaseDb.ref(`messages/${status.room}/${existingConvo.key}`).on('value', (snapshot) => {
			// 	const results = snapshot.val();
			// 	if (results) {
			// 		setMessages(map(results));
			// 	}
			// });
		} else {
			const newRef = await firebaseDb.ref(`messages/${status.room}/`).push();
			setConvoKey(newRef.key);
			setNewConvo(true);
			convoListener(newRef.key);
			// firebaseDb.ref(`messages/${status.room}/${newRef.key}`).on('value', (snapshot) => {
			// 	const results = snapshot.val();
			// 	if (results) {
			// 		setMessages(map(results));
			// 	}
			// });
		}
	};

	useEffect(() => {
		getConvo();

		return () => {
			// unmount listeners
			if (convo) {
				firebaseDb.ref(`inbox/${status.room}/${convo.key}`).off('value', convoListener(convo.key));
			}
		};
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

				let newConvoInfo;

				if (convo) {
					newConvoInfo = {
						...convo,
						time: unix,
						lastUid: user.uid,
						message: values.message,
						lastDisplayName: profile.displayName,
					};
				} else {
					newConvoInfo = {
						key: convoKey,
						room: status.room,
						statusID: status.key,
						statusUid: status.uid,
						statusDisplayName: status.displayName,
						replyUid: user.uid,
						replyDisplayName: profile.displayName,
						time: unix,
						lastUid: user.uid,
						message: values.message,
						lastDisplayName: profile.displayName,
					};
				}

				if (!convo) {
					firebaseDb.ref(`inbox/${user.uid}/${convoKey}`).set({ ...newConvoInfo, read: true });
					firebaseDb.ref(`inbox/${status.uid}/${convoKey}`).set({ ...newConvoInfo, read: false });
				} else {
					let otherUid = convo.statusUid === user.uid ? convo.replyUid : convo.statusUid;
					firebaseDb.ref(`inbox/${otherUid}/${convoKey}`).set({ ...newConvoInfo, read: false });
				}

				const payload = {
					...values,
					statusUid: status.uid,
					uid: user.uid,
					displayName: user.displayName,
					time: unix,
				};

				firebaseDb.ref(`messages/${status.room}/${convoKey}`).push(payload);
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

	const handleFormSubmit = (values, { setSubmitting, resetForm }) => {
		handleSave(values, () => {
			resetForm(initialValues);
		});

		setSubmitting(false);
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
			<Form onSubmit={handleFormSubmit} inline>
				<Form.Group className="flex-grow-1">
					<Form.Control
						className="flex-grow-1"
						type="text"
						name="message"
						onChange={handleChange}
						autoComplete="off"
						// placeholder={placeholder()}
					/>
					<Button variant="outline-primary" type="submit" disabled={isSubmitting} className="ml-3">
						Send
					</Button>
				</Form.Group>
			</Form>
		</Col>
	);
};
