import React, {Component, cloneElement} from 'react';
import {
  findDOMNode,
  unstable_renderSubtreeIntoContainer as renderSubtreeIntoContainer,
  unmountComponentAtNode
} from 'react-dom';
import targetIsDescendant from './targetIsDescendant';

const makeSureValue = (val, options, props) => options[val] === undefined ? props[val] : options[val];

export default options => ComposedComponent => {
  return class PortalHoc extends Component {
    componentDidMount() {
      const isOpen = makeSureValue('isOpen', options, this.props);
      this.ensurePortalState(isOpen);
    }

    componentWillReceiveProps(nextProps) {
      const {isOpen} = nextProps;
      if (isOpen !== this.props.isOpen) {
        this.ensurePortalState(isOpen);
      }
    }

    componentWillUnmount() {
      this.ensureClosedPortal();
    }

    ensureClosedPortal() {
      if (this.node) {
        unmountComponentAtNode(this.node);
        document.body.removeChild(this.node);
        this.portal = null;
        this.node = null;
        this.handleListeners('remove');
      }
    }

    ensureOpenPortal() {
      if (!this.node) {
        this.node = document.createElement('div');
        document.body.appendChild(this.node);
        this.portal = renderSubtreeIntoContainer(
          this,
          <ComposedComponent {...this.props} closePortal={this.ensureClosedPortal}/>,
          this.node
        );
        this.handleListeners('add');
      }
    }

    ensurePortalState(isOpen) {
      if (isOpen) {
        this.ensureOpenPortal();
      } else {
        this.ensureClosedPortal();
      }
    }

    handleListeners(type) {
      const escToClose = makeSureValue('escToClose', options, this.props);
      const clickToClose = makeSureValue('clickToClose', options, this.props);
      const handle = type === 'add' ? document.addEventListener : document.removeEventListener;
      if (escToClose) {
        handle('keydown', this.handleKeydown);
      }
      if (clickToClose) {
        handle('click', this.handleDocumentClick);
        handle('touchstart', this.handleDocumentClick);
      }
    }

    handleDocumentClick(e) {
      // close as long as they didn't click the toggle
      if (!targetIsDescendant(e.target, findDOMNode(this.portal))) {
        this.ensureClosedPortal();
      }
    }

    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.ensureClosedPortal();
      }
    }

    togglePortal() {
      if (this.node) {
        this.ensureClosedPortal();
      } else {
        this.ensureOpenPortal();
      }
    }

    render() {
      const toggle = makeSureValue('toggle', options, this.props);
      if (toggle) {
        const onClick = (e) => {
          this.togglePortal();
          if (toggle.props.onClick) {
            toggle.props.onClick(e);
          }
        };
        return cloneElement(toggle, {onClick});
      }
      return null;
    }

  }
}
