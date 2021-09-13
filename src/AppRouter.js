import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';

import Home from './pages/Home';
import Session from './pages/Session';

function AppRouter(props) {
  return (
    <Router>
      <Switch>
        <Route path="/:sessionId">
          <Session {...props} />
        </Route>
        <Route path="/">
          <Home {...props} />
        </Route>
      </Switch>
    </Router>
  );
}

export default AppRouter;
