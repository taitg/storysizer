import React from 'react';
import { ThemeSwitcherProvider } from 'react-css-theme-switcher';
import Cookies from 'universal-cookie';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';

import { firebaseConfig } from './config';
import AppRouter from './AppRouter';
import './App.css';

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const themes = {
  light: './static/css/antd.css',
  dark: './static/css/antd.dark.css',
};

function isUserEqual(googleUser, firebaseUser) {
  if (firebaseUser) {
    const { providerData } = firebaseUser;
    for (let i = 0; i < providerData.length; i++) {
      if (
        providerData[i].providerId ===
          firebase.auth.GoogleAuthProvider.PROVIDER_ID &&
        providerData[i].uid === googleUser.getBasicProfile().getId()
      ) {
        // we don't need to reauth the firebase connection
        return true;
      }
    }
  }
  return false;
}

function App() {
  const cookies = new Cookies();
  const darkModeCookie = cookies.get('darkMode');

  const [user, setUser] = React.useState();
  const [isDark, setIsDark] = React.useState(darkModeCookie === 'on');

  React.useEffect(() => {
    firebase.auth().onAuthStateChanged((user) => setUser(user));
  }, []);

  const onSignIn = (googleUser) => {
    if (
      googleUser &&
      googleUser.getBasicProfile() &&
      googleUser.getBasicProfile().getEmail()
      // &&
      // googleUser.getBasicProfile().getEmail().endsWith('@atb.com')
    ) {
      const unsubscribe = firebase.auth().onAuthStateChanged((firebaseUser) => {
        unsubscribe();
        if (!isUserEqual(googleUser, firebaseUser)) {
          const credential = firebase.auth.GoogleAuthProvider.credential(
            googleUser.getAuthResponse().id_token
          );
          firebase
            .auth()
            .signInWithCredential(credential)
            .catch((err) => {
              // handle errors
              console.log('login error', err);
            });
        } else {
          // user already signed in with firebase
          console.log('user already signed in with firebase');
        }
      });
    } else {
      // not an ATB email
      console.log('not an ATB email');
    }
  };

  // React.useEffect(() => {
  //   const darkMode = cookies.get('darkMode');
  //   if (darkMode ===
  // }, []);

  const onSignOut = () => {
    // window.gapi.auth2.getAuthInstance().signOut();
    firebase.auth().signOut();
  };

  const childProps = {
    db,
    user,
    onSignIn,
    onSignOut,
    isDark,
    setIsDark,
  };
  const defaultTheme = darkModeCookie === 'on' ? 'dark' : 'light';

  return (
    <div className="App">
      <ThemeSwitcherProvider defaultTheme={defaultTheme} themeMap={themes}>
        <AppRouter {...childProps} />
      </ThemeSwitcherProvider>
    </div>
  );
}

export default App;
