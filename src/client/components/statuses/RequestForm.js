import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../../context/UserContext';
import { StatusContext } from '../../context/StatusContext';
import { Row, Col, Button, Form, Modal } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useFormik } from 'formik';
import { firebaseDb } from '../../services/firebase';
const moment = require('moment');

export const RequestForm = () => {
	const [{ user, options, profile }, userDispatch] = useContext(UserContext);
	const [{ lastStatus }, statusDispatch] = useContext(StatusContext);
	const [archive, setArchive] = useState();
	const [queueRemove, setQueueRemove] = useState();

	const statusInput = useRef();

	const getArchive = async () => {
		const resp = await firebaseDb.ref(`archive/${user.uid}`).once('value');

		const myArchive = resp.val();
		setArchive(myArchive);
	};

	const getLastStatus = async () => {
		if (profile.lastStatusPath) {
			const resp = await firebaseDb.ref(profile.lastStatusPath).once('value');
			const last = resp.val();
			console.log('last: ', last);
			if (last) {
				statusDispatch({
					type: 'SET_LAST_STATUS',
					lastStatus: last,
				});
			}
		}
	};

	const removeStatus = async () => {
		if (profile.lastStatusPath) {
			const resp = await firebaseDb.ref(profile.lastStatusPath).remove();
			statusDispatch({
				type: 'SET_LAST_STATUS',
				lastStatus: null,
			});
			firebaseDb.ref(`users/${user.uid}/profile`).update({ lastStatusPath: null });
		}
	};

	useEffect(() => {
		getLastStatus();
	}, []);

	const preferenceLabel = (pref, index) => {
		return (
			<Form.Label key={index}>
				<Button
					variant={values.preference === pref ? 'primary' : 'primary-outline'}
					checked={values.preference === pref}
					onClick={() => setFieldValue('preference', pref)}
				>
					{pref}
				</Button>
			</Form.Label>
		);
	};

	const validate = (values) => {
		const errors = {};
		if (!profile) {
			errors.profile = 'You must save a profile before setting a status.';
		}
		if (!values.status) {
			errors.status = 'Required';
		}
		return errors;
	};

	const initialValues = lastStatus || {
		status: '',
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
				const room = options && options.preference === 'Dating' ? profile.prefCategory : 'Hangout';
				const unix = moment().unix();
				const lastStatusPath = `statuses/${room}/${user.uid}`;
				const payload = {
					...values,
					uid: user.uid,
					displayName: profile.displayName,
					age: profile.age,
					time: unix,
					photoURL: (profile.photo && profile.photo.thumbnail) || null,
					room,
					location: profile.location,
					lastStatusPath,
				};
				await firebaseDb.ref(lastStatusPath).set(payload);
				// update lastStatusPath in your profile
				const newProfile = {
					...profile,
					lastStatusPath,
				};
				firebaseDb.ref(`users/${user.uid}/profile`).set(newProfile);
				userDispatch({
					type: 'SET_PROFILE',
					profile: newProfile,
				});
				statusDispatch({
					type: 'SET_LAST_STATUS',
					lastStatus: payload,
				});
			}
		},
		enableReinitialize: true,
	});
	const { handleChange, handleSubmit, values, setFieldValue, errors, touched, isSubmitting } = formik;

	const statusStats = (status) => {
		if (!status) {
			return <div></div>;
		}
		const showStat = (lbl, stat) => {
			return (
				<Col>
					<Form.Label>{lbl}</Form.Label>
					<div className="stat">{stat}</div>
				</Col>
			);
		};

		const deleteButton = () => {
			return queueRemove ? (
				<Col>
					<Form.Label>Are you sure?</Form.Label>
					<Row>
						<Button variant="danger" onClick={() => removeStatus()}>
							Delete
						</Button>
						<Button variant="info" onClick={() => setQueueRemove(false)}>
							Cancel
						</Button>
					</Row>
				</Col>
			) : (
				<Col>
					<Form.Label onClick={() => setQueueRemove(true)} disabled={queueRemove}>
						Delete
					</Form.Label>
				</Col>
			);
		};
		// const now = moment();
		const expiration = moment.unix(status.time).add(1, 'days');
		const timeToExpiration = expiration.diff(moment(), 'hours');

		return (
			<div className="mb-4">
				<Form.Label>Stats</Form.Label>
				<Row>
					{showStat('Likes', status.likes || 0)}
					{showStat('Expires', lastStatus ? timeToExpiration + 1 + ' hours' : '')}
					{deleteButton()}
				</Row>
			</div>
		);
	};
	// console.log('values: ', values);

	return (
		<div>
			<h3>Enjoy your Dayoff.</h3>
			{errors.profile && touched.status}

			<div>
				<p>One status allowed at a time. Statuses expire in 24 hours.</p>
				<Form onSubmit={handleSubmit}>
					<Form.Group>{statusStats(lastStatus)}</Form.Group>
					<Form.Group>
						<Form.Label>Your status</Form.Label>
						<ReactQuill
							ref={statusInput}
							theme="bubble"
							name="status"
							value={values.status || ''}
							onChange={(e) => setFieldValue('status', e)}
							placeholder={``}
							className="status-input"
						/>
						{errors.status && touched.status && errors.status}
					</Form.Group>

					<Button variant="outline-primary" type="submit" disabled={isSubmitting}>
						Post
					</Button>
				</Form>
			</div>
		</div>
	);
};
