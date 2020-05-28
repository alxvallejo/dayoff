import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { Button, Form } from 'react-bootstrap';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import { useFormik } from 'formik';
import { firebaseDb } from '../../services/firebase';
const moment = require('moment');

export const RequestForm = () => {
	const [{ user, options, profile, lastStatus }, userDispatch] = useContext(UserContext);
	const [archive, setArchive] = useState();

	const getArchive = async () => {
		const resp = await firebaseDb.ref(`archive/${user.uid}`).once('value');

		const myArchive = resp.val();
		setArchive(myArchive);
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
				const payload = {
					...values,
					uid: user.uid,
					displayName: profile.displayName,
					age: profile.age,
					time: values.time || unix,
					photoURL: (profile.photo && profile.photo.thumbnail) || null,
					room,
				};
				await firebaseDb.ref(`statuses/${room}/${user.uid}`).set(payload);
			}
		},
		enableReinitialize: true,
	});
	const { handleChange, handleSubmit, values, setFieldValue, errors, touched, isSubmitting } = formik;
	// console.log('values: ', values);

	return (
		<div>
			<h3>Enjoy your Dayoff.</h3>
			{errors.profile && touched.status}

			<div>
				<p>One status allowed at a time. Statuses expire in 24 hours.</p>
				<Form onSubmit={handleSubmit}>
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
