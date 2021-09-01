import React from 'react';
import authService from './AuthorizeService';

/**
 * <p>.</p>
 * @extends Component
 */
class SilentRenew extends React.Component {
  constructor(props) {
    super(props);
  }

  async componentDidMount() {
    await authService.signinSilentCallback();
  }

  render() {
    return (
      <div>Silent Renew</div>
    );
  }
}

export default SilentRenew;
