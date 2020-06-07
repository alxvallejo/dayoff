import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserContext } from '../../context/UserContext';
import { StatusContext } from '../../context/StatusContext';
import { Row, Col, Button, Form } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useFormik } from 'formik';
import { firebaseDb } from '../../services/firebase';
import { AvatarCircle } from '../profile/Avatar';
import { Inbox } from './Inbox';
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
			setQueueRemove(null);
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
					gender: profile.gender,
					time: unix,
					photoURL: (profile.photo && profile.photo.thumbnail) || null,
					room,
					location: profile.location,
					userStatus: profile.status,
					prefCategory: profile.prefCategory,
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
				<Col xs={4}>
					<Form.Label>{lbl}</Form.Label>
					<div className="stat">{stat}</div>
				</Col>
			);
		};

		const deleteButton = () => {
			return queueRemove ? (
				<Col>
					<Form.Label>Are you sure?</Form.Label>
					<Row className="ml-1">
						<a className="text-danger mr-2" onClick={() => removeStatus()}>
							Delete
						</a>
						<a className="text-info" onClick={() => setQueueRemove(false)}>
							Cancel
						</a>
					</Row>
				</Col>
			) : (
				<Col>
					<a onClick={() => setQueueRemove(true)}>Delete</a>
				</Col>
			);
		};
		// const now = moment();
		const expiration = moment.unix(status.time).add(1, 'days');
		const timeToExpiration = expiration.diff(moment(), 'hours');

		return (
			<div className="mb-4 d-flex flex-column justify-content-center">
				<Form.Label>Stats</Form.Label>
				<Row className=" d-flex justify-content-center">
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
			<Row>
				<Col>
					<h3>{profile && profile.displayName}</h3>
				</Col>
				<Col className="d-flex justify-content-end">
					<a role="href" onClick={() => userDispatch({ type: 'SHOW_PROFILE', showProfile: true })}>
						Edit Profile
					</a>
				</Col>
			</Row>

			<Row className="align-items-center mb-3">
				<Col xs={3} className="d-flex flex-column align-items-center">
					<AvatarCircle profile={profile} width={50} className="img-thumbnail" />
				</Col>
				<Col>
					<Form onSubmit={handleSubmit} inline>
						<Form.Group className="flex-grow-1">
							<ReactQuill
								ref={statusInput}
								theme="bubble"
								name="status"
								value={values.status || ''}
								onChange={(e) => setFieldValue('status', e)}
								placeholder={``}
								className="status-input flex-grow-1 mr-3"
							/>
							{errors.status && touched.status && errors.status}
						</Form.Group>

						<Button variant="outline-primary" type="submit" disabled={isSubmitting}>
							Post
						</Button>
					</Form>
				</Col>
			</Row>

			{errors.profile && touched.status}

			<Row>
				<Col>{statusStats(lastStatus)}</Col>
			</Row>

			<div>
				<p>One status allowed at a time. Statuses expire in 24 hours.</p>
			</div>

			<Inbox />
		</div>
	);
};
