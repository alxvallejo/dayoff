import React, { useContext } from 'react';

import { UserContext } from '../../context/UserContext';
import { AdminContext } from '../../context/AdminContext';
import { Container, Row, Col, Tab, Nav } from 'react-bootstrap';
import { Users } from './users';
import { Activity } from './activity';

export const AdminDash = (props) => {
	const [{ user }, userDispatch] = useContext(UserContext);
	const [{ cities, selectedState, city }, adminDispatch] = useContext(AdminContext);

	return (
		<Container>
			<Tab.Container id="left-tabs-example" defaultActiveKey="activity">
				<h3 className="mb-3">Admin Dashboard</h3>
				<Row>
					<Col sm={3}>
						<Nav variant="pills" className="flex-column">
							<Nav.Item>
								<Nav.Link eventKey="activity">Activity</Nav.Link>
							</Nav.Item>
							<Nav.Item>
								<Nav.Link eventKey="users">Users</Nav.Link>
							</Nav.Item>
						</Nav>
					</Col>
					<Col sm={9}>
						<Tab.Content>
							<Tab.Pane eventKey="activity">
								<Activity />
							</Tab.Pane>
							<Tab.Pane eventKey="users">
								<Users />
							</Tab.Pane>
						</Tab.Content>
					</Col>
				</Row>
			</Tab.Container>
		</Container>
	);
};
