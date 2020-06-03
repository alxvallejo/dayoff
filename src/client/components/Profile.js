import React, { useContext, useEffect } from 'react';

import { Button, Form, Col } from 'react-bootstrap';
import { useFormik } from 'formik';
import { firebaseDb, storageRef } from '../services/firebase';
import { UserContext } from '../context/UserContext';
import { getPrefCategory } from '../utils/User';
import { AvatarSelection } from './profile/AvatarSelection';
import { Avatar } from './profile/Avatar';
import InputMask from 'react-input-mask';
import { calcAge } from '../utils/User';
import { AgePrefSelection } from './profile/AgePrefSelection';

const moment = require('moment');

const genders = ['Male', 'Female'];
const statuses = ['Single', 'Taken'];
const preferences = ['Male', 'Female'];

export const Profile = () => {
	const [{ user, profile }, userDispatch] = useContext(UserContext);

	const profileListener = () => {
		firebaseDb.ref(`users/${user.uid}/profile`).on('value', (snapshot) => {
			const updatedProfile = snapshot.val();
			userDispatch({
				type: 'SET_PROFILE',
				profile: updatedProfile,
			});
		});
	};

	useEffect(() => {
		// Listen for changes on profile
		profileListener();

		return () => {
			// unmount listeners
			firebaseDb.ref(`users/${user.uid}/profile`).off('value', profileListener());
		};
	}, []);

	const preferenceLabel = (field, pref, index) => {
		return (
			<Form.Label key={index} className="form-check-inline">
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
		if (!values.birthday) {
			errors.birthday = 'Required';
		} else {
			if (!moment(values.birthday).isValid()) {
				errors.birthday = 'Invalid birthday';
			}
			console.log('birthday', values.birthday);
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

	const initialValues =
		user && profile
			? {
					displayName: profile.displayName,
					birthday: profile.birthday,
					gender: profile.gender,
					status: profile.status,
					location: profile.location,
					preference: profile.preference,
					ageMin: profile.ageMin,
					ageMax: profile.ageMax,
			  }
			: {
					displayName: '',
					birthday: '',
					gender: '',
					status: '',
					location: '',
					preference: '',
					ageMin: '',
					ageMax: '',
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
				const age = calcAge(values.birthday);
				const payload = {
					...values,
					uid: user.uid,
					age,
					modified: unix,
					photoURL: user.photoURL,
					photo: profile.photo || null,
					prefCategory,
				};
				await firebaseDb.ref(`users/${user.uid}/profile`).set(payload);
				userDispatch({
					type: 'SET_PROFILE',
					profile: payload,
				});
				userDispatch({ type: 'SHOW_PROFILE', showProfile: false });
			}
		},
		enableReinitialize: true,
	});
	const { handleChange, handleSubmit, values, setFieldValue, errors, touched, isSubmitting } = formik;

	// Handel Age Range Input
	const handleAgeRange = (agePrefInput) => {
		setFieldValue('ageMin', agePrefInput.min);
		setFieldValue('ageMax', agePrefInput.max);
	};
	const agePrefValue = {
		min: values.ageMin,
		max: values.ageMax,
	};

	const controlClass = ''; // text-center
	const formClass = ''; // d-flex flex-column align-items-center justify-content-center text-center

	const handleImageSelect = async (e) => {
		console.log('e.target.files', e.target.files);
		const file = e.target.files[0];
		const imgPath = `profile_photos/${user.uid}/${file.name}`;
		const userStoragePath = `profile_photos/${user.uid}`;
		const imageRef = storageRef.child(imgPath);
		const userStorageRef = storageRef.child(userStoragePath);
		const snapshot = await imageRef.put(file);
		console.log('snapshot: ', snapshot);
	};

	return (
		<div>
			<a onClick={() => userDispatch({ type: 'SHOW_PROFILE', showProfile: false })}>Back</a>
			<div>
				<Form onSubmit={handleSubmit}>
					{/* <h3>Set your profile.</h3> */}
					<Form.Group>
						<Form.Label>Profile Photo</Form.Label>
						<Col xs={6} md={4}>
							<Avatar profile={profile} />
						</Col>

						<Form.Control
							type="file"
							name="photoURL"
							onChange={handleImageSelect}
							value={values.photoURL}
							className={controlClass}
						/>
						{errors.photoURL && touched.photoURL && errors.photoURL}
					</Form.Group>

					<Form.Group>
						<Form.Label>Username</Form.Label>
						<Form.Control
							type="text"
							name="displayName"
							onChange={handleChange}
							value={values.displayName}
							className={controlClass}
						/>
						{errors.displayName && touched.displayName && errors.displayName}
					</Form.Group>

					<Form.Group>
						<Form.Label>Birthday</Form.Label>
						<InputMask
							mask="99 / 99 / 9999"
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
						<Form.Label>Avatar</Form.Label>
						<AvatarSelection gender={values.gender} onSelect={(e) => setFieldValue('avatar', e)} />
						{errors.avatar && touched.avatar && errors.avatar}
					</Form.Group>

					<Form.Group>
						<Form.Label>Status</Form.Label>
						<Form.Row>{statuses.map((status, index) => preferenceLabel('status', status, index))}</Form.Row>
					</Form.Group>

					{values.status === 'Single' && (
						<Form.Group>
							<Form.Label>Interest Range</Form.Label>
							<AgePrefSelection
								birthday={values.birthday}
								agePref={agePrefValue}
								updateAgePref={handleAgeRange}
								isDirty={touched.agePref}
							/>
							{errors.agePref && touched.agePref && errors.agePref}
							<small id="emailHelp" className="form-text text-muted">
								Only views posts within this age range (in Dating mode)
							</small>
						</Form.Group>
					)}

					<Form.Group>
						<Form.Label>Location</Form.Label>
						<Form.Control
							type="text"
							name="location"
							onChange={handleChange}
							value={values.location}
							className={controlClass}
						/>
						{errors.location && touched.location && errors.location}
					</Form.Group>

					<Form.Group>
						<Form.Label>Preference</Form.Label>
						<Form.Row>
							{preferences.map((preference, index) => preferenceLabel('preference', preference, index))}
						</Form.Row>
					</Form.Group>

					{/* <Form.Group>
						<Form.Label>Facebook URL</Form.Label>
						<Form.Control type="text" name="facebook" onChange={handleChange} />
						{errors.facebook && touched.facebook && errors.facebook}
					</Form.Group> */}

					<Button variant="outline-primary" type="submit" disabled={isSubmitting}>
						Save Profile
					</Button>
				</Form>
			</div>
		</div>
	);
};
