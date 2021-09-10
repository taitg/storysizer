import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import firebase from 'firebase/app';
import 'firebase/database';
import 'firebase/auth';
import 'antd/dist/antd.css';

import { firebaseConfig } from './config';
import Home from './pages/Home';
import Session from './pages/Session';
import './App.css';

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

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
  const [user, setUser] = React.useState();

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

  const onSignOut = () => {
    // window.gapi.auth2.getAuthInstance().signOut();
    firebase.auth().signOut();
  };

  const childProps = {
    db,
    user,
    onSignIn,
    onSignOut,
  };

  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/:sessionId">
            <Session {...childProps} />
          </Route>
          <Route path="/">
            <Home {...childProps} />
          </Route>
        </Switch>
      </Router>
    </div>
  );
}

export default App;
