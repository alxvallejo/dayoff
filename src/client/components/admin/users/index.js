import React, { useContext, useState, useEffect } from 'react';

import { UserContext } from '../../../context/UserContext';
import { Button, Form, Table, ButtonGroup } from 'react-bootstrap';
import { firebaseDb } from '../../../services/firebase';
import { Formik } from 'formik';
import { map } from 'lodash';
const moment = require('moment');

export const Users = () => {
	const [{ user }, userDispatch] = useContext(UserContext);
	const [admins, setAdmins] = useState();

	const getAdmins = async () => {
		const resp = await firebaseDb.ref(`admins`).once('value');
		const results = resp.val();
		setAdmins(map(results));
	};

	useEffect(() => {
		getAdmins();
	}, []);

	const setAdmin = () => {
		firebaseDb.ref(`admins`).push({
			uid: user.uid,
			name: user.displayName,
		});
	};

	const search = async (e) => {
		const term = e.target.value;
		const resp = await firebaseDb.ref(`users`).orderByChild('');
	};

	const createAdmin = async (uid) => {
		const resp = await firebaseDb.ref(`users/${uid}`).once('value');
		const user = resp.val();
		console.log('user: ', user);
		// return false;
		const unix = moment().unix();
		const adminData = {
			uid: uid,
			time: unix,
			name: user.displayName,
			email: user.email,
		};
		// const newAdmins = [...admins, adminData];
		await firebaseDb.ref(`admins`).push(adminData);
		getAdmins();
		return adminData;
	};

	const actions = (admin) => {
		return (
			<ButtonGroup>
				{/* <Button onClick={(e) => removeSuggestion(sug)}>Remove</Button>
				<Button onClick={(e) => addCityAndStores(sug)}>Add City and Stores</Button> */}
			</ButtonGroup>
		);
	};

	console.log('admins: ', admins);

	return (
		<div>
			<h2>Users</h2>
			<Formik
				initialValues={{ uid: '' }}
				validate={(values) => {
					const errors = {};
					if (!values.uid) {
						errors.uid = 'Required';
					}
					if (admins && admins.find((x) => x.uid === values.uid)) {
						errors.uid = 'This user is already an admin';
					}
					return errors;
				}}
				onSubmit={async (values, { setSubmitting }) => {
					await createAdmin(values.uid);
					setSubmitting(false);
				}}
			>
				{({
					values,
					errors,
					touched,
					handleChange,
					handleBlur,
					handleSubmit,
					isSubmitting,
					/* and other goodies */
				}) => (
					<Form onSubmit={handleSubmit} inline className="ml-3">
						<Form.Label>Add Admin</Form.Label>
						<Form.Control
							type="text"
							placeholder="User UID"
							name="uid"
							onChange={handleChange}
							onBlur={handleBlur}
						/>
						{errors.uid && touched.uid && errors.uid}
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? `Saving...` : `Save`}
						</Button>
					</Form>
				)}
			</Formik>
			{admins && (
				<Table>
					<thead>
						<tr>
							<th>Admin</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{admins.map((admin, i) => {
							return (
								<tr key={i}>
									<td>{admin.name}</td>
									<td>{actions(admin)}</td>
								</tr>
							);
						})}
					</tbody>
				</Table>
			)}
		</div>
	);
};
