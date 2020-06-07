import React, { useState, useEffect, useContext } from 'react';

import { UserContext } from '../context/UserContext';
import { StatusContext } from '../context/StatusContext';
import { Row, Navbar, Nav, Col, Image, Modal, OverlayTrigger, Popover, Badge } from 'react-bootstrap';
import LinesEllipsis from 'react-lines-ellipsis';
import { ToggleMode } from './ToggleMode';

import { firebaseAuth } from '../services/firebase';

export const TopNav = () => {
	const [{ user, profile, options, inbox }, userDispatch] = useContext(UserContext);
	const [{ statuses }, statusDispatch] = useContext(StatusContext);
	const [selectedState, setSelectedState] = useState();

	const signOut = () => {
		firebaseAuth
			.signOut()
			.then(() => {
				localStorage.removeItem('authUser');
				userDispatch({
					type: 'SET_USER',
					user: null,
				});
			})
			.catch((e) => {
				console.log('e: ', e);
			});
	};

	const defaultNav = () => {
		return (
			<div>
				<div className="d-flex align-self-center">
					<a href="/" className="navbar-brand mr-0 align-self-end">
						Day
						<Image
							src="https://img.icons8.com/color/48/000000/beach-ball.png"
							style={{ marginTop: -4, width: 30 }}
						/>
						ff
					</a>
				</div>
			</div>
		);
	};

	const inboxOverlay = () => {
		const selectMsg = async (inboxMsg) => {
			const foundstatus = statuses.find((x) => x.uid === inboxMsg.statusUid);
			if (!foundstatus) {
				console.log('Could not find this status!');
			} else {
				statusDispatch({ type: 'SET_STATUS', status: foundstatus });
			}
			// const resp = await firebaseDb.ref(`shopping/${location.collectionId}/${inboxMsg.convoRef}`);
		};
		return (
			<Popover id="inbox-overlay">
				<Popover.Content>
					<h5>Recent Messages</h5>
					{inbox.map((inboxMsg, i) => {
						return (
							<div key={i} className="inbox-message" onClick={() => selectMsg(inboxMsg)}>
								<div className="byline">
									<i>{inboxMsg.lastDisplayName}</i>
								</div>
								<LinesEllipsis text={inboxMsg.message} className={inboxMsg.status} />
							</div>
						);
					})}
				</Popover.Content>
			</Popover>
		);
	};

	const showInbox = () => {
		if (!inbox) {
			return null;
		}
		const inboxCount = inbox.filter((x) => x.read == false).length;
		if (inboxCount < 1) {
			return null;
		}
		return (
			<OverlayTrigger trigger="click" key="inbox" placement="bottom" overlay={inboxOverlay()} rootClose={true}>
				<div className="inbox-button mt-3">
					<i className="fas fa-inbox" />
					<Badge pill variant="secondary" className="inbox-count">
						{inboxCount}
					</Badge>
				</div>
			</OverlayTrigger>
		);
	};

	if (!user) {
		return (
			<Navbar expand="lg">
				<div className="container">
					<Nav className="mr-3">
						<a onClick={() => userDispatch({ type: 'SHOW_LOGIN', showLogin: true })}>Login</a>
					</Nav>
					{defaultNav()}
				</div>
			</Navbar>
		);
	} else {
		return (
			<Navbar expand="lg">
				<div className="container">
					<Col>
						<Row>
							<div className="mr-3">
								<ToggleMode />
							</div>
							{profile && showInbox()}
						</Row>
					</Col>

					<Col className="d-flex justify-content-end">{defaultNav()}</Col>
				</div>
			</Navbar>
		);
	}
};
