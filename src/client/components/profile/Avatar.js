import React from 'react';

import { Image } from 'react-bootstrap';

const maleAvatar = 'https://img.icons8.com/dusk/80/000000/person-male.png';
const femaleAvatar = 'https://img.icons8.com/dusk/80/000000/person-female.png';

export const AvatarCircle = ({ profile, width }) => {
	if (!profile) {
		return <div></div>;
	}
	if (profile.photo) {
		return <Image src={profile.photo.thumbnail} roundedCircle style={{ width: width }} />;
	}
	const { gender } = profile;
	if (gender === 'Male') {
		return <Image src={maleAvatar} roundedCircle />;
	} else if (gender === 'Female') {
		return <Image src={femaleAvatar} roundedCircle />;
	}
	return <div></div>;
};

export const AvatarStatus = ({ status, width }) => {
	if (!status) {
		return <div style={{ width: width, height: width }}></div>;
	}
	console.log('status.online', status.online);
	const presenceClass = status.online ? 'online' : '';
	if (status.photoURL) {
		return (
			<div className="avatar-wrapper">
				<Image src={status.photoURL} roundedCircle style={{ width: width, height: width }} />
				<div className={presenceClass} />
			</div>
		);
	} else if (status.gender) {
		if (status.gender === 'Male') {
			return (
				<div className="avatar-wrapper">
					<Image src={maleAvatar} roundedCircle style={{ width: width, height: width }} />
					<div className={presenceClass} />
				</div>
			);
		} else if (gender === 'Female') {
			return (
				<div className="avatar-wrapper">
					<Image src={femaleAvatar} roundedCircle style={{ width: width, height: width }} />
					<div className={presenceClass} />
				</div>
			);
		}
	} else {
		return <div style={{ width: width, height: width }}></div>;
	}
};

export const AvatarProfile = ({ profile }) => {
	if (!profile) {
		return <div></div>;
	}
	if (profile.photo) {
		return <Image src={profile.photo.path} rounded />;
	}
	const { gender } = profile;
	if (gender === 'Male') {
		return <Image src={maleAvatar} rounded />;
	} else if (gender === 'Female') {
		return <Image src={femaleAvatar} rounded />;
	}
	return <div></div>;
};

export const AvatarInbox = ({ photoURL, width, gender }) => {
	if (!photoURL) {
		if (gender == 'Male') {
			return <Image src={maleAvatar} rounded style={{ width: width, height: width }} />;
		} else {
			return <Image src={femaleAvatar} rounded style={{ width: width, height: width }} />;
		}
	}
	if (photoURL) {
		return <Image src={photoURL} rounded style={{ width: width, height: width }} />;
	}
};

export const Avatar = ({ photoURL, width }) => {
	if (!photoURL) {
		return <div></div>;
	}
	if (photoURL) {
		return <Image src={photoURL} rounded style={{ width: width, height: width }} />;
	}
};
