import React, { useState, useEffect, useContext, useRef } from 'react';
import { Col, Button } from 'react-bootstrap';
import { firebaseDb } from '../../services/firebase';
import { UserContext } from '../../context/UserContext';
import { StatusContext } from '../../context/StatusContext';
import { Formik } from 'formik';
import { map } from 'lodash';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.bubble.css';
import ScrollToBottom from 'react-scroll-to-bottom';

const moment = require('moment');

export const Message = ({ status }) => {
	const [{ user, location, inbox }, userDispatch] = useContext(UserContext);
	const [{ convo }, statusDispatch] = useContext(StatusContext);
	const [messages, setMessages] = useState();
	const [newConvo, setNewConvo] = useState();
	// const [convo, setConvo] = useState();

	const lastMsg = useRef();

	const scrollToBottom = () => {
		if (lastMsg.current) {
			lastMsg.current.scrollIntoView({ behavior: 'smooth' });
		}
	};

	const convoListener = (convoID) => {
		firebaseDb.ref(`messages/${status.room}/${convoID}`).on('value', (snapshot) => {
			const results = snapshot.val();
			if (results) {
				let filteredResults = map(results);
				let lastMsg = filteredResults.pop();
				filteredResults.push({ ...lastMsg, lastMsg: true });

				setMessages(filteredResults);
				scrollToBottom();
			}
		});
	};

	const getConvo = async () => {
		let existingConvo = null;
		if (inbox && status) {
			inbox.map((subscription) => {
				if (subscription.statusUid === status.uid) {
					existingConvo = subscription;
					// setConvo(existingConvo);
					statusDispatch({
						type: 'SET_CONVO',
						convo: existingConvo,
					});
					firebaseDb.ref(`inbox/${user.uid}/${existingConvo.key}`).set({ ...existingConvo, read: true });
				}
			});
		}

		if (existingConvo) {
			convoListener(existingConvo.key);
		} else {
			const newRef = await firebaseDb.ref(`messages/${status.room}/`).push();
			setNewConvo(true);
			convoListener(newRef.key);
		}
	};

	useEffect(() => {
		getConvo();

		return () => {
			// unmount listeners
			if (convo) {
				firebaseDb.ref(`inbox/${status.room}/${convo.key}`).off('value', convoListener(convo.key));
			}
		};
	}, []);

	const displayInitialstatus = () => {
		if (!status) {
			return null;
		}
		const timeDisplay = moment.unix(status.time).fromNow();
		if (status.uid === user.uid) {
			// Float right
			return (
				<div className="message d-flex flex-column align-items-end">
					<div className="message-content right mb-1">
						<ReactQuill value={status.status} readOnly={true} theme={'bubble'} />
					</div>
					<div className="message-byline">
						{status.displayName} {timeDisplay}
					</div>
				</div>
			);
		} else {
			return (
				<div className="message d-flex flex-column align-items-start">
					<div className="message-content mb-1">
						<ReactQuill value={status.status} readOnly={true} theme={'bubble'} />
					</div>
					<div className="message-byline">
						{status.displayName} {timeDisplay}
					</div>
				</div>
			);
		}
	};

	const displayMessage = (message, i) => {
		const timeDisplay = moment.unix(message.time).fromNow();
		const ref = message.lastMsg ? lastMsg : null;
		if (message.uid === user.uid) {
			// Float right
			return (
				<div className="message d-flex flex-column align-items-end">
					<div className="message-content yours right mb-1">{message.message}</div>
					<div className="message-byline" ref={ref}>
						{message.displayName} {timeDisplay}
					</div>
				</div>
			);
		} else {
			return (
				<div className="message d-flex flex-column align-items-start">
					<div className="message-content theirs mb-1">{message.message}</div>
					<div className="message-byline" ref={ref}>
						{message.displayName} {timeDisplay}
					</div>
				</div>
			);
		}
	};

	return (
		<ScrollToBottom>
			<Col>
				<div className="mb-3">
					{displayInitialstatus()}
					{messages &&
						messages.map((message, i) => {
							return (
								<div key={i} className="py-3">
									{displayMessage(message, i)}
								</div>
							);
						})}
				</div>
				<div hidden ref={lastMsg} />
			</Col>
		</ScrollToBottom>
	);
};
