import React, {Component, cloneElement} from 'react';
import {
  findDOMNode,
  unmountComponentAtNode,
  unstable_renderSubtreeIntoContainer as renderSubtreeIntoContainer
} from 'react-dom';
import targetIsDescendant from './targetIsDescendant';

const beforeCloseDefault = () => new Promise((resolve) => setTimeout(() => resolve(), 0));

export default options => ComposedComponent => {
  return class PortalHoc extends Component {
    componentDidMount() {
      const isOpen = this.makeSureValue('isOpen');
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

    ensureClosedPortal = () => {
      if (this.node) {
        const nodeToRemove = this.node;
        this.portal = null;
        this.node = null;
        this.toggle = null;
        this.handleListeners('remove');
        const beforeClose = this.makeSureValue('beforeClose') || beforeCloseDefault;
        beforeClose()
          .then(() => {
            // https://github.com/facebook/react/issues/6232
            unmountComponentAtNode(nodeToRemove);
            document.body.removeChild(this.node);
          })
      }
    };

    ensureOpenPortal = () => {
      if (!this.node) {
        this.node = document.createElement('div');
        document.body.appendChild(this.node);
        this.handleListeners('add');
      }

      // we could make some performance gains by doing a shallow equal on the props
      this.portal = renderSubtreeIntoContainer(
        this,
        <ComposedComponent {...this.props} closePortal={this.ensureClosedPortal}/>,
        this.node
      );
    };

    ensurePortalState(isOpen) {
      if (isOpen) {
        this.ensureOpenPortal();
      } else {
        this.ensureClosedPortal();
      }
    }

    handleListeners(type) {
      const escToClose = this.makeSureValue('escToClose');
      const clickToClose = this.makeSureValue('clickToClose');
      const handle = type === 'add' ? document.addEventListener : document.removeEventListener;
      if (escToClose) {
        handle('keydown', this.handleKeydown);
      }
      if (clickToClose) {
        handle('click', this.handleDocumentClick);
        handle('touchstart', this.handleDocumentClick);
      }
    }

    handleDocumentClick = (e) => {
      // close as long as they didn't click the modal or the toggle
      if (!targetIsDescendant(e.target, findDOMNode(this.portal))) {
        if (!this.toggle || !targetIsDescendant(e.target, findDOMNode(this.toggle))) {
          this.ensureClosedPortal();
        }
      }
    };

    handleKeydown = (e) => {
      if (e.key === 'Escape') {
        this.ensureClosedPortal();
      }
    };

    makeSureValue(val) {
      return this.props[val] === undefined ? options[val] : this.props[val];
    }

    togglePortal = () => {
      if (this.node) {
        this.ensureClosedPortal();
      } else {
        this.ensureOpenPortal();
      }
    };

    render() {
      const toggle = this.makeSureValue('toggle');
      if (toggle) {
        const onClick = (e) => {
          if (toggle.props.onClick) {
            toggle.props.onClick(e);
          }
          // the above click handler might be setting the state for the portal, and setState is async
          setTimeout(() => this.togglePortal(), 0);
        };
        const ref = (c) => {
          this.toggle = c
        };
        return cloneElement(toggle, {onClick, ref});
      }
      return null;
    }

  }
}
