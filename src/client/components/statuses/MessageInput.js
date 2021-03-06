import React, { useState, useEffect, useContext, useRef } from 'react';
import { Col, Button } from 'react-bootstrap';
import { firebaseDb } from '../../services/firebase';
import { UserContext } from '../../context/UserContext';
import { StatusContext } from '../../context/StatusContext';
import { Formik } from 'formik';
import { map } from 'lodash';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
const moment = require('moment');

export const MessageInput = ({ status }) => {
	const [{ user, profile, inbox }, userDispatch] = useContext(UserContext);
	const [{ convo, convoKey }, statusDispatch] = useContext(StatusContext);
	console.log('convo: ', convo);

	const inputRef = useRef();

	const focus = () => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	};

	useEffect(focus, [convoKey]);

	const initialValues = {
		message: '',
	};

	const validate = (values) => {
		const errors = {};
		if (!values.message) {
			errors.message = 'Required';
		}
		return errors;
	};

	const handleMessage = async (values, { resetForm, setSubmitting }) => {
		if (!user) {
			userDispatch({
				type: 'SHOW_LOGIN',
				showLogin: true,
			});
		} else {
			const unix = moment().unix();

			let newConvoInfo;

			if (convo) {
				let yourStatus = convo.statusUid === user.uid;

				newConvoInfo = {
					...convo,
					time: unix,
					lastUid: user.uid,
					message: values.message,
					lastDisplayName: profile.displayName,
				};

				// update if necessary
				if (yourStatus) {
					newConvoInfo = {
						...newConvoInfo,
						status: {
							...newConvoInfo.status,
							statusPhoto: (profile.photo && profile.photo.thumbnail) || null,
						},
					};
				} else {
					newConvoInfo = {
						...newConvoInfo,
						reply: {
							...newConvoInfo.reply,
							replyPhoto: (profile.photo && profile.photo.thumbnail) || null,
						},
					};
				}
			} else {
				newConvoInfo = {
					key: convoKey,
					room: status.room,
					statusUid: status.uid,
					status: {
						statusID: status.key,
						statusDisplayName: status.displayName,
						statusPhoto: status.photoURL || null,
						statusAge: status.age,
						statusGender: status.gender,
						statusLocation: status.location,
						statusUserStatus: status.userStatus,
						statusPrefCategory: status.prefCategory,
					},
					replyUid: user.uid,
					reply: {
						replyDisplayName: profile.displayName,
						replyPhoto: (profile.photo && profile.photo.thumbnail) || null,
						replyAge: profile.age,
						replyGender: profile.gender,
						replyLocation: profile.location,
						replyUserStatus: profile.status,
						replyPrefCategory: profile.prefCategory,
					},
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
				requests.push(firebaseDb.ref(`inbox/${otherUid}/${convo.key}`).set({ ...newConvoInfo, read: false }));
			}

			const payload = {
				...values,
				statusUid: status.uid,
				uid: user.uid,
				displayName: profile.displayName,
				time: unix,
			};

			requests.push(firebaseDb.ref(`messages/${status.room}/${convoKey}`).push(payload));

			await Promise.all(requests);

			resetForm();
			setSubmitting(false);
		}
	};

	if (!convoKey) {
		return null;
	}

	return (
		<Formik initialValues={initialValues} validate={validate} onSubmit={handleMessage} enableReinitialize={false}>
			{({ handleSubmit, handleChange, handleBlur, values, isSubmitting, setSubmitting, resetForm }) => (
				<form onSubmit={handleSubmit} className="d-flex flex-grow-1">
					<input
						className="flex-grow-1"
						ref={inputRef}
						type="text"
						name="message"
						onChange={handleChange}
						autoComplete="off"
						value={values.message}
					/>
					<Button variant="outline-primary" type="submit" disabled={isSubmitting} className="ml-3">
						Send
					</Button>
				</form>
			)}
		</Formik>
	);
};
