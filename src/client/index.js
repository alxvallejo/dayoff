import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

import { UserContextProvider } from './context/UserContext';
import { AdminContextProvider } from './context/AdminContext';
import { StatusContextProvider } from './context/StatusContext';

ReactDOM.render(
	<UserContextProvider>
		<AdminContextProvider>
			<StatusContextProvider>
				<App />
			</StatusContextProvider>
		</AdminContextProvider>
	</UserContextProvider>,
	document.getElementById('root')
);
