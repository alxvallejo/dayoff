import React, { useState, useEffect, useContext, useRef } from 'react';
import { Col, Form, Button } from 'react-bootstrap';
import { firebaseDb } from '../../services/firebase';
import { UserContext } from '../../context/UserContext';
import { StatusContext } from '../../context/StatusContext';
// import { useFormik } from 'formik';
import { Formik } from 'formik';
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

	const inputRef = useRef();

	const focus = () => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

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
		} else {
			const newRef = await firebaseDb.ref(`messages/${status.room}/`).push();
			setConvoKey(newRef.key);
			setNewConvo(true);
			convoListener(newRef.key);
		}
	};

	useEffect(() => {
		focus();
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

	const handleMessage = async (values) => {
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
					statusPhoto: status.photoURL,
					replyUid: user.uid,
					replyDisplayName: profile.displayName,
					replyPhoto: user.photoURL,
					time: unix,
					lastUid: user.uid,
					message: values.message,
					lastDisplayName: profile.displayName,
				};
			}

			let requests = [];

			if (!convo) {
				requests.push(firebaseDb.ref(`inbox/${user.uid}/${convoKey}`).set({ ...newConvoInfo, read: true }));
				requests.push(firebaseDb.ref(`inbox/${status.uid}/${convoKey}`).set({ ...newConvoInfo, read: false }));
			} else {
				let otherUid = convo.statusUid === user.uid ? convo.replyUid : convo.statusUid;
				requests.push(firebaseDb.ref(`inbox/${otherUid}/${convoKey}`).set({ ...newConvoInfo, read: false }));
			}

			const payload = {
				...values,
				statusUid: status.uid,
				uid: user.uid,
				displayName: user.displayName,
				time: unix,
			};

			requests.push(firebaseDb.ref(`messages/${status.room}/${convoKey}`).push(payload));

			await Promise.all(requests);

			resetForm();
			setSubmitting(false);
		}
	};

	// const formik = useFormik({
	// 	initialValues,
	// 	validate,
	// 	onSubmit: async (values) => {

	// 	},
	// 	enableReinitialize: true,
	// });
	// const {
	// 	handleChange,
	// 	handleSubmit,
	// 	values,
	// 	setFieldValue,
	// 	errors,
	// 	touched,
	// 	isSubmitting,
	// 	setSubmitting,
	// 	resetForm,
	// 	// innerRef,
	// } = formik;

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
					<div className="message-content yours right mb-1">{message.message}</div>
					<div className="message-byline">
						{message.displayName} {timeDisplay}
					</div>
				</div>
			);
		} else {
			return (
				<div className="message d-flex flex-column align-items-start">
					<div className="message-content theirs mb-1">{message.message}</div>
					<div className="message-byline">
						{message.displayName} {timeDisplay}
					</div>
				</div>
			);
		}
	};

	// const handleFormSubmit = async (e) => {
	// 	e.preventDefault();
	// 	handleSubmit(values);
	// };

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
			<Formik
				initialValues={initialValues}
				validate={validate}
				onSubmit={handleMessage}
				enableReinitialize={true}
			>
				{({ handleSubmit, handleChange, handleBlur, values, isSubmitting, setSubmitting, resetForm }) => (
					<Form onSubmit={handleSubmit} inline>
						<Form.Group className="flex-grow-1">
							{/* <Form.Control
								className="flex-grow-1"
								type="text"
								name="message"
								onChange={handleChange}
								autoComplete="off"
								autoFocus
								ref={inputRef}
								value={values.message}
								// placeholder={placeholder()}
							/> */}
							<input
								autoFocus
								type="text"
								name="message"
								onChange={handleChange}
								autoComplete="off"
								value={values.message}
							/>
							<Button variant="outline-primary" type="submit" disabled={isSubmitting} className="ml-3">
								Send
							</Button>
						</Form.Group>
						<input hidden type="submit" />
					</Form>
				)}
			</Formik>
		</Col>
	);
};
