import React, { useContext, useReducer, useState, useEffect } from 'react';

import { Container, Row, Col, Button, Form } from 'react-bootstrap';
import { useFormik } from 'formik';
import { firebaseDb } from '../services/firebase';
import { UserContext } from '../context/UserContext';
import { states } from './admin/states';
import { getPrefCategory } from '../utils/User';
const moment = require('moment');

const genders = ['Male', 'Female'];
const preferences = ['Male', 'Female'];

export const Profile = () => {
	const [{ user, profile }, userDispatch] = useContext(UserContext);

	const preferenceLabel = (field, pref, index) => {
		return (
			<Form.Label key={index}>
				<Button
					variant={values[field] === pref ? 'primary' : 'primary-outline'}
					checked={values[field] === pref}
					onClick={() => setFieldValue(field, pref)}
				>
					{pref}
				</Button>
			</Form.Label>
		);
	};

	const validate = (values) => {
		const errors = {};
		if (!values.displayName) {
			errors.displayName = 'Required';
		}
		if (!values.gender) {
			errors.gender = 'Required';
		}
		if (!values.location) {
			errors.location = 'Required';
		}
		if (!values.preference) {
			errors.preference = 'Required';
		}

		return errors;
	};

	const initialValues = user
		? {
				displayName: user.displayName,
				gender: user.gender,
				location: user.location,
				preference: user.preference,
		  }
		: {
				displayName: '',
				gender: '',
				location: '',
				preference: '',
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
				const prefCategory = getPrefCategory(values);
				const payload = {
					...values,
					uid: user.uid,
					modified: values.time || unix,
					photoURL: user.photoURL,
					prefCategory,
				};
				await firebaseDb.ref(`user/${user.uid}/profile`).set(payload);
				userDispatch({
					type: 'SET_PROFILE',
					profile: payload,
				});
			}
		},
		enableReinitialize: true,
	});
	const { handleChange, handleSubmit, values, setFieldValue, errors, touched, isSubmitting } = formik;
	// console.log('values: ', values);

	return (
		<div>
			<h3>Set your profile.</h3>

			<div>
				<Form onSubmit={handleSubmit}>
					<Form.Group>
						<Form.Label>Name</Form.Label>
						<Form.Control
							type="text"
							name="displayName"
							onChange={handleChange}
							value={values.displayName}
						/>
						{errors.displayName && touched.displayName && errors.displayName}
					</Form.Group>

					<Form.Group>
						<Form.Label>Gender</Form.Label>
						<Form.Row>{genders.map((gender, index) => preferenceLabel('gender', gender, index))}</Form.Row>
					</Form.Group>

					<Form.Group>
						<Form.Label>Location</Form.Label>
						<Form.Control type="text" name="location" onChange={handleChange} />
						{errors.location && touched.location && errors.location}
					</Form.Group>

					<Form.Group>
						<Form.Label>Preference</Form.Label>
						<Form.Row>
							{preferences.map((preference, index) => preferenceLabel('preference', preference, index))}
						</Form.Row>
					</Form.Group>

					<Form.Group>
						<Form.Label>Facebook URL</Form.Label>
						<Form.Control type="text" name="facebook" onChange={handleChange} />
						{errors.facebook && touched.facebook && errors.facebook}
					</Form.Group>

					<Button variant="outline-primary" type="submit" disabled={isSubmitting}>
						Save Profile
					</Button>
				</Form>
			</div>
		</div>
	);
};
