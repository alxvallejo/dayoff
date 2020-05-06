import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { Button, ToggleButton, ToggleButtonGroup, Modal, Form, Row } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useFormik } from 'formik';
import { firebaseDb } from '../../services/firebase';
import { Profile } from '../Profile';
const moment = require('moment');

const preferences = ['Dating', 'Hangout'];

export const RequestForm = () => {
	const [{ user, location, profile }, userDispatch] = useContext(UserContext);
	const [loading, setLoading] = useState(true);
	const [status, setstatus] = useState();

	const getMystatus = async () => {
		const resp = await firebaseDb.ref(`shopping/${location.collectionId}/${user.uid}`).once('value');

		const mystatus = resp.val();
		setstatus(mystatus);
		setLoading(false);
	};

	useEffect(() => {
		if (user && location) {
			// getMystatus();
		}
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
		if (!values.preference) {
			errors.preference = 'Required';
		}
		if (!values.status) {
			errors.status = 'Required';
		}
		return errors;
	};

	const initialValues = status || {
		preference: (user && user.preference) || 'Hangout',
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
				const unix = moment().unix();
				const payload = {
					...values,
					uid: user.uid,
					time: values.time || unix,
					photoURL: user.photoURL,
				};
				await firebaseDb.ref(`statuses/${location.collectionId}/${user.uid}`).set(payload);
			}
		},
		enableReinitialize: true,
	});
	const { handleChange, handleSubmit, values, setFieldValue, errors, touched, isSubmitting } = formik;
	// console.log('values: ', values);

	return (
		<div>
			<h3>Set your vibe.</h3>

			<div>
				<p>Only 1 status allowed at a time. Statuses expire in 24 hours.</p>
				<Form onSubmit={handleSubmit}>
					<Form.Group>
						<Form.Label>Preference</Form.Label>
						<Form.Row>
							{preferences.map((preference, index) => preferenceLabel(preference, index))}
						</Form.Row>
					</Form.Group>

					<Form.Group>
						<Form.Label>Your status</Form.Label>
						<ReactQuill
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
