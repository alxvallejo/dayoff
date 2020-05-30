import React from 'react';

import { Image } from 'react-bootstrap';

export const AvatarCircle = ({ profile, width }) => {
	if (!profile) {
		return <div></div>;
	}
	if (profile.photo) {
		return <Image src={profile.photo.thumbnail} roundedCircle style={{ width: width }} />;
	}
	const { gender } = profile;
	if (gender === 'Male') {
		return <Image src="https://img.icons8.com/dusk/80/000000/person-male.png" roundedCircle />;
	} else if (gender === 'Female') {
		return <Image src="https://img.icons8.com/dusk/80/000000/person-female.png" roundedCircle />;
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
	} else {
		return <div style={{ width: width, height: width }}></div>;
	}
};

export const Avatar = ({ profile }) => {
	if (!profile) {
		return <div></div>;
	}
	if (profile.photo) {
		return <Image src={profile.photo.path} rounded />;
	}
	const { gender } = profile;
	if (gender === 'Male') {
		return <Image src="https://img.icons8.com/dusk/80/000000/person-male.png" rounded />;
	} else if (gender === 'Female') {
		return <Image src="https://img.icons8.com/dusk/80/000000/person-female.png" rounded />;
	}
	return <div></div>;
};
