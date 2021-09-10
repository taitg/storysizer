import React from 'react';
import moment from 'moment';
import { PageHeader, Button, Popconfirm, Card } from 'antd';
import { useHistory } from 'react-router-dom';
import { FcPlus, FcDisapprove } from 'react-icons/fc';

import Login from '../components/Login';
import './Home.css';

function Home({ db, user, onSignIn, onSignOut }) {
  const [sessions, setSessions] = React.useState([]);
  const history = useHistory();

  React.useEffect(() => {
    if (user) {
      db.ref(`users/${user.uid}/sessions`).on('value', (snapshot) => {
        if (snapshot.exists()) {
          const sessionIds = snapshot.val();
          if (sessionIds && sessionIds.length) {
            Promise.all(
              sessionIds.map(async (id) => {
                const s = await db.ref(`sessions/${id}`).get();
                return {
                  ...s.val(),
                  id,
                };
              })
            ).then((data) => {
              setSessions(data);
            });
          } else setSessions([]);
        } else setSessions([]);
      });

      return () => {
        db.ref(`users/${user.uid}/sessions`).off();
      };
    }
  }, [db, user]);

  if (!user || !user.uid) {
    return <Login onSignIn={onSignIn} />;
  }

  const onNewSession = async () => {
    const newSession = await db.ref('sessions').push({
      name: moment().format('[Story sizing] dddd, MMM Do YYYY'),
      desc: '',
      created: moment().valueOf(),
      creator: user.uid,
      creatorName: user.displayName,
      stories: [],
    });
    await db
      .ref(`users/${user.uid}/sessions/${sessions.length}`)
      .set(newSession.key);
    history.push(`/${newSession.key}`);
  };

  const onDeleteSession = (i) => {
    db.ref(`sessions/${sessions[i].id}`).remove();
    db.ref(`users/${user.uid}/sessions/${i}`).remove();
  };

  const renderSessionList = () => (
    <div className="SessionList">
      <Card title="Previous story sizing sessions">
        {sessions && sessions.length ? (
          sessions.map((session, i) => (
            <div className="SessionItem" key={`session${i}`}>
              <Button
                size="large"
                onClick={() => history.push(`/${session.id}`)}
              >
                {session.name}
              </Button>
              <Popconfirm
                title="Are you sure you want to delete this session?"
                onConfirm={() => onDeleteSession(i)}
                okText="Delete"
                cancelText="Cancel"
              >
                <Button size="large" type="link">
                  Delete
                </Button>
              </Popconfirm>
            </div>
          ))
        ) : (
          <i>You have no previous sessions</i>
        )}
      </Card>
    </div>
  );

  return (
    <div className="Home">
      <PageHeader
        title="Story Sizer"
        ghost={false}
        extra={
          <div className="HeaderExtra">
            <div>Welcome, {user.displayName}</div>
            <Button size="large" icon={<FcDisapprove />} onClick={onSignOut}>
              Sign out
            </Button>
          </div>
        }
      >
        <Button size="large" icon={<FcPlus />} onClick={onNewSession}>
          Start a new story sizing session
        </Button>
        {renderSessionList()}
      </PageHeader>
    </div>
  );
}

export default Home;
