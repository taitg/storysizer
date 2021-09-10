import React from 'react';
import { PageHeader, Button, Modal, Form, Input, Card } from 'antd';
import { useHistory, useParams } from 'react-router-dom';
import { FcDisapprove, FcGoodDecision } from 'react-icons/fc';

import Spinner from '../components/Spinner';
import './Session.css';

function Session({ db, user, onSignOut }) {
  const [session, setSession] = React.useState();
  const [voter, setVoter] = React.useState();
  const { sessionId } = useParams();
  const history = useHistory();

  React.useEffect(() => {
    db.ref(`sessions/${sessionId}`).on('value', (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setSession(data);
      }
    });

    return () => {
      db.ref(`sessions/${sessionId}`).off();
    };
  }, [db, sessionId]);

  const isCreator = user && session && session.creator === user.uid;
  const voters = session && session.voters ? session.voters : [];

  const onJoin = ({ voter }) => {
    if (!voters.some((v) => v.name === voter)) {
      db.ref(`sessions/${sessionId}/voters/${voters.length}`).set({
        name: voter,
      });
    }
    setVoter(voter);
  };

  const renderHeaderExtra = () => (
    <div className="HeaderExtra">
      {user ? (
        <React.Fragment>
          <div>Welcome, {user.displayName}</div>
          <Button size="large" icon={<FcDisapprove />} onClick={onSignOut}>
            Sign out
          </Button>
        </React.Fragment>
      ) : voter ? (
        <React.Fragment>
          <div>Welcome, {voter}</div>
          <Button
            size="large"
            icon={<FcDisapprove />}
            onClick={() => setVoter(undefined)}
          >
            Change name
          </Button>
        </React.Fragment>
      ) : (
        <div />
      )}
    </div>
  );

  const renderVoter = (name, vote) => (
    <div className="Voter">
      <div className="VoterName">{name}</div>
      <div className="VoterVote">{vote}</div>
    </div>
  );

  const renderVoters = () => {
    return (
      <Card title="Voters">
        <div className="VotersList">
          {renderVoter(session.creatorName, '-')}
          {voters.map((voter) => renderVoter(voter.name, voter.vote || '-'))}
        </div>
      </Card>
    );
  };

  return (
    <div className="Session">
      <PageHeader
        title="Story Sizer"
        ghost={false}
        onBack={() => history.push('/')}
        extra={renderHeaderExtra()}
      >
        {session ? (
          <React.Fragment>
            <h1>{session.name}</h1>
            {!isCreator && (!session.stories || !session.stories.length) && (
              <div>Waiting for {session.creatorName} to start a story</div>
            )}
            <div className="MainSection">{renderVoters()}</div>
          </React.Fragment>
        ) : (
          <Spinner />
        )}
      </PageHeader>
      {session && (
        <Modal closable={false} footer={null} visible={!user && !voter}>
          <Form onFinish={onJoin}>
            <div className="VoterForm">
              <Form.Item
                label="Enter your name"
                name="voter"
                rules={[{ required: true, message: 'A name is required' }]}
              >
                <Input />
              </Form.Item>
              <Button size="large" htmlType="submit" icon={<FcGoodDecision />}>
                Join
              </Button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}

export default Session;
