import React from 'react';

import { Image } from 'react-bootstrap';

export const AvatarSelection = ({ gender, onSelect }) => {
	return (
		<div>
			<Image src="https://img.icons8.com/dusk/80/000000/person-female.png" />
			<Image src="https://img.icons8.com/dusk/80/000000/person-male.png" />
		</div>
	);
};
