import React from 'react';
import { map } from 'lodash';
import { useHistory, useParams } from 'react-router-dom';
import { PageHeader, Button, Modal, Form, Input, Card, Collapse, Popconfirm, Alert } from 'antd';
import {
  FcDisapprove,
  FcGoodDecision,
  FcAddDatabase,
  FcSupport,
  FcOk,
  FcIdea,
  FcNoIdea,
  FcApproval,
  FcDisclaimer,
  FcLock,
  FcUnlock,
  FcNeutralDecision,
  FcLink,
} from 'react-icons/fc';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import Spinner from '../components/Spinner';
import './Session.css';

function delay(fn, ms) {
  let timer = 0;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(fn.bind(this, ...args), ms || 0);
  };
}

function Session({ db, user, onSignOut }) {
  const [session, setSession] = React.useState();
  const [voter, setVoter] = React.useState();
  const [showOptionsModal, setShowOptionsModal] = React.useState(false);
  const [savingStoryName, setSavingStoryName] = React.useState(false);

  const history = useHistory();
  const { sessionId } = useParams();
  const [storyNameForm] = Form.useForm();

  React.useEffect(() => {
    db.ref(`sessions/${sessionId}`).on('value', snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.voters) {
          data.voters = map(data.voters, (voter, id) => ({ ...voter, id }));
        } else data.voters = [];
        if (data.currentStory) {
          storyNameForm.setFieldsValue({ storyName: data.currentStory.name });
        }
        setSession(data);
      }
    });

    return () => {
      db.ref(`sessions/${sessionId}`).off();
    };
  }, [db, sessionId, storyNameForm]);

  React.useEffect(() => {
    const addUserAsVoter = async () => {
      const newVoter = await db.ref(`sessions/${sessionId}/voters`).push({ name: user.displayName });
      setVoter({ name: user.displayName, id: newVoter.key });
    };
    if (user && session && !voter) {
      const userVoter = session.voters.find(v => v.name === user.displayName);
      if (!userVoter) {
        addUserAsVoter();
      } else {
        setVoter(userVoter);
      }
    }
  }, [db, user, session, sessionId, voter]);

  const isCreator = user && session && session.creator === user.uid;
  const stories = session && session.stories ? session.stories : [];

  const onJoin = async ({ voterName }) => {
    const existingVoter = session.voters.find(v => v.name === voterName);
    if (existingVoter) {
      setVoter(existingVoter);
    } else {
      const newVoter = await db.ref(`sessions/${sessionId}/voters`).push({
        name: voterName,
      });
      setVoter({
        name: voterName,
        id: newVoter.key,
      });
    }
    const date = new Date();
    date.setDate(date.getDate() + 365);
    document.cookie = `voterName=${voterName}; expires=${date.toUTCString()}; path=/`;
  };

  const onVote = option => {
    if (voter) {
      db.ref(`sessions/${sessionId}/voters/${voter.id}/vote`).set(option);
    }
  };

  const onSaveOptions = async ({ options }) => {
    await db.ref(`sessions/${sessionId}/options`).set(options.split(','));
    setShowOptionsModal(false);
  };

  const onStartStory = async () => {
    if (session.currentStory) {
      await db.ref(`sessions/${sessionId}/stories/${stories.length}`).set({
        ...session.currentStory,
        votes: session.voters,
      });
      await Promise.all(
        session.voters.map(voter => {
          return db.ref(`sessions/${sessionId}/voters/${voter.id}`).set({ name: voter.name });
        })
      );
      db.ref(`sessions/${sessionId}/showVotes`).set(false);
      db.ref(`sessions/${sessionId}/lockVotes`).set(false);
      db.ref(`sessions/${sessionId}/currentStory`).set({
        name: `Story #${stories.length + 2}`,
      });
    } else {
      db.ref(`sessions/${sessionId}/currentStory`).set({
        name: 'Story #1',
      });
    }
  };

  const onChangeStoryName = async name => {
    if (session.currentStory.name === name) return;
    await db.ref(`sessions/${sessionId}/currentStory/name`).set(name);
    setSavingStoryName(true);
    setTimeout(() => setSavingStoryName(false), 3000);
  };

  const onShowVotes = () => {
    db.ref(`sessions/${sessionId}/showVotes`).set(!session.showVotes);
  };

  const onLockVotes = () => {
    db.ref(`sessions/${sessionId}/lockVotes`).set(!session.lockVotes);
  };

  const onClearVotes = async () => {
    await Promise.all(
      session.voters.map(voter => {
        return db.ref(`sessions/${sessionId}/voters/${voter.id}`).set({ name: voter.name });
      })
    );
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
          <div>Welcome, {voter.name}</div>
          <Button size="large" icon={<FcDisapprove />} onClick={() => setVoter(undefined)}>
            Change name
          </Button>
        </React.Fragment>
      ) : (
        <div />
      )}
    </div>
  );

  const renderVoter = (name, vote, showVotes) => (
    <div className="Voter" key={name}>
      <div className="VoterName">{name}</div>
      <div className="VoterVote">{showVotes ? vote || '-' : vote ? <FcApproval /> : <FcNeutralDecision />}</div>
    </div>
  );

  const renderVoters = (voters = session.voters, showVotes = session.showVotes) => (
    <div className="VotersList">{voters.map(voter => renderVoter(voter.name, voter.vote, showVotes))}</div>
  );

  const renderVotersCard = () => <Card title="Voters">{renderVoters()}</Card>;

  const renderVoterModal = () => {
    const cookieName = document.cookie
      ? document.cookie
          .split('; ')
          .find(row => row.startsWith('voterName='))
          .split('=')[1]
      : '';
    return (
      <Modal closable={false} footer={null} visible={!user && !voter}>
        <Form onFinish={onJoin}>
          <div className="VoterForm">
            <Form.Item
              label="Enter your name"
              name="voterName"
              initialValue={cookieName}
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
    );
  };

  const renderOptionsModal = () => {
    const optionsText = session.options.join(',');
    return (
      <Modal footer={null} onCancel={() => setShowOptionsModal(false)} visible={showOptionsModal}>
        <Form onFinish={onSaveOptions}>
          <div className="OptionsForm">
            <Form.Item
              label="Enter options separated by commas"
              name="options"
              initialValue={optionsText}
              rules={[{ required: true, message: 'Some options are required' }]}
            >
              <Input size="large" />
            </Form.Item>
            <div className="OptionsFormSubmit">
              <Button size="large" htmlType="submit" icon={<FcOk />}>
                Save
              </Button>
            </div>
          </div>
        </Form>
      </Modal>
    );
  };

  const renderChooserHeader = () => {
    if (!session.currentStory) return 'No story started';
    if (!isCreator) return session.currentStory.name;
    return (
      <div className="ChooserHeaderInput">
        <Form form={storyNameForm}>
          <Form.Item noStyle name="storyName" initialValue={session.currentStory.name}>
            <Input
              autoFocus
              size="large"
              suffix={savingStoryName ? <FcOk /> : null}
              onKeyUp={delay(e => onChangeStoryName(e.target.value), 1000)}
            />
          </Form.Item>
        </Form>
      </div>
    );
  };

  const renderChooser = () => {
    const sessionVoter = voter && session.voters.find(v => v.id === voter.id);
    const vote = sessionVoter ? sessionVoter.vote : undefined;
    return (
      <Card title={renderChooserHeader()}>
        <div className="ChooserContent">
          <div className="Options">
            {session.options.map((option, i) => (
              <Button
                key={`option${i}`}
                className="OptionButton"
                size="large"
                danger={vote === option}
                disabled={!session.currentStory || session.lockVotes}
                onClick={() => onVote(option)}
              >
                {option}
              </Button>
            ))}
          </div>
          {isCreator && (
            <div className="OptionControls">
              {renderOptionsModal()}
              <Button size="large" icon={<FcSupport />} onClick={() => setShowOptionsModal(true)}>
                Edit options
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderStories = () => {
    return (
      <Card title="Previous Stories">
        <div className="StoriesContent">
          {session.stories && session.stories.length ? (
            <Collapse>
              {stories.map((story, i) => (
                <Collapse.Panel header={story.name} key={`story${i}`}>
                  {renderVoters(story.votes, true)}
                </Collapse.Panel>
              ))}
            </Collapse>
          ) : (
            <i>No other stories were sized yet</i>
          )}
        </div>
      </Card>
    );
  };

  const renderCreatorButtons = () => (
    <div className="CreatorButtons">
      {!session.currentStory ? (
        <Button size="large" icon={<FcAddDatabase />} onClick={onStartStory}>
          Start sizing a new story
        </Button>
      ) : (
        <Popconfirm
          title="Clear votes and start a new story?"
          onConfirm={onStartStory}
          okText="Yes"
          cancelText="Cancel"
        >
          <Button size="large" icon={<FcAddDatabase />}>
            Start sizing a new story
          </Button>
        </Popconfirm>
      )}
      {session.currentStory && (
        <React.Fragment>
          <Button size="large" icon={session.showVotes ? <FcNoIdea /> : <FcIdea />} onClick={onShowVotes}>
            {session.showVotes ? 'Hide votes' : 'Show votes'}
          </Button>
          <Button size="large" icon={session.lockVotes ? <FcUnlock /> : <FcLock />} onClick={onLockVotes}>
            {session.lockVotes ? 'Unlock voting' : 'Lock voting'}
          </Button>
          <Popconfirm title="Clear all votes for this story?" onConfirm={onClearVotes} okText="Yes" cancelText="Cancel">
            <Button size="large" icon={<FcDisclaimer />}>
              Clear Votes
            </Button>
          </Popconfirm>
        </React.Fragment>
      )}
      <CopyToClipboard text={window.location.href}>
        <Button size="large" icon={<FcLink />}>
          Copy Session Link
        </Button>
      </CopyToClipboard>
    </div>
  );

  const renderSession = () => (
    <React.Fragment>
      <h1>{session.name}</h1>
      {!isCreator && !session.currentStory && (
        <Alert message={`Waiting for ${session.creatorName} to start a story`} type="warning" showIcon />
      )}
      {!isCreator && session.lockVotes && (
        <Alert message={`${session.creatorName} has locked voting`} type="warning" showIcon />
      )}
      {isCreator && renderCreatorButtons()}
      <div className="MainSection">
        {renderVotersCard()}
        {renderChooser()}
      </div>
      {renderStories()}
    </React.Fragment>
  );

  return (
    <div className="Session">
      {session && renderVoterModal()}
      <PageHeader title="Story Sizer" ghost={false} onBack={() => history.push('/')} extra={renderHeaderExtra()}>
        {session ? renderSession() : <Spinner />}
      </PageHeader>
    </div>
  );
}

export default Session;
