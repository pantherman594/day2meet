import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import {
  CreateScreen,
  EditScreen,
} from './screens';

const App: React.FC = () => {
  return (
    <Router>
      <Switch>
        <Route path='/:event_id' component={EditScreen} />
        <Route path='/' component={CreateScreen} />
      </Switch>
    </Router>
  );
}

export default App;
