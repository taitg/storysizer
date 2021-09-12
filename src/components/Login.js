import { Button, Modal } from 'antd';
import GoogleLogin from 'react-google-login';
import { FcGoogle } from 'react-icons/fc';

import { OAuthClientId } from '../config';
import './Login.css';

function Login({ onSignIn }) {
  return (
    <Modal title="Log in" visible={true} closable={false} footer={null} centered>
      <div className="Login">
        <div>Log in with your Google account to start a story sizing session</div>
        <div className="LoginButton">
          <GoogleLogin
            cookiePolicy="single_host_origin"
            clientId={OAuthClientId}
            onSuccess={onSignIn}
            onFailure={err => console.log('Google login failed', err)}
            render={({ onClick, disabled }) => (
              <Button size="large" onClick={onClick} disabled={disabled} icon={<FcGoogle />}>
                Sign in with Google
              </Button>
            )}
          />
        </div>
      </div>
    </Modal>
  );
}

export default Login;
