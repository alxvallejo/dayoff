import React, { useState, useEffect, useContext } from 'react';

import { useFormik } from 'formik';
import { UserContext } from '../context/UserContext';
import { firebaseDb, firebaseAuth } from '../services/firebase';
import { Button, Form } from 'react-bootstrap';
import InputMask from 'react-input-mask';
// import { string, min, max, matches } from 'yup';
const moment = require('moment');

const genders = ['Male', 'Female'];
const statuses = ['Single', 'Taken'];
const preferences = ['Male', 'Female'];

export const LoginForm = () => {
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

	const initialValues = {
		email: '',
		password: '',
		password_confirmation: '',
		displayName: '',
		birthday: '',
		gender: '',
		status: '',
		location: '',
		preference: '',
	};

	const validate = (value) => {
		const errors = {};
		if (!values.email) {
			errors.email = 'Required';
		} else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
			errors.email = 'Invalid email address';
		}
		if (!values.password) {
			errors.password = 'Required';
		} else {
			if (values.password_confirmation !== values.password) {
				errors.password_confirmation = 'Password does not match.';
			}
		}
		if (!values.displayName) {
			errors.displayName = 'Required';
		}
		if (!values.birthday) {
			errors.birthday = 'Required';
		} else {
			if (!moment(values.birthday).isValid()) {
				errors.birthday = 'Invalid birthday';
			} else {
				const age = moment().diff(values.birthday, 'years');
				if (age < 18) {
					errors.birthday = 'You must be 18 or older to use Dayoff.';
				}
			}
		}
		if (!values.status) {
			errors.status = 'Required';
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
	};

	const formik = useFormik({
		initialValues,
		validate,
		onSubmit: async (values) => {
			const unix = moment().unix();
			const age = moment().diff(values.birthday, 'years');
			const user_payload = {
				email: values.email,
				password: values.password,
			};

			const response = await firebaseAuth.createUserWithEmailAndPassword(values.email, values.password);
			console.log('response: ', response);

			userDispatch({
				type: 'SET_USER',
				user: response.user,
			});

			const uid = response.user.uid;

			const profile_payload = {
				uid,
				displayName: values.displayName,
				birthday: values.birthday,
				age,
				modified: unix,
				gender: values.gender,
				status: values.status,
				location: values.location,
				preference: values.preference,
			};
			await firebaseDb.ref(`users/${uid}/profile`).set(profile_payload);
			userDispatch({
				type: 'SET_PROFILE',
				profile: profile_payload,
			});
		},
		enableReinitialize: true,
	});
	const { handleChange, handleSubmit, values, setFieldValue, errors, touched, isSubmitting } = formik;

	return (
		<div>
			<Form onSubmit={handleSubmit}>
				{/* <h3>Set your profile.</h3> */}
				<Form.Group>
					<Form.Label>Email</Form.Label>
					<Form.Control type="email" name="email" onChange={handleChange} value={values.email} />
					{errors.email && touched.email && errors.email}
					<small id="emailHelp" className="form-text text-muted">
						We'll never share your email with anyone else.
					</small>
				</Form.Group>

				<Form.Group>
					<Form.Label>Password</Form.Label>
					<Form.Control type="password" name="password" onChange={handleChange} value={values.password} />
					{errors.password && touched.password && errors.password}
				</Form.Group>

				<Form.Group>
					<Form.Label>Confirm Password</Form.Label>
					<Form.Control
						type="password"
						name="password_confirmation"
						onChange={handleChange}
						value={values.password_confirmation}
					/>
					{errors.password_confirmation && touched.password_confirmation && errors.password_confirmation}
				</Form.Group>

				<Form.Group>
					<Form.Label>Username</Form.Label>
					<Form.Control type="text" name="displayName" onChange={handleChange} value={values.displayName} />
					{errors.displayName && touched.displayName && errors.displayName}
				</Form.Group>

				<Form.Group>
					<Form.Label>Birthday</Form.Label>
					<InputMask
						mask="99/99/9999"
						name="birthday"
						onChange={handleChange}
						value={values.birthday}
						className="form-control"
					/>
					{errors.birthday && touched.birthday && errors.birthday}
				</Form.Group>

				<Form.Group>
					<Form.Label>Gender</Form.Label>
					<Form.Row>{genders.map((gender, index) => preferenceLabel('gender', gender, index))}</Form.Row>
				</Form.Group>

				<Form.Group>
					<Form.Label>Status</Form.Label>
					<Form.Row>{statuses.map((status, index) => preferenceLabel('status', status, index))}</Form.Row>
				</Form.Group>

				<Form.Group>
					<Form.Label>Location</Form.Label>
					<Form.Control
						type="text"
						name="location"
						onChange={handleChange}
						value={values.location}
						className="text-center"
					/>
					{errors.location && touched.location && errors.location}
				</Form.Group>

				<Form.Group>
					<Form.Label>Preference</Form.Label>
					<Form.Row>
						{preferences.map((preference, index) => preferenceLabel('preference', preference, index))}
					</Form.Row>
				</Form.Group>

				<Button variant="outline-primary" type="submit" disabled={isSubmitting}>
					Sign Up
				</Button>
			</Form>
		</div>
	);
};
