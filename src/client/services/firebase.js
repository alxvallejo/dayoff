import * as firebase from 'firebase/app';

import 'firebase/auth';
import 'firebase/database';
import 'firebase/analytics';

import { firebaseConfig } from './config';

export const firebaseApp = firebase.initializeApp(firebaseConfig);
export const firebaseAuth = firebase.auth();
export const firebaseDb = firebase.database();

export const googleAuth = firebase.auth.GoogleAuthProvider;
export const facebookAuth = firebase.auth.FacebookAuthProvider;
